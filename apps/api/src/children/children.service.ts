import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Child } from './child.entity';
import { PinAttempt } from './pin-attempt.entity';
import { Transaction } from '../transactions/transaction.entity';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectRepository(Child)       private children: Repository<Child>,
    @InjectRepository(PinAttempt) private pinAttempts: Repository<PinAttempt>,
    @InjectRepository(Transaction) private transactions: Repository<Transaction>,
  ) {}

  findAllForFamily(familyId: string): Promise<Child[]> {
    return this.children.find({
      where: { family: { id: familyId } },
      order: { createdAt: 'ASC' },
    });
  }

  async create(dto: CreateChildDto, familyId: string): Promise<Child> {
    const pinHash = await bcrypt.hash(dto.pin, 12);
    const child = this.children.create({
      name: dto.name,
      avatar: dto.avatar,
      pinHash,
      family: { id: familyId } as any,
    });
    return this.children.save(child);
  }

  async findOneWithStats(id: string, familyId: string) {
    const child = await this.children.findOne({
      where: { id, family: { id: familyId } },
    });
    if (!child) throw new NotFoundException('Child not found');

    // Aggregate stats from the transactions ledger
    const txRows = await this.transactions.find({ where: { child: { id } } });
    const earnTxs = txRows.filter(t => t.type === 'earn');
    const spendTxs = txRows.filter(t => t.type === 'spend');
    const totalPtsEarned = earnTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalPtsSpent  = spendTxs.reduce((sum, t) => sum + t.amount, 0);
    const balance        = totalPtsEarned - totalPtsSpent;

    // Count validated tasks and granted rewards from referenceId cross-ref is expensive
    // so we use the transaction log as the source of truth for completed/claimed counts
    const tasksCompleted   = earnTxs.length;   // each earn = 1 validated task
    const rewardsClaimed   = spendTxs.length;  // each spend = 1 reward redemption

    return {
      ...child,
      stats: {
        balance,
        totalPtsEarned,
        tasksCompleted,
        rewardsClaimed,
      },
    };
  }

  async update(id: string, familyId: string, dto: UpdateChildDto): Promise<Child> {
    await this.assertOwnership(id, familyId);
    await this.children.update(id, dto);
    return this.children.findOneOrFail({ where: { id } });
  }

  async remove(id: string, familyId: string): Promise<void> {
    await this.assertOwnership(id, familyId);
    await this.children.delete(id);
  }

  async resetPin(id: string, familyId: string, newPin: string): Promise<void> {
    await this.assertOwnership(id, familyId);
    const pinHash = await bcrypt.hash(newPin, 12);
    await this.children.update(id, { pinHash });
    // Clear any lockout state after parent-initiated reset
    const attempt = await this.pinAttempts.findOne({ where: { child: { id } } });
    if (attempt) {
      await this.pinAttempts.update(attempt.id, { attemptCount: 0, lockedUntil: undefined as any });
    }
  }

  async getBalance(id: string, familyId: string): Promise<{ balance: number }> {
    await this.assertOwnership(id, familyId);

    const result = await this.transactions
      .createQueryBuilder('tx')
      .select(
        `COALESCE(SUM(CASE WHEN tx.type = 'earn' THEN tx.amount ELSE 0 END), 0)` +
        ` - COALESCE(SUM(CASE WHEN tx.type = 'spend' THEN tx.amount ELSE 0 END), 0)`,
        'balance',
      )
      .where('tx.childId = :id', { id })
      .getRawOne<{ balance: string }>();

    return { balance: Number(result?.balance ?? 0) };
  }

  private async assertOwnership(childId: string, familyId: string): Promise<Child> {
    const child = await this.children.findOne({
      where: { id: childId, family: { id: familyId } },
    });
    if (!child) throw new NotFoundException('Child not found');
    return child;
  }
}
