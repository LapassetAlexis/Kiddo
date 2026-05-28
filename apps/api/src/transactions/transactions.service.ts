import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Task } from '../tasks/task.entity';
import { Child } from '../children/child.entity';

const PAGE_SIZE = 20;

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BalanceStats {
  balance: number;
  earnedTotal: number;
  spentTotal: number;
  earnedThisWeek: number;
  spentThisWeek: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private txs: Repository<Transaction>,
    @InjectRepository(Task)        private tasks: Repository<Task>,
    @InjectRepository(Child)       private children: Repository<Child>,
  ) {}

  async getHistory(
    childId: string,
    familyId: string,
    page = 1,
  ): Promise<PaginatedTransactions> {
    await this.assertChildOwnership(childId, familyId);

    const [data, total] = await this.txs.findAndCount({
      where: { child: { id: childId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    return { data, total, page, pageSize: PAGE_SIZE };
  }

  async getBalance(childId: string, familyId: string): Promise<BalanceStats> {
    await this.assertChildOwnership(childId, familyId);

    // Start of the current ISO week (Monday 00:00:00 UTC)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday));

    const row = await this.txs
      .createQueryBuilder('tx')
      .select([
        `COALESCE(SUM(CASE WHEN tx.type = 'earn' THEN tx.amount ELSE 0 END), 0)              AS "earnedTotal"`,
        `COALESCE(SUM(CASE WHEN tx.type = 'spend' THEN tx.amount ELSE 0 END), 0)             AS "spentTotal"`,
        `COALESCE(SUM(CASE WHEN tx.type = 'earn'  AND tx."createdAt" >= :weekStart THEN tx.amount ELSE 0 END), 0) AS "earnedThisWeek"`,
        `COALESCE(SUM(CASE WHEN tx.type = 'spend' AND tx."createdAt" >= :weekStart THEN tx.amount ELSE 0 END), 0) AS "spentThisWeek"`,
      ].join(', '))
      .where('tx.childId = :childId', { childId })
      .andWhere("tx.currency = 'gold'")
      .setParameter('weekStart', weekStart.toISOString())
      .getRawOne<{
        earnedTotal: string;
        spentTotal: string;
        earnedThisWeek: string;
        spentThisWeek: string;
      }>();

    const earnedTotal    = Number(row?.earnedTotal    ?? 0);
    const spentTotal     = Number(row?.spentTotal     ?? 0);
    const earnedThisWeek = Number(row?.earnedThisWeek ?? 0);
    const spentThisWeek  = Number(row?.spentThisWeek  ?? 0);

    return {
      balance: earnedTotal - spentTotal,
      earnedTotal,
      spentTotal,
      earnedThisWeek,
      spentThisWeek,
    };
  }

  async getStreak(childId: string, familyId: string, timezone = 'Europe/Paris'): Promise<StreakStats> {
    await this.assertChildOwnership(childId, familyId);

    // Fetch all distinct calendar dates on which the child had at least one validated task.
    // We cast in the DB using AT TIME ZONE to respect the family timezone.
    const rows = await this.tasks
      .createQueryBuilder('task')
      .select(`DATE(task."validatedAt" AT TIME ZONE :tz)`, 'day')
      .where('task.childId = :childId', { childId })
      .andWhere("task.status = 'validated'")
      .andWhere('task."validatedAt" IS NOT NULL')
      .setParameter('tz', timezone)
      .groupBy('day')
      .orderBy('day', 'DESC')
      .getRawMany<{ day: string }>();

    if (rows.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    }

    // Parse dates as YYYY-MM-DD strings
    const days = rows.map(r => r.day);

    // Today's date in the given timezone (approximated via UTC offset for simplicity;
    // accurate enough since AT TIME ZONE in the query already bucketed by tz).
    const todayStr = this.todayInTimezone(timezone);

    // Walk through the sorted-DESC list to compute current and longest streak
    let currentStreak = 0;
    let longestStreak = 0;
    let runStreak     = 0;
    let prevDay: Date | null = null;

    // Check if the streak is still active (last activity today or yesterday)
    const lastActive     = new Date(days[0]);
    const today          = new Date(todayStr);
    const diffFromToday  = this.diffInDays(today, lastActive);
    const streakBroken   = diffFromToday > 1; // gap larger than 1 day means current streak is 0

    for (let i = 0; i < days.length; i++) {
      const current = new Date(days[i]);

      if (prevDay === null) {
        runStreak = 1;
      } else {
        const gap = this.diffInDays(prevDay, current);
        if (gap === 1) {
          runStreak++;
        } else {
          longestStreak = Math.max(longestStreak, runStreak);
          runStreak = 1;
        }
      }

      prevDay = current;
    }
    longestStreak = Math.max(longestStreak, runStreak);
    currentStreak = streakBroken ? 0 : runStreak;

    return {
      currentStreak,
      longestStreak,
      lastActiveDate: days[0],
    };
  }

  private async assertChildOwnership(childId: string, familyId: string): Promise<void> {
    const child = await this.children.findOne({
      where: { id: childId, family: { id: familyId } },
    });
    if (!child) throw new NotFoundException('Child not found');
  }

  /** Returns today's date string (YYYY-MM-DD) in the given IANA timezone. */
  private todayInTimezone(timezone: string): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone }); // 'en-CA' → YYYY-MM-DD
  }

  /** Difference in whole calendar days between two Date objects (a - b). */
  private diffInDays(a: Date, b: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((a.getTime() - b.getTime()) / msPerDay);
  }
}
