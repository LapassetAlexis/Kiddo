import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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

  findAllForFamily(familyId: string): Promise<Reward[]> {
    return this.rewards.find({
      where: { family: { id: familyId } },
      order: { createdAt: 'DESC' },
    });
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
   * Redemption history: spend-type transactions that reference a reward id,
   * enriched with the child and reward data for the given family.
   */
  async getHistory(familyId: string, childId?: string): Promise<any[]> {
    const qb = this.transactions
      .createQueryBuilder('tx')
      .innerJoin('tx.child', 'child')
      .innerJoin('child.family', 'family')
      .leftJoin(Reward, 'reward', 'reward.id = tx.referenceId')
      .select([
        'tx.id',
        'tx.amount',
        'tx.type',
        'tx.referenceId',
        'tx.note',
        'tx.createdAt',
        'child.id',
        'child.name',
        'child.avatar',
        'reward.id',
        'reward.title',
        'reward.status',
      ])
      .where('family.id = :familyId', { familyId })
      .andWhere("tx.type = 'spend'")
      .orderBy('tx.createdAt', 'DESC');

    if (childId) {
      qb.andWhere('child.id = :childId', { childId });
    }

    return qb.getRawMany();
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
   * Child redeems a reward:
   * 1. Verify the child belongs to the family and has enough balance
   * 2. Insert a spend transaction
   * 3. If availability='once', mark reward as 'claimed'
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

    // Compute balance
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

    await this.ds.transaction(async em => {
      // Debit transaction
      await em.save(
        Transaction,
        em.create(Transaction, {
          type: 'spend',
          amount: reward.cost,
          referenceId: rewardId,
          note: `Échange : ${reward.title}`,
          child: { id: childId },
        }),
      );

      // If once, mark as claimed so it can't be redeemed again until parent grants/refuses
      if (reward.availability === 'once') {
        await em.update(Reward, rewardId, { status: 'claimed' });
      }

      // Notify parent (outbox pattern)
      const parentToken = (reward.family as any)?.fcmToken as string | undefined;
      if (parentToken) {
        await em.save(
          NotificationIntent,
          em.create(NotificationIntent, {
            fcmToken: parentToken,
            payload: {
              title: `${child.name} veut : ${reward.title}`,
              body: `Coûte ${reward.cost} pts — à valider`,
              data: { rewardId, childId },
            },
          }),
        );
      }
    });

    return this.rewards.findOneOrFail({ where: { id: rewardId } });
  }

  /**
   * Parent grants the reward:
   * 1. Verify ownership
   * 2. Mark reward as 'granted'
   * 3. Notify child
   */
  async grant(rewardId: string, familyId: string, childId: string): Promise<Reward> {
    const reward = await this.assertOwnership(rewardId, familyId);
    if (reward.status !== 'claimed') {
      throw new ConflictException('La récompense n\'a pas encore été réclamée');
    }

    const child = await this.children.findOne({ where: { id: childId, family: { id: familyId } } });
    if (!child) throw new NotFoundException('Child not found');

    await this.ds.transaction(async em => {
      await em.update(Reward, rewardId, { status: 'granted' });

      if (child.fcmToken) {
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
   * 1. Verify ownership
   * 2. Re-credit points (insert positive earn transaction)
   * 3. Reset reward to 'available' (for once availability) or leave (unlimited already available)
   * 4. Notify child
   */
  async refuse(rewardId: string, familyId: string, childId: string): Promise<Reward> {
    const reward = await this.assertOwnership(rewardId, familyId);
    if (reward.status !== 'claimed') {
      throw new ConflictException('La récompense n\'a pas encore été réclamée');
    }

    const child = await this.children.findOne({ where: { id: childId, family: { id: familyId } } });
    if (!child) throw new NotFoundException('Child not found');

    await this.ds.transaction(async em => {
      // Re-credit points
      await em.save(
        Transaction,
        em.create(Transaction, {
          type: 'earn',
          amount: reward.cost,
          referenceId: rewardId,
          note: `Remboursement : ${reward.title}`,
          child: { id: childId },
        }),
      );

      // Reset reward back to available
      await em.update(Reward, rewardId, { status: 'available' });

      // Notify child
      if (child.fcmToken) {
        await em.save(
          NotificationIntent,
          em.create(NotificationIntent, {
            fcmToken: child.fcmToken,
            payload: {
              title: 'Récompense refusée',
              body: `Tes ${reward.cost} pts ont été remboursés`,
              data: { rewardId },
            },
          }),
        );
      }
    });

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
