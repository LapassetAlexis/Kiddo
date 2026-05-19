import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Reward } from './reward.entity';
import { Transaction } from '../transactions/transaction.entity';
import { NotificationIntent } from '../notifications/notification-intent.entity';
import { Child } from '../children/child.entity';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)              private rewards: Repository<Reward>,
    @InjectRepository(Transaction)         private transactions: Repository<Transaction>,
    @InjectRepository(NotificationIntent)  private notifs: Repository<NotificationIntent>,
    @InjectRepository(Child)              private children: Repository<Child>,
    private ds: DataSource,
  ) {}

  async findAllForFamily(familyId: string): Promise<any[]> {
    const rewards = await this.rewards.find({
      where: { family: { id: familyId } },
      order: { createdAt: 'DESC' },
    });

    const claimedChildIds = rewards
      .filter(r => r.status === 'claimed' && r.claimedByChildId)
      .map(r => r.claimedByChildId!);

    if (!claimedChildIds.length) return rewards;

    const claimedChildren = await this.children.find({
      where: { id: In(claimedChildIds) },
    });
    const childMap = new Map(claimedChildren.map(c => [c.id, c]));

    return rewards.map(r =>
      r.status === 'claimed' && r.claimedByChildId
        ? {
            ...r,
            childId:    r.claimedByChildId,
            childName:  childMap.get(r.claimedByChildId)?.name  ?? '?',
            childEmoji: childMap.get(r.claimedByChildId)?.avatar ?? '👶',
          }
        : r,
    );
  }

  async create(dto: CreateRewardDto, familyId: string): Promise<Reward> {
    const reward = this.rewards.create({
      title: dto.title,
      description: dto.description,
      emoji: dto.emoji,
      cost: dto.cost,
      availability: dto.availability ?? 'unlimited',
      family: { id: familyId } as any,
    });
    return this.rewards.save(reward);
  }

  /**
   * Redemption history: spend transactions created at grant time,
   * enriched with child and reward data.
   */
  async getHistory(familyId: string, childId?: string): Promise<any[]> {
    const qb = this.transactions
      .createQueryBuilder('tx')
      .innerJoinAndSelect('tx.child', 'child')
      .innerJoin('child.family', 'family')
      .where('family.id = :familyId', { familyId })
      .andWhere("tx.type = 'spend'")
      .orderBy('tx.createdAt', 'DESC');

    if (childId) {
      qb.andWhere('child.id = :childId', { childId });
    }

    const spendTxs = await qb.getMany();
    if (!spendTxs.length) return [];

    const rewardIds = [...new Set(spendTxs.map(t => t.referenceId).filter(Boolean))] as string[];
    const rewards = rewardIds.length
      ? await this.rewards.find({ where: { id: In(rewardIds) } }).catch(() => [])
      : [];
    const rewardMap = new Map(rewards.map(r => [r.id, r]));

    return spendTxs
      .map(t => {
        const reward = rewardMap.get(t.referenceId!);
        if (!reward) return null;
        return {
          id:         t.id,
          createdAt:  t.createdAt,
          emoji:      reward.emoji ?? '🎁',
          title:      reward.title,
          childName:  (t.child as any)?.name,
          childEmoji: (t.child as any)?.avatar,
          pts:        t.amount,
          status:     'granted' as const,
        };
      })
      .filter(Boolean);
  }

  async update(id: string, familyId: string, dto: UpdateRewardDto): Promise<Reward> {
    await this.assertOwnership(id, familyId);
    await this.rewards.update(id, dto as Partial<Reward>);
    return this.rewards.findOneOrFail({ where: { id } });
  }

  async remove(id: string, familyId: string): Promise<void> {
    await this.assertOwnership(id, familyId);
    await this.rewards.delete(id);
  }

  /**
   * Child claims a reward:
   * 1. Verify child belongs to the family and has enough balance (pre-flight)
   * 2. Mark reward as 'claimed' and store which child claimed it
   * 3. Points are NOT debited here — they are debited when the parent grants
   * 4. Notify parent via outbox
   */
  async redeem(rewardId: string, childId: string, familyId: string): Promise<Reward> {
    const reward = await this.rewards.findOne({
      where: { id: rewardId, family: { id: familyId } },
      relations: ['family'],
    });
    if (!reward) throw new NotFoundException('Reward not found');
    if (reward.status !== 'available') throw new ConflictException('Cette récompense n\'est plus disponible');

    const child = await this.children.findOne({
      where: { id: childId, family: { id: familyId } },
    });
    if (!child) throw new ForbiddenException('Child not in this family');

    // Pre-flight balance check (actual debit happens on parent grant)
    const balanceRow = await this.transactions
      .createQueryBuilder('tx')
      .select(
        `COALESCE(SUM(CASE WHEN tx.type = 'earn' THEN tx.amount ELSE 0 END), 0)` +
        ` - COALESCE(SUM(CASE WHEN tx.type = 'spend' THEN tx.amount ELSE 0 END), 0)`,
        'balance',
      )
      .where('tx.childId = :childId', { childId })
      .getRawOne<{ balance: string }>();

    const balance = Number(balanceRow?.balance ?? 0);
    if (balance < reward.cost) {
      throw new BadRequestException('Pas assez de points');
    }

    // Mark as claimed — store who claimed it for use at grant/refuse time
    await this.rewards.update(rewardId, { status: 'claimed', claimedByChildId: childId });

    // Notify parent (outbox pattern)
    const parentToken = (reward.family as any)?.fcmToken as string | undefined;
    if (parentToken) {
      await this.notifs.save(
        this.notifs.create({
          fcmToken: parentToken,
          payload: {
            title: `${child.name} veut : ${reward.title}`,
            body: `Coûte ${reward.cost} pts — à valider`,
            data: { rewardId, childId },
          },
        }),
      );
    }

    return this.rewards.findOneOrFail({ where: { id: rewardId } });
  }

  /**
   * Parent grants the reward:
   * 1. Verify ownership and claimed status
   * 2. Check child still has enough balance
   * 3. Debit points (create spend transaction)
   * 4. Mark reward as 'granted' (once) or back to 'available' (unlimited)
   * 5. Notify child
   */
  async grant(rewardId: string, familyId: string, childId?: string): Promise<Reward> {
    const reward = await this.assertOwnership(rewardId, familyId);
    if (reward.status !== 'claimed') {
      throw new ConflictException('La récompense n\'a pas encore été réclamée');
    }

    const resolvedChildId = reward.claimedByChildId ?? childId;
    if (!resolvedChildId) throw new BadRequestException('Child ID manquant');

    const child = await this.children.findOne({
      where: { id: resolvedChildId, family: { id: familyId } },
    });

    // Balance check at grant time
    const balanceRow = await this.transactions
      .createQueryBuilder('tx')
      .select(
        `COALESCE(SUM(CASE WHEN tx.type = 'earn' THEN tx.amount ELSE 0 END), 0)` +
        ` - COALESCE(SUM(CASE WHEN tx.type = 'spend' THEN tx.amount ELSE 0 END), 0)`,
        'balance',
      )
      .where('tx.childId = :childId', { childId: resolvedChildId })
      .getRawOne<{ balance: string }>();

    const balance = Number(balanceRow?.balance ?? 0);
    if (balance < reward.cost) {
      throw new BadRequestException('L\'enfant n\'a plus assez de points');
    }

    await this.ds.transaction(async em => {
      // Debit points now that parent approved
      await em.save(
        Transaction,
        em.create(Transaction, {
          type: 'spend',
          amount: reward.cost,
          referenceId: rewardId,
          note: `Récompense : ${reward.title}`,
          child: { id: resolvedChildId },
        }),
      );

      // once → granted (done); unlimited → available (ready for next claim)
      const newStatus = reward.availability === 'once' ? 'granted' : 'available';
      await em.update(Reward, rewardId, { status: newStatus, claimedByChildId: null });

      if (child?.fcmToken) {
        await em.save(
          NotificationIntent,
          em.create(NotificationIntent, {
            fcmToken: child.fcmToken,
            payload: {
              title: '🎁 Récompense accordée !',
              body: `Tu obtiens : ${reward.title}`,
              data: { rewardId },
            },
          }),
        );
      }
    });

    return this.rewards.findOneOrFail({ where: { id: rewardId } });
  }

  /**
   * Parent refuses the reward:
   * Points were never debited, so no refund needed.
   * Just reset the reward to 'available'.
   */
  async refuse(rewardId: string, familyId: string, childId?: string): Promise<Reward> {
    const reward = await this.assertOwnership(rewardId, familyId);
    if (reward.status !== 'claimed') {
      throw new ConflictException('La récompense n\'a pas encore été réclamée');
    }

    const resolvedChildId = reward.claimedByChildId ?? childId;
    const child = resolvedChildId
      ? await this.children.findOne({ where: { id: resolvedChildId, family: { id: familyId } } })
      : null;

    // Reset to available (no refund needed — points were never debited)
    await this.rewards.update(rewardId, { status: 'available', claimedByChildId: null });

    if (child?.fcmToken) {
      await this.notifs.save(
        this.notifs.create({
          fcmToken: child.fcmToken,
          payload: {
            title: 'Récompense refusée',
            body: `Ta demande de "${reward.title}" n'a pas été acceptée`,
            data: { rewardId },
          },
        }),
      );
    }

    return this.rewards.findOneOrFail({ where: { id: rewardId } });
  }

  private async assertOwnership(rewardId: string, familyId: string): Promise<Reward> {
    const reward = await this.rewards.findOne({
      where: { id: rewardId, family: { id: familyId } },
      relations: ['family'],
    });
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }
}
