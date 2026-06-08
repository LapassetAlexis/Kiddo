import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { ChildrenService } from './children.service';
import { Child } from './child.entity';
import { PinAttempt } from './pin-attempt.entity';
import { Transaction } from '../transactions/transaction.entity';

// ── bcrypt mock ─────────────────────────────────────────────────────────────

jest.mock('bcrypt', () => ({
  hash:    jest.fn().mockResolvedValue('hashed-pin'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

// ── Repository mock factory ─────────────────────────────────────────────────

function mockRepo<T extends Record<string, any>>(): jest.Mocked<Repository<T>> {
  return {
    findOne:        jest.fn(),
    findOneOrFail:  jest.fn(),
    find:           jest.fn(),
    create:         jest.fn(),
    save:           jest.fn(),
    update:         jest.fn(),
    delete:         jest.fn(),
    count:          jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

// ── Test data builders ──────────────────────────────────────────────────────

function makeChild(overrides: Partial<Child> = {}): Child {
  return {
    id:             'child-1',
    name:           'Alice',
    avatar:         '🐶',
    color:          '#FFB300',
    sprite:         null,
    pinHash:        'hash',
    xp:             0,
    class:          'warrior',
    fcmToken:       null as any,
    pendingLevelUp: null,
    levelGoal:      null,
    levelGoalReward: null,
    family:         { id: 'fam-1' } as any,
    tasks:          [],
    rewards:        [],
    transactions:   [],
    pinAttempts:    [],
    createdAt:      new Date(),
    ...overrides,
  } as Child;
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id:          'tx-1',
    type:        'earn',
    currency:    'gold',
    amount:      100,
    referenceId: 'task-1',
    child:       makeChild(),
    createdAt:   new Date(),
    ...overrides,
  } as any;
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('ChildrenService', () => {
  let service: ChildrenService;
  let childrenRepo: jest.Mocked<Repository<Child>>;
  let pinAttemptsRepo: jest.Mocked<Repository<PinAttempt>>;
  let txsRepo: jest.Mocked<Repository<Transaction>>;

  beforeEach(async () => {
    childrenRepo    = mockRepo<Child>();
    pinAttemptsRepo = mockRepo<PinAttempt>();
    txsRepo         = mockRepo<Transaction>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChildrenService,
        { provide: getRepositoryToken(Child),       useValue: childrenRepo },
        { provide: getRepositoryToken(PinAttempt),  useValue: pinAttemptsRepo },
        { provide: getRepositoryToken(Transaction), useValue: txsRepo },
      ],
    }).compile();

    service = module.get<ChildrenService>(ChildrenService);

    // Reset bcrypt mocks between tests
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pin');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  // ── findAllForFamily ─────────────────────────────────────────────────────

  describe('findAllForFamily', () => {
    it('calls children.find with correct where clause and order', async () => {
      childrenRepo.find.mockResolvedValue([]);

      await service.findAllForFamily('fam-1');

      expect(childrenRepo.find).toHaveBeenCalledWith({
        where: { family: { id: 'fam-1' } },
        order: { createdAt: 'ASC' },
      });
    });

    it('maps children with level data (level=1 for xp=0)', async () => {
      const child = makeChild({ xp: 0 });
      childrenRepo.find.mockResolvedValue([child]);

      const result = await service.findAllForFamily('fam-1');

      expect(result).toHaveLength(1);
      expect((result[0] as any).level).toBe(1);
      expect((result[0] as any).levelTitle).toBeDefined();
      expect((result[0] as any).levelEmoji).toBeDefined();
    });

    it('returns empty array when family has no children', async () => {
      childrenRepo.find.mockResolvedValue([]);

      const result = await service.findAllForFamily('fam-1');

      expect(result).toEqual([]);
    });
  });

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('hashes the pin with bcrypt before saving', async () => {
      const saved = makeChild();
      childrenRepo.create.mockReturnValue(saved);
      childrenRepo.save.mockResolvedValue(saved);

      await service.create({ name: 'Alice', avatar: '🐶', pin: '1234', color: '#FFB300', class: 'warrior' }, 'fam-1');

      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 12);
    });

    it('calls children.create and children.save', async () => {
      const saved = makeChild();
      childrenRepo.create.mockReturnValue(saved);
      childrenRepo.save.mockResolvedValue(saved);

      await service.create({ name: 'Alice', avatar: '🐶', pin: '1234', color: '#FFB300', class: 'warrior' }, 'fam-1');

      expect(childrenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alice', pinHash: 'hashed-pin' }),
      );
      expect(childrenRepo.save).toHaveBeenCalled();
    });

    it('defaults color to #FFB300 and class to warrior when not provided', async () => {
      const saved = makeChild();
      childrenRepo.create.mockReturnValue(saved);
      childrenRepo.save.mockResolvedValue(saved);

      await service.create({ name: 'Bob', avatar: '🐱', pin: '0000' } as any, 'fam-1');

      expect(childrenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#FFB300', class: 'warrior' }),
      );
    });

    it('associates child with the given familyId', async () => {
      const saved = makeChild();
      childrenRepo.create.mockReturnValue(saved);
      childrenRepo.save.mockResolvedValue(saved);

      await service.create({ name: 'Alice', avatar: '🐶', pin: '1234' } as any, 'fam-42');

      expect(childrenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ family: { id: 'fam-42' } }),
      );
    });
  });

  // ── findOneWithStats ─────────────────────────────────────────────────────

  describe('findOneWithStats', () => {
    it('throws NotFoundException when child is not found', async () => {
      childrenRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneWithStats('child-99', 'fam-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when child belongs to a different family', async () => {
      childrenRepo.findOne.mockResolvedValue(null); // assertOwnership style: findOne returns null

      await expect(service.findOneWithStats('child-1', 'other-fam')).rejects.toThrow(NotFoundException);
    });

    it('computes balance from earn and spend transactions', async () => {
      const child = makeChild({ xp: 0 });
      childrenRepo.findOne.mockResolvedValue(child);
      txsRepo.find.mockResolvedValue([
        makeTransaction({ type: 'earn',  currency: 'gold', amount: 100, referenceId: 'task-1' }),
        makeTransaction({ type: 'spend', currency: 'gold', amount: 30,  referenceId: 'reward-1' }),
      ]);

      const result = await service.findOneWithStats('child-1', 'fam-1');

      expect(result.stats.balance).toBe(70);
      expect(result.stats.totalGoldEarned).toBe(100);
    });

    it('counts tasksCompleted excluding bonus transactions', async () => {
      const child = makeChild();
      childrenRepo.findOne.mockResolvedValue(child);
      txsRepo.find.mockResolvedValue([
        makeTransaction({ type: 'earn', currency: 'gold', amount: 10,  referenceId: 'task-1' }),
        makeTransaction({ type: 'earn', currency: 'gold', amount: 5,   referenceId: 'task-1:bonus' }),
        makeTransaction({ type: 'earn', currency: 'gold', amount: 10,  referenceId: 'task-2' }),
      ]);

      const result = await service.findOneWithStats('child-1', 'fam-1');

      expect(result.stats.tasksCompleted).toBe(2);
    });

    it('counts rewardsClaimed from spend transactions', async () => {
      const child = makeChild();
      childrenRepo.findOne.mockResolvedValue(child);
      txsRepo.find.mockResolvedValue([
        makeTransaction({ type: 'spend', currency: 'gold', amount: 20, referenceId: 'reward-1' }),
        makeTransaction({ type: 'spend', currency: 'gold', amount: 15, referenceId: 'reward-2' }),
      ]);

      const result = await service.findOneWithStats('child-1', 'fam-1');

      expect(result.stats.rewardsClaimed).toBe(2);
    });

    it('returns level data from withLevel', async () => {
      const child = makeChild({ xp: 0 });
      childrenRepo.findOne.mockResolvedValue(child);
      txsRepo.find.mockResolvedValue([]);

      const result = await service.findOneWithStats('child-1', 'fam-1');

      expect((result as any).level).toBe(1);
      expect(result.stats.level).toBe(1);
      expect(result.stats.xp).toBe(0);
    });

    it('returns zero stats when no transactions exist', async () => {
      childrenRepo.findOne.mockResolvedValue(makeChild());
      txsRepo.find.mockResolvedValue([]);

      const result = await service.findOneWithStats('child-1', 'fam-1');

      expect(result.stats.balance).toBe(0);
      expect(result.stats.totalGoldEarned).toBe(0);
      expect(result.stats.tasksCompleted).toBe(0);
      expect(result.stats.rewardsClaimed).toBe(0);
    });
  });

  // ── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('calls children.update with name only when dto has name', async () => {
      const child = makeChild();
      childrenRepo.findOne.mockResolvedValue(child);         // assertOwnership
      childrenRepo.findOneOrFail.mockResolvedValue(child);

      await service.update('child-1', 'fam-1', { name: 'Bob' });

      expect(childrenRepo.update).toHaveBeenCalledWith('child-1', { name: 'Bob' });
    });

    it('calls children.update with sprite only when dto has sprite', async () => {
      const child = makeChild();
      childrenRepo.findOne.mockResolvedValue(child);
      childrenRepo.findOneOrFail.mockResolvedValue(child);

      await service.update('child-1', 'fam-1', { sprite: 'warrior_v2' });

      expect(childrenRepo.update).toHaveBeenCalledWith('child-1', { sprite: 'warrior_v2' });
    });

    it('does NOT call children.update when dto is empty', async () => {
      const child = makeChild();
      childrenRepo.findOne.mockResolvedValue(child);
      childrenRepo.findOneOrFail.mockResolvedValue(child);

      await service.update('child-1', 'fam-1', {});

      expect(childrenRepo.update).not.toHaveBeenCalled();
      expect(childrenRepo.findOneOrFail).toHaveBeenCalledWith({ where: { id: 'child-1' } });
    });

    it('does NOT allow updating avatar or color fields', async () => {
      const child = makeChild();
      childrenRepo.findOne.mockResolvedValue(child);
      childrenRepo.findOneOrFail.mockResolvedValue(child);

      await service.update('child-1', 'fam-1', { avatar: '🐱', color: '#FF0000' } as any);

      expect(childrenRepo.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when child not in family', async () => {
      childrenRepo.findOne.mockResolvedValue(null);

      await expect(service.update('child-1', 'other-fam', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('calls children.delete when child belongs to the family', async () => {
      childrenRepo.findOne.mockResolvedValue(makeChild());

      await service.remove('child-1', 'fam-1');

      expect(childrenRepo.delete).toHaveBeenCalledWith('child-1');
    });

    it('throws NotFoundException when child not found in family', async () => {
      childrenRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('child-1', 'fam-1')).rejects.toThrow(NotFoundException);
      expect(childrenRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ── resetPin ─────────────────────────────────────────────────────────────

  describe('resetPin', () => {
    it('throws NotFoundException when child not found', async () => {
      childrenRepo.findOne.mockResolvedValue(null);

      await expect(service.resetPin('child-1', 'fam-1', '9999')).rejects.toThrow(NotFoundException);
    });

    it('hashes the new pin with bcrypt', async () => {
      childrenRepo.findOne.mockResolvedValue(makeChild());
      pinAttemptsRepo.findOne.mockResolvedValue(null);

      await service.resetPin('child-1', 'fam-1', '9999');

      expect(bcrypt.hash).toHaveBeenCalledWith('9999', 12);
    });

    it('updates children with new pinHash', async () => {
      childrenRepo.findOne.mockResolvedValue(makeChild());
      pinAttemptsRepo.findOne.mockResolvedValue(null);

      await service.resetPin('child-1', 'fam-1', '9999');

      expect(childrenRepo.update).toHaveBeenCalledWith('child-1', { pinHash: 'hashed-pin' });
    });

    it('resets attempt count to 0 when a PinAttempt record exists', async () => {
      const attempt = { id: 'attempt-1', attemptCount: 3, lockedUntil: new Date() } as PinAttempt;
      childrenRepo.findOne.mockResolvedValue(makeChild());
      pinAttemptsRepo.findOne.mockResolvedValue(attempt);

      await service.resetPin('child-1', 'fam-1', '9999');

      expect(pinAttemptsRepo.update).toHaveBeenCalledWith(
        'attempt-1',
        expect.objectContaining({ attemptCount: 0 }),
      );
    });

    it('does not call pinAttempts.update when no attempt record exists', async () => {
      childrenRepo.findOne.mockResolvedValue(makeChild());
      pinAttemptsRepo.findOne.mockResolvedValue(null);

      await service.resetPin('child-1', 'fam-1', '9999');

      expect(pinAttemptsRepo.update).not.toHaveBeenCalled();
    });
  });

  // ── setLevelObjective ─────────────────────────────────────────────────────

  describe('setLevelObjective', () => {
    it('calls children.update with levelGoal and levelGoalReward', async () => {
      childrenRepo.findOne.mockResolvedValue(makeChild());

      await service.setLevelObjective('child-1', 'fam-1', 5, 'Legendary Sword');

      expect(childrenRepo.update).toHaveBeenCalledWith('child-1', {
        levelGoal:       5,
        levelGoalReward: 'Legendary Sword',
      });
    });

    it('can clear the objective by passing null values', async () => {
      childrenRepo.findOne.mockResolvedValue(makeChild());

      await service.setLevelObjective('child-1', 'fam-1', null, null);

      expect(childrenRepo.update).toHaveBeenCalledWith('child-1', {
        levelGoal:       null,
        levelGoalReward: null,
      });
    });

    it('throws NotFoundException when child not found', async () => {
      childrenRepo.findOne.mockResolvedValue(null);

      await expect(service.setLevelObjective('child-1', 'fam-1', 3, 'Shield')).rejects.toThrow(NotFoundException);
    });
  });

  // ── assertOwnership (indirectly) ─────────────────────────────────────────

  describe('assertOwnership (via remove)', () => {
    it('uses family.id in the findOne where clause', async () => {
      childrenRepo.findOne.mockResolvedValue(makeChild());

      await service.remove('child-1', 'fam-1');

      expect(childrenRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'child-1', family: { id: 'fam-1' } },
      });
    });
  });
});
