import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { Transaction } from '../transactions/transaction.entity';
import { NotificationIntent } from '../notifications/notification-intent.entity';
import { Child } from '../children/child.entity';
import { Family } from '../families/family.entity';
import { FamiliesService } from '../families/families.service';

// ── Repository mock factory ─────────────────────────────────────────────────

function mockQbChain(rawMany: any[] = []) {
  const qb: any = {};
  const chain = () => qb;
  qb.select         = jest.fn().mockReturnValue(qb);
  qb.addSelect      = jest.fn().mockReturnValue(qb);
  qb.where          = jest.fn().mockReturnValue(qb);
  qb.andWhere       = jest.fn().mockReturnValue(qb);
  qb.groupBy        = jest.fn().mockReturnValue(qb);
  qb.setParameter   = jest.fn().mockReturnValue(qb);
  qb.getRawMany     = jest.fn().mockResolvedValue(rawMany);
  return qb;
}

function mockRepo<T extends Record<string, any>>(): jest.Mocked<Repository<T>> {
  return {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue(mockQbChain()),
  } as unknown as jest.Mocked<Repository<T>>;
}

// ── QueryBuilder mock ───────────────────────────────────────────────────────

function mockQueryBuilder(affected = 1) {
  const qb: any = {
    update:  jest.fn().mockReturnThis(),
    set:     jest.fn().mockReturnThis(),
    where:   jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected }),
  };
  return qb;
}

// ── EntityManager mock ──────────────────────────────────────────────────────

function mockEntityManager(affected = 1): jest.Mocked<EntityManager> & { _qb: ReturnType<typeof mockQueryBuilder> } {
  const qb = mockQueryBuilder(affected);
  return {
    _qb: qb,
    update: jest.fn().mockResolvedValue(undefined),
    save:   jest.fn().mockResolvedValue({}),
    create: jest.fn().mockImplementation((_cls: any, data: any) => data),
    findOne: jest.fn().mockResolvedValue(null),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    count: jest.fn().mockResolvedValue(0),
  } as unknown as jest.Mocked<EntityManager> & { _qb: ReturnType<typeof mockQueryBuilder> };
}

// ── DataSource mock ─────────────────────────────────────────────────────────

function mockDataSource(em: jest.Mocked<EntityManager>): jest.Mocked<DataSource> {
  return {
    transaction: jest.fn().mockImplementation(async (cb: (em: EntityManager) => Promise<any>) => cb(em)),
  } as unknown as jest.Mocked<DataSource>;
}

// ── Test data builders ──────────────────────────────────────────────────────

function makeFamily(overrides: Partial<Family> = {}): Family {
  return {
    id: 'fam-1',
    timezone: 'Europe/Paris',
    children: [],
    createdAt: new Date(),
    ...overrides,
  } as any;
}

