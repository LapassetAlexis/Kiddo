import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { Task } from '../tasks/task.entity';
import { Child } from '../children/child.entity';

// ── Mock factories ────────────────────────────────────────────────────────────

function mockRepo<T extends Record<string, any>>(): jest.Mocked<Repository<T>> {
  return {
    findOne:         jest.fn(),
    find:            jest.fn(),
    findAndCount:    jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

/** QB that terminates with getRawOne(). */
function mockQbRawOne(result: any) {
  const qb: any = {};
  qb.select       = jest.fn().mockReturnValue(qb);
  qb.where        = jest.fn().mockReturnValue(qb);
  qb.andWhere     = jest.fn().mockReturnValue(qb);
  qb.setParameter = jest.fn().mockReturnValue(qb);
  qb.getRawOne    = jest.fn().mockResolvedValue(result);
  return qb;
}

/** QB that terminates with getRawMany(). */
function mockQbRawMany(result: any[]) {
  const qb: any = {};
  ['select', 'where', 'andWhere', 'setParameter', 'groupBy', 'orderBy'].forEach(m => {
    qb[m] = jest.fn().mockReturnValue(qb);
  });
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  return qb;
}

// ── Test data builders ────────────────────────────────────────────────────────

function makeChild(overrides: Partial<Child> = {}): Child {
  return {
    id:     'child-1',
    name:   'Emma',
    avatar: '🦊',
    family: { id: 'fam-1' } as any,
    ...overrides,
  } as any;
}

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id:          'tx-1',
    type:        'earn',
    amount:      50,
    currency:    'gold',
    referenceId: 'task-1',
    note:        null as any,
    child:       makeChild(),
    createdAt:   new Date(),
    ...overrides,
  } as any;
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('TransactionsService', () => {
  let service:   TransactionsService;
  let txRepo:    jest.Mocked<Repository<Transaction>>;
  let taskRepo:  jest.Mocked<Repository<Task>>;
  let childRepo: jest.Mocked<Repository<Child>>;

  beforeEach(async () => {
    txRepo    = mockRepo<Transaction>();
    taskRepo  = mockRepo<Task>();
    childRepo = mockRepo<Child>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: txRepo },
        { provide: getRepositoryToken(Task),        useValue: taskRepo },
        { provide: getRepositoryToken(Child),       useValue: childRepo },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  // ── getHistory ───────────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('throws NotFoundException when child is not found', async () => {
      childRepo.findOne.mockResolvedValue(null);

      await expect(service.getHistory('child-1', 'fam-1')).rejects.toThrow(NotFoundException);
    });

    it('returns paginated transactions with correct metadata', async () => {
      childRepo.findOne.mockResolvedValue(makeChild());
      const txs = [makeTx(), makeTx({ id: 'tx-2' })];
      (txRepo.findAndCount as jest.Mock).mockResolvedValue([txs, 42]);

      const result = await service.getHistory('child-1', 'fam-1', 2);

      expect(txRepo.findAndCount).toHaveBeenCalledWith({
        where: { child: { id: 'child-1' } },
        order: { createdAt: 'DESC' },
        skip: 20,  // (page-1) * PAGE_SIZE = 1 * 20
        take: 20,
      });
      expect(result).toEqual({
        data:     txs,
        total:    42,
        page:     2,
        pageSize: 20,
      });
    });

    it('defaults to page 1 when not provided', async () => {
      childRepo.findOne.mockResolvedValue(makeChild());
      (txRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.getHistory('child-1', 'fam-1');

      expect(txRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });

  // ── getBalance ───────────────────────────────────────────────────────────────

  describe('getBalance', () => {
    it('throws NotFoundException when child is not found', async () => {
      childRepo.findOne.mockResolvedValue(null);

      await expect(service.getBalance('child-1', 'fam-1')).rejects.toThrow(NotFoundException);
    });

    it('correctly computes balance from raw totals', async () => {
      childRepo.findOne.mockResolvedValue(makeChild());
      const qb = mockQbRawOne({
        earnedTotal:    '100',
        spentTotal:     '30',
        earnedThisWeek: '40',
        spentThisWeek:  '10',
      });
      txRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getBalance('child-1', 'fam-1');

      expect(result).toEqual({
        balance:        70,   // 100 - 30
        earnedTotal:    100,
        spentTotal:     30,
        earnedThisWeek: 40,
        spentThisWeek:  10,
      });
    });

    it('returns all zeros when no transactions exist', async () => {
      childRepo.findOne.mockResolvedValue(makeChild());
      const qb = mockQbRawOne(null);
      txRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getBalance('child-1', 'fam-1');

      expect(result).toEqual({
        balance:        0,
        earnedTotal:    0,
        spentTotal:     0,
        earnedThisWeek: 0,
        spentThisWeek:  0,
      });
    });
  });

  // ── getStreak ────────────────────────────────────────────────────────────────

  describe('getStreak', () => {
    it('throws NotFoundException when child is not found', async () => {
      childRepo.findOne.mockResolvedValue(null);

      await expect(service.getStreak('child-1', 'fam-1')).rejects.toThrow(NotFoundException);
    });

    it('returns zeros when child has no validated tasks', async () => {
      childRepo.findOne.mockResolvedValue(makeChild());
      const qb = mockQbRawMany([]);
      taskRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getStreak('child-1', 'fam-1');

      expect(result).toEqual({
        currentStreak:  0,
        longestStreak:  0,
        lastActiveDate: null,
      });
    });

    it('returns currentStreak=2 and longestStreak=2 for yesterday and day-before-yesterday', async () => {
      childRepo.findOne.mockResolvedValue(makeChild());

      const today       = new Date();
      const fmt         = (d: Date) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const yesterday   = new Date(today); yesterday.setDate(today.getDate() - 1);
      const twoDaysAgo  = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);

      const qb = mockQbRawMany([
        { day: fmt(yesterday) },
        { day: fmt(twoDaysAgo) },
      ]);
      taskRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getStreak('child-1', 'fam-1');

      // diffFromToday=1 (yesterday) → streak NOT broken
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
      expect(result.lastActiveDate).toBe(fmt(yesterday));
    });

    it('returns currentStreak=0 when last activity was more than 1 day ago', async () => {
      childRepo.findOne.mockResolvedValue(makeChild());

      const today        = new Date();
      const fmt          = (d: Date) => d.toLocaleDateString('en-CA');
      const threeDaysAgo = new Date(today); threeDaysAgo.setDate(today.getDate() - 3);
      const fourDaysAgo  = new Date(today); fourDaysAgo.setDate(today.getDate() - 4);

      const qb = mockQbRawMany([
        { day: fmt(threeDaysAgo) },
        { day: fmt(fourDaysAgo) },
      ]);
      taskRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getStreak('child-1', 'fam-1');

      // diffFromToday=3 → streakBroken → currentStreak=0
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(2);
      expect(result.lastActiveDate).toBe(fmt(threeDaysAgo));
    });

    it('computes longestStreak correctly across non-consecutive days', async () => {
      childRepo.findOne.mockResolvedValue(makeChild());

      // Days (DESC): 10 days ago, 11 days ago, 12 days ago, then gap, 20 days ago, 21 days ago
      // Streak A = 3 (days 10-12), Streak B = 2 (days 20-21)
      // longestStreak = 3, currentStreak = 0 (last active > 1 day ago)
      const today = new Date();
      const daysAgo = (n: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() - n);
        return d.toLocaleDateString('en-CA');
      };

      const qb = mockQbRawMany([
        { day: daysAgo(10) },
        { day: daysAgo(11) },
        { day: daysAgo(12) },
        { day: daysAgo(20) },
        { day: daysAgo(21) },
      ]);
      taskRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getStreak('child-1', 'fam-1');

      expect(result.longestStreak).toBe(3);
      expect(result.currentStreak).toBe(0);
    });

    it('includes today in streak when last activity is today', async () => {
      childRepo.findOne.mockResolvedValue(makeChild());

      const today       = new Date();
      const fmt         = (d: Date) => d.toLocaleDateString('en-CA');
      const yesterday   = new Date(today); yesterday.setDate(today.getDate() - 1);

      const qb = mockQbRawMany([
        { day: fmt(today) },
        { day: fmt(yesterday) },
      ]);
      taskRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getStreak('child-1', 'fam-1');

      // diffFromToday=0 → streakBroken=false
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
    });

    it('passes the timezone parameter to the query builder', async () => {
      childRepo.findOne.mockResolvedValue(makeChild());
      const qb = mockQbRawMany([]);
      taskRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.getStreak('child-1', 'fam-1', 'America/New_York');

      expect(qb.setParameter).toHaveBeenCalledWith('tz', 'America/New_York');
    });
  });
});