function makeChild(overrides: Partial<Child> = {}): Child {
  return {
    id: 'child-1',
    name: 'Alice',
    avatar: '🐶',
    color: '#FFB300',
    pinHash: 'hash',
    xp: 0,
    class: 'warrior',
    fcmToken: null as any,
    family: makeFamily(),
    tasks: [],
    rewards: [],
    transactions: [],
    pinAttempts: [],
    createdAt: new Date(),
    ...overrides,
  } as Child;
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Clean room',
    description: null as any,
    goldReward: 10,
    difficulty: 'easy',
    frequency: 'daily',
    status: 'created',
    photoUrl: null as any,
    note: null as any,
    rejectionReason: null as any,
    approvedByName: null as any,
    timesPerDay: 1,
    bonusGold: 0,
    child: makeChild(),
    createdAt: new Date(),
    updatedAt: new Date(),
    submittedAt: null as any,
    validatedAt: null as any,
    ...overrides,
  } as Task;
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: jest.Mocked<Repository<Task>>;
  let txRepo: jest.Mocked<Repository<Transaction>>;
  let notifRepo: jest.Mocked<Repository<NotificationIntent>>;
  let childRepo: jest.Mocked<Repository<Child>>;
  let em: jest.Mocked<EntityManager> & { _qb: ReturnType<typeof mockQueryBuilder> };
  let ds: jest.Mocked<DataSource>;
  let familiesSvc: jest.Mocked<Pick<FamiliesService, 'getFamilyParentTokens' | 'getFamilyParentsForNotif' | 'getDisplayName'>>;

  beforeEach(async () => {
    taskRepo  = mockRepo<Task>();
    txRepo    = mockRepo<Transaction>();
    notifRepo = mockRepo<NotificationIntent>();
    childRepo = mockRepo<Child>();
    em        = mockEntityManager();
    ds        = mockDataSource(em);

    familiesSvc = {
      getFamilyParentTokens:    jest.fn().mockResolvedValue([]),
      getFamilyParentsForNotif: jest.fn().mockResolvedValue([]),
      getDisplayName:           jest.fn().mockResolvedValue('Alice Parent'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task),               useValue: taskRepo },
        { provide: getRepositoryToken(Transaction),        useValue: txRepo },
        { provide: getRepositoryToken(NotificationIntent), useValue: notifRepo },
        { provide: getRepositoryToken(Child),              useValue: childRepo },
        { provide: DataSource,                             useValue: ds },
        { provide: FamiliesService,                        useValue: familiesSvc },
        { provide: JwtService,                             useValue: { sign: jest.fn().mockReturnValue('scoped-token') } },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and returns a task with status=created', async () => {
      const child = makeChild();
      const savedTask = makeTask();

      childRepo.findOne.mockResolvedValue(child);
      taskRepo.create.mockReturnValue(savedTask);
      taskRepo.save.mockResolvedValue(savedTask);

      const result = await service.create({ childId: 'child-1', title: 'Clean room', goldReward: 10 }, 'fam-1');

      expect(childRepo.findOne).toHaveBeenCalledWith({ where: { id: 'child-1', family: { id: 'fam-1' } }, relations: { family: true } });
      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Clean room', goldReward: 10 }),
      );
      expect(taskRepo.save).toHaveBeenCalled();
      expect(result.status).toBe('created');
    });

    it('defaults frequency to daily when not provided', async () => {
      const child = makeChild();
      childRepo.findOne.mockResolvedValue(child);
      taskRepo.create.mockReturnValue(makeTask({ frequency: 'daily' }));
      taskRepo.save.mockResolvedValue(makeTask({ frequency: 'daily' }));

      await service.create({ childId: 'child-1', title: 'Task', goldReward: 5 }, 'fam-1');

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 'daily' }),
      );
    });

    it('uses provided frequency when given', async () => {
      const child = makeChild();
      childRepo.findOne.mockResolvedValue(child);
      taskRepo.create.mockReturnValue(makeTask({ frequency: 'weekly' }));
      taskRepo.save.mockResolvedValue(makeTask({ frequency: 'weekly' }));

      await service.create({ childId: 'child-1', title: 'Weekly chore', goldReward: 20, frequency: 'weekly' }, 'fam-1');

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 'weekly' }),
      );
    });

    it('saves timesPerDay and bonusGold when provided', async () => {
      const child = makeChild();
      childRepo.findOne.mockResolvedValue(child);
      const savedTask = makeTask({ timesPerDay: 3, bonusGold: 10 });
      taskRepo.create.mockReturnValue(savedTask);
      taskRepo.save.mockResolvedValue(savedTask);

      await service.create({ childId: 'child-1', title: 'Débarrasser', goldReward: 10, timesPerDay: 3, bonusGold: 10 }, 'fam-1');

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ timesPerDay: 3, bonusGold: 10 }),
      );
    });

    it('defaults timesPerDay to 1 and bonusGold to 0 when not provided', async () => {
      const child = makeChild();
      childRepo.findOne.mockResolvedValue(child);
      taskRepo.create.mockReturnValue(makeTask());
      taskRepo.save.mockResolvedValue(makeTask());

      await service.create({ childId: 'child-1', title: 'Task', goldReward: 10 }, 'fam-1');

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ timesPerDay: 1, bonusGold: 0 }),
      );
    });
  });

  // ── complete ─────────────────────────────────────────────────────────────────

  describe('complete', () => {
    it('runs inside a transaction and uses conditional update', async () => {
      const task = makeTask({ status: 'created' });
      const updatedTask = makeTask({ status: 'pending_approval', submittedAt: new Date() });

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(updatedTask);

      const result = await service.complete('task-1', 'child-1');

      expect(ds.transaction).toHaveBeenCalled();
      expect(em.createQueryBuilder).toHaveBeenCalled();
      expect(em._qb.update).toHaveBeenCalledWith(Task);
      expect(em._qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending_approval' }),
      );
      expect(result.status).toBe('pending_approval');
    });

    it('sends a NotificationIntent when a parent has an FCM token', async () => {
      const task = makeTask({ status: 'created' });
      const updatedTask = makeTask({ status: 'pending_approval', submittedAt: new Date() });

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(updatedTask);
      familiesSvc.getFamilyParentsForNotif.mockResolvedValue([{ id: 'acc-1', fcmToken: 'parent-fcm-token' }]);

      await service.complete('task-1', 'child-1');

      const saveCalls = (em.save as jest.Mock).mock.calls;
      const notifCall = saveCalls.find(([cls]) => cls === NotificationIntent);
      expect(notifCall).toBeDefined();
      expect(notifCall![1]).toMatchObject({ fcmToken: 'parent-fcm-token' });
    });

    it('sends no NotificationIntent when no parent has an FCM token', async () => {
      const task = makeTask({ status: 'created' });
      const updatedTask = makeTask({ status: 'pending_approval' });

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(updatedTask);
      familiesSvc.getFamilyParentsForNotif.mockResolvedValue([]);

      await service.complete('task-1', 'child-1');

      const saveCalls = (em.save as jest.Mock).mock.calls;
      const notifCall = saveCalls.find(([cls]) => cls === NotificationIntent);
      expect(notifCall).toBeUndefined();
    });

    it('throws ConflictException when task is already in pending_approval', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask({ status: 'pending_approval' }));
      await expect(service.complete('task-1', 'child-1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when task is already validated', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask({ status: 'validated' }));
      await expect(service.complete('task-1', 'child-1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when concurrent complete beats us (affected=0)', async () => {
      const task = makeTask({ status: 'created' });
      taskRepo.findOne.mockResolvedValue(task);
      familiesSvc.getFamilyParentsForNotif.mockResolvedValue([]);
      em._qb.execute.mockResolvedValue({ affected: 0 });

      await expect(service.complete('task-1', 'child-1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when daily limit already reached for repeating task', async () => {
      const task = makeTask({ status: 'created', timesPerDay: 3 });
      taskRepo.findOne.mockResolvedValue(task);
      (txRepo.count as jest.Mock).mockResolvedValue(3);

      await expect(service.complete('task-1', 'child-1')).rejects.toThrow(ConflictException);
    });

    it('allows completion when under daily limit for repeating task', async () => {
      const task = makeTask({ status: 'created', timesPerDay: 3 });
      const updatedTask = makeTask({ status: 'pending_approval' });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(updatedTask);
      (txRepo.count as jest.Mock).mockResolvedValue(2);

      const result = await service.complete('task-1', 'child-1');
      expect(result.status).toBe('pending_approval');
    });
  });

  // ── approve ──────────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('runs inside a transaction and performs conditional update to validated', async () => {
      const task = makeTask({ status: 'pending_approval', goldReward: 25 });
      const validatedTask = makeTask({ status: 'validated', validatedAt: new Date() });

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(validatedTask);

      const result = await service.approve('task-1', 'acc-1', 'fam-1');

      expect(ds.transaction).toHaveBeenCalled();
      expect(em._qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'validated' }),
      );
      expect(result.status).toBe('validated');
    });

    it('creates a gold earn transaction with the correct amount and child', async () => {
      const child = makeChild({ id: 'child-99' });
      const task = makeTask({ status: 'pending_approval', goldReward: 25, child });
      const validatedTask = makeTask({ status: 'validated' });

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(validatedTask);

      await service.approve('task-1', 'acc-1', 'fam-1');

      expect(em.save).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({ type: 'earn', currency: 'gold', amount: 25, referenceId: 'task-1', child }),
      );
    });

    it('creates an XP earn transaction based on difficulty', async () => {
      const child = makeChild({ id: 'child-99' });
      const task = makeTask({ status: 'pending_approval', difficulty: 'medium', child });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(makeTask({ status: 'validated' }));

      await service.approve('task-1', 'acc-1', 'fam-1');

      expect(em.save).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({ type: 'earn', currency: 'xp', amount: 25, referenceId: 'task-1', child }),
      );
    });

    it('notifies child via FCM when child has an FCM token', async () => {
      const child = makeChild({ fcmToken: 'child-fcm-token' });
      const task = makeTask({ status: 'pending_approval', child });
      const validatedTask = makeTask({ status: 'validated' });

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(validatedTask);

      await service.approve('task-1', 'acc-1', 'fam-1');

      const saveCalls = (em.save as jest.Mock).mock.calls;
      const notifCall = saveCalls.find(
        ([cls, data]) => cls === NotificationIntent && data?.fcmToken === 'child-fcm-token',
      );
      expect(notifCall).toBeDefined();
    });

    it('notifies other parents via FCM', async () => {
      const task = makeTask({ status: 'pending_approval' });
      const validatedTask = makeTask({ status: 'validated' });

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(validatedTask);
      familiesSvc.getFamilyParentTokens.mockResolvedValue(['other-parent-token']);

      await service.approve('task-1', 'acc-1', 'fam-1');

      const saveCalls = (em.save as jest.Mock).mock.calls;
      const notifCall = saveCalls.find(
        ([cls, data]) => cls === NotificationIntent && data?.fcmToken === 'other-parent-token',
      );
      expect(notifCall).toBeDefined();
      expect(familiesSvc.getFamilyParentTokens).toHaveBeenCalledWith(
        'fam-1',
        expect.objectContaining({ exclude: 'acc-1' }),
      );
    });

    it('uses getDisplayName from DB (not JWT) for approverName', async () => {
      const task = makeTask({ status: 'pending_approval' });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(makeTask({ status: 'validated' }));
      familiesSvc.getDisplayName.mockResolvedValue('Marie Lapasset');

      await service.approve('task-1', 'acc-1', 'fam-1');

      expect(familiesSvc.getDisplayName).toHaveBeenCalledWith('acc-1');
      expect(em._qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ approvedByName: 'Marie Lapasset' }),
      );
    });

    it('throws ConflictException when task is not pending_approval', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask({ status: 'created' }));
      await expect(service.approve('task-1', 'acc-1', 'fam-1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when concurrent approve beats us (affected=0)', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask({ status: 'pending_approval' }));
      em._qb.execute.mockResolvedValue({ affected: 0 });
      await expect(service.approve('task-1', 'acc-1', 'fam-1')).rejects.toThrow(ConflictException);
    });

    // ── repeating task logic ──────────────────────────────────────────────────

    it('resets task to created on non-final iteration approval', async () => {
      const task = makeTask({ status: 'pending_approval', timesPerDay: 3, goldReward: 10 });
      const resetTask = makeTask({ status: 'created' });

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(resetTask);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.approve('task-1', 'acc-1', 'fam-1');

      expect(em._qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'created' }),
      );
      expect(result.status).toBe('created');
    });

    it('clears submittedAt, photoUrl, note on intermediate approval', async () => {
      const task = makeTask({ status: 'pending_approval', timesPerDay: 3 });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(makeTask({ status: 'created' }));
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.approve('task-1', 'acc-1', 'fam-1');

      expect(em._qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ submittedAt: null, photoUrl: null, note: null }),
      );
    });

    it('validates task on final iteration approval', async () => {
      const task = makeTask({ status: 'pending_approval', timesPerDay: 3, goldReward: 10 });
      const validatedTask = makeTask({ status: 'validated' });

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(validatedTask);
      (em.count as jest.Mock).mockResolvedValue(2);

      const result = await service.approve('task-1', 'acc-1', 'fam-1');

      expect(em._qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'validated' }),
      );
      expect(result.status).toBe('validated');
    });

    it('creates bonus gold transaction on final iteration when bonusGold > 0', async () => {
      const child = makeChild({ id: 'child-99' });
      const task = makeTask({ status: 'pending_approval', timesPerDay: 3, goldReward: 10, bonusGold: 5, child });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(makeTask({ status: 'validated' }));
      (em.count as jest.Mock).mockResolvedValue(2);

      await service.approve('task-1', 'acc-1', 'fam-1');

      expect(em.save).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({ type: 'earn', currency: 'gold', amount: 5, referenceId: 'task-1:bonus', child }),
      );
    });

    it('does not create bonus transaction on intermediate iteration', async () => {
      const task = makeTask({ status: 'pending_approval', timesPerDay: 3, bonusGold: 5 });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(makeTask({ status: 'created' }));
      (em.count as jest.Mock).mockResolvedValue(1);

      await service.approve('task-1', 'acc-1', 'fam-1');

      const saveCalls = (em.save as jest.Mock).mock.calls;
      const bonusCall = saveCalls.find(([, data]) => data?.referenceId === 'task-1:bonus');
      expect(bonusCall).toBeUndefined();
    });

    it('does not create bonus transaction on final iteration when bonusGold is 0', async () => {
      const task = makeTask({ status: 'pending_approval', timesPerDay: 2, bonusGold: 0, goldReward: 10 });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(makeTask({ status: 'validated' }));
      (em.count as jest.Mock).mockResolvedValue(1);

      await service.approve('task-1', 'acc-1', 'fam-1');

      const saveCalls = (em.save as jest.Mock).mock.calls;
      const bonusCall = saveCalls.find(([, data]) => data?.referenceId === 'task-1:bonus');
      expect(bonusCall).toBeUndefined();
    });

    it('creates gold earn transaction on every iteration (including non-final)', async () => {
      const child = makeChild({ id: 'child-77' });
      const task = makeTask({ status: 'pending_approval', timesPerDay: 3, goldReward: 10, child });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(makeTask({ status: 'created' }));
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.approve('task-1', 'acc-1', 'fam-1');

      expect(em.save).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({ type: 'earn', currency: 'gold', amount: 10, referenceId: 'task-1', child }),
      );
    });
  });

  // ── reject ───────────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('runs inside a transaction and resets task to created with rejection reason', async () => {
      const task = makeTask({ status: 'pending_approval' });
      const resetTask = makeTask({ status: 'created', rejectionReason: 'Not done well' });

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.findOneOrFail.mockResolvedValue(resetTask);

      const result = await service.reject('task-1', 'acc-1', 'fam-1', 'Not done well');

      expect(ds.transaction).toHaveBeenCalled();
      expect(em._qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'created', rejectionReason: 'Not done well' }),
      );
      expect(result.status).toBe('created');
    });

    it('stores empty string as rejectionReason when no reason is given', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask({ status: 'pending_approval' }));
      taskRepo.findOneOrFail.mockResolvedValue(makeTask({ status: 'created', rejectionReason: '' }));

      await service.reject('task-1', 'acc-1', 'fam-1');

      expect(em._qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ rejectionReason: '' }),
      );
    });

    it('does not create a Transaction on reject', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask({ status: 'pending_approval' }));
      taskRepo.findOneOrFail.mockResolvedValue(makeTask({ status: 'created' }));

      await service.reject('task-1', 'acc-1', 'fam-1', 'reason');

      const saveCalls = (em.save as jest.Mock).mock.calls;
      expect(saveCalls.find(([cls]) => cls === Transaction)).toBeUndefined();
    });

    it('notifies other parents via FCM on reject', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask({ status: 'pending_approval' }));
      taskRepo.findOneOrFail.mockResolvedValue(makeTask({ status: 'created' }));
      familiesSvc.getFamilyParentTokens.mockResolvedValue(['other-parent-token']);

      await service.reject('task-1', 'acc-1', 'fam-1', 'reason');

      const saveCalls = (em.save as jest.Mock).mock.calls;
      const notifCall = saveCalls.find(
        ([cls, data]) => cls === NotificationIntent && data?.fcmToken === 'other-parent-token',
      );
      expect(notifCall).toBeDefined();
    });

    it('throws ConflictException when task is not pending_approval', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask({ status: 'created' }));
      await expect(service.reject('task-1', 'acc-1', 'fam-1', 'reason')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when task is already validated', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask({ status: 'validated' }));
      await expect(service.reject('task-1', 'acc-1', 'fam-1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when concurrent action beats us (affected=0)', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask({ status: 'pending_approval' }));
      em._qb.execute.mockResolvedValue({ affected: 0 });
      await expect(service.reject('task-1', 'acc-1', 'fam-1', 'reason')).rejects.toThrow(ConflictException);
    });
  });

  // ── getForChild ──────────────────────────────────────────────────────────────

  describe('getForChild', () => {
    it('returns tasks ordered by createdAt DESC for the given child', async () => {
      const tasks = [makeTask({ id: 'task-2' }), makeTask({ id: 'task-1' })];
      taskRepo.find.mockResolvedValue(tasks);

      const result = await service.getForChild('child-1', 'fam-1');

      expect(taskRepo.find).toHaveBeenCalledWith({
        where: { child: { id: 'child-1', family: { id: 'fam-1' } } },
        relations: { child: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('returns empty array when child has no tasks', async () => {
      taskRepo.find.mockResolvedValue([]);
      const result = await service.getForChild('child-1', 'fam-1');
      expect(result).toEqual([]);
    });

    it('enriches tasks with completedToday from transaction count', async () => {
      const tasks = [makeTask({ id: 'task-1' })];
      taskRepo.find.mockResolvedValue(tasks);
      const qb = mockQbChain([{ taskId: 'task-1', count: '2' }]);
      (txRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.getForChild('child-1', 'fam-1');

      expect((result[0] as any).completedToday).toBe(2);
    });
  });
});
