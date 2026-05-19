import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { Transaction } from '../transactions/transaction.entity';
import { NotificationIntent } from '../notifications/notification-intent.entity';
import { Child } from '../children/child.entity';
import { Family } from '../families/family.entity';

// ── Repository mock factory ─────────────────────────────────────────────────

function mockRepo<T>(): jest.Mocked<Repository<T>> {
  return {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

// ── EntityManager mock ──────────────────────────────────────────────────────

function mockEntityManager(): jest.Mocked<EntityManager> {
  return {
    update: jest.fn().mockResolvedValue(undefined),
    save: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockImplementation((_cls: any, data: any) => data),
  } as unknown as jest.Mocked<EntityManager>;
}

// ── DataSource mock ─────────────────────────────────────────────────────────

function mockDataSource(em: jest.Mocked<EntityManager>): jest.Mocked<DataSource> {
  return {
    transaction: jest.fn().mockImplementation(async (cb: (em: EntityManager) => Promise<any>) => {
      return cb(em);
    }),
  } as unknown as jest.Mocked<DataSource>;
}

// ── Test data builders ──────────────────────────────────────────────────────

function makeFamily(overrides: Partial<Family> = {}): Family {
  return {
    id: 'fam-1',
    email: 'parent@test.com',
    passwordHash: 'hash',
    timezone: 'Europe/Paris',
    children: [],
    createdAt: new Date(),
    fcmToken: undefined,
    ...overrides,
  } as any;
}

function makeChild(overrides: Partial<Child> = {}): Child {
  return {
    id: 'child-1',
    name: 'Alice',
    avatar: '🐶',
    pinHash: 'hash',
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
    points: 10,
    frequency: 'daily',
    status: 'created',
    photoUrl: null as any,
    rejectionReason: null as any,
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
  let em: jest.Mocked<EntityManager>;
  let ds: jest.Mocked<DataSource>;

  beforeEach(async () => {
    taskRepo = mockRepo<Task>();
    txRepo = mockRepo<Transaction>();
    notifRepo = mockRepo<NotificationIntent>();
    childRepo = mockRepo<Child>();
    em = mockEntityManager();
    ds = mockDataSource(em);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task),               useValue: taskRepo },
        { provide: getRepositoryToken(Transaction),        useValue: txRepo },
        { provide: getRepositoryToken(NotificationIntent), useValue: notifRepo },
        { provide: getRepositoryToken(Child),              useValue: childRepo },
        { provide: DataSource,                             useValue: ds },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and returns a task with status=created', async () => {
      const child = makeChild();
      const savedTask = makeTask();

      childRepo.findOneOrFail.mockResolvedValue(child);
      taskRepo.create.mockReturnValue(savedTask);
      taskRepo.save.mockResolvedValue(savedTask);

      const result = await service.create({ childId: 'child-1', title: 'Clean room', points: 10 });

      expect(childRepo.findOneOrFail).toHaveBeenCalledWith({ where: { id: 'child-1' } });
      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Clean room', points: 10 }),
      );
      expect(taskRepo.save).toHaveBeenCalled();
      expect(result.status).toBe('created');
    });

    it('defaults frequency to daily when not provided', async () => {
      const child = makeChild();
      childRepo.findOneOrFail.mockResolvedValue(child);
      taskRepo.create.mockReturnValue(makeTask({ frequency: 'daily' }));
      taskRepo.save.mockResolvedValue(makeTask({ frequency: 'daily' }));

      await service.create({ childId: 'child-1', title: 'Task', points: 5 });

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 'daily' }),
      );
    });

    it('uses provided frequency when given', async () => {
      const child = makeChild();
      childRepo.findOneOrFail.mockResolvedValue(child);
      taskRepo.create.mockReturnValue(makeTask({ frequency: 'weekly' }));
      taskRepo.save.mockResolvedValue(makeTask({ frequency: 'weekly' }));

      await service.create({ childId: 'child-1', title: 'Weekly chore', points: 20, frequency: 'weekly' });

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 'weekly' }),
      );
    });
  });

  // ── complete ─────────────────────────────────────────────────────────────────

  describe('complete', () => {
    it('changes status to pending_approval and calls ds.transaction', async () => {
      const task = makeTask({ status: 'created' });
      const updatedTask = makeTask({ status: 'pending_approval', submittedAt: new Date() });

      taskRepo.findOneOrFail.mockResolvedValueOnce(task); // first call in complete()
      taskRepo.findOneOrFail.mockResolvedValueOnce(updatedTask); // second call after transaction

      const result = await service.complete('task-1');

      expect(ds.transaction).toHaveBeenCalled();
      expect(em.update).toHaveBeenCalledWith(
        Task,
        'task-1',
        expect.objectContaining({ status: 'pending_approval' }),
      );
      expect(result.status).toBe('pending_approval');
    });

    it('saves a NotificationIntent when the parent has an FCM token', async () => {
      const family = makeFamily({ fcmToken: 'parent-fcm-token' } as any);
      const child = makeChild({ family });
      const task = makeTask({ status: 'created', child });
      const updatedTask = makeTask({ status: 'pending_approval', submittedAt: new Date(), child });

      taskRepo.findOneOrFail.mockResolvedValueOnce(task);
      taskRepo.findOneOrFail.mockResolvedValueOnce(updatedTask);

      await service.complete('task-1');

      expect(em.save).toHaveBeenCalledWith(
        NotificationIntent,
        expect.objectContaining({ fcmToken: 'parent-fcm-token' }),
      );
    });

    it('does not save a NotificationIntent when the parent has no FCM token', async () => {
      const family = makeFamily({ fcmToken: null } as any);
      const child = makeChild({ family });
      const task = makeTask({ status: 'created', child });
      const updatedTask = makeTask({ status: 'pending_approval', child });

      taskRepo.findOneOrFail.mockResolvedValueOnce(task);
      taskRepo.findOneOrFail.mockResolvedValueOnce(updatedTask);

      await service.complete('task-1');

      expect(em.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when task is already in pending_approval', async () => {
      const task = makeTask({ status: 'pending_approval' });
      taskRepo.findOneOrFail.mockResolvedValue(task);

      await expect(service.complete('task-1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when task is already validated', async () => {
      const task = makeTask({ status: 'validated' });
      taskRepo.findOneOrFail.mockResolvedValue(task);

      await expect(service.complete('task-1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when task is already rejected', async () => {
      const task = makeTask({ status: 'rejected' });
      taskRepo.findOneOrFail.mockResolvedValue(task);

      await expect(service.complete('task-1')).rejects.toThrow(ConflictException);
    });
  });

  // ── approve ──────────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('changes status to validated and inserts a transaction with correct amount', async () => {
      const task = makeTask({ status: 'pending_approval', points: 25 });
      const validatedTask = makeTask({ status: 'validated', validatedAt: new Date() });

      taskRepo.findOneOrFail.mockResolvedValueOnce(task);   // initial load
      taskRepo.findOneOrFail.mockResolvedValueOnce(validatedTask); // after transaction

      const result = await service.approve('task-1');

      expect(ds.transaction).toHaveBeenCalled();
      expect(em.update).toHaveBeenCalledWith(
        Task,
        'task-1',
        expect.objectContaining({ status: 'validated' }),
      );
      expect(em.save).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({ type: 'earn', amount: 25, referenceId: 'task-1' }),
      );
      expect(result.status).toBe('validated');
    });

    it('creates the transaction with the child entity reference', async () => {
      const child = makeChild({ id: 'child-99' });
      const task = makeTask({ status: 'pending_approval', points: 10, child });
      const validatedTask = makeTask({ status: 'validated' });

      taskRepo.findOneOrFail.mockResolvedValueOnce(task);
      taskRepo.findOneOrFail.mockResolvedValueOnce(validatedTask);

      await service.approve('task-1');

      expect(em.save).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({ child: child }),
      );
    });

    it('notifies child via FCM when child has an FCM token', async () => {
      const child = makeChild({ id: 'child-1', fcmToken: 'child-fcm-token' });
      const task = makeTask({ status: 'pending_approval', points: 10, child });
      const validatedTask = makeTask({ status: 'validated' });

      taskRepo.findOneOrFail.mockResolvedValueOnce(task);
      taskRepo.findOneOrFail.mockResolvedValueOnce(validatedTask);

      await service.approve('task-1');

      // em.save is called at least twice: once for Transaction, once for NotificationIntent
      const saveCalls = em.save.mock.calls;
      const notifCall = saveCalls.find(([cls]) => cls === NotificationIntent);
      expect(notifCall).toBeDefined();
      expect(notifCall![1]).toMatchObject({ fcmToken: 'child-fcm-token' });
    });

    it('throws ConflictException when task is still in created state', async () => {
      const task = makeTask({ status: 'created' });
      taskRepo.findOneOrFail.mockResolvedValue(task);

      await expect(service.approve('task-1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when task is already validated', async () => {
      const task = makeTask({ status: 'validated' });
      taskRepo.findOneOrFail.mockResolvedValue(task);

      await expect(service.approve('task-1')).rejects.toThrow(ConflictException);
    });
  });

  // ── reject ───────────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('changes status to rejected with a reason, creates no transaction', async () => {
      const task = makeTask({ status: 'pending_approval' });
      const rejectedTask = makeTask({ status: 'rejected', rejectionReason: 'Not done well' });

      taskRepo.findOneOrFail.mockResolvedValueOnce(task);
      taskRepo.update.mockResolvedValue(undefined as any);
      taskRepo.findOneOrFail.mockResolvedValueOnce(rejectedTask);

      const result = await service.reject('task-1', 'Not done well');

      expect(taskRepo.update).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ status: 'rejected', rejectionReason: 'Not done well' }),
      );
      expect(result.status).toBe('rejected');
      // No transaction should be created
      expect(em.save).not.toHaveBeenCalled();
      expect(txRepo.save).not.toHaveBeenCalled();
    });

    it('stores empty string as rejectionReason when no reason is given', async () => {
      const task = makeTask({ status: 'pending_approval' });
      const rejectedTask = makeTask({ status: 'rejected', rejectionReason: '' });

      taskRepo.findOneOrFail.mockResolvedValueOnce(task);
      taskRepo.update.mockResolvedValue(undefined as any);
      taskRepo.findOneOrFail.mockResolvedValueOnce(rejectedTask);

      await service.reject('task-1');

      expect(taskRepo.update).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ rejectionReason: '' }),
      );
    });

    it('throws ConflictException when task is still in created state', async () => {
      const task = makeTask({ status: 'created' });
      taskRepo.findOneOrFail.mockResolvedValue(task);

      await expect(service.reject('task-1', 'reason')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when task is already validated', async () => {
      const task = makeTask({ status: 'validated' });
      taskRepo.findOneOrFail.mockResolvedValue(task);

      await expect(service.reject('task-1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when task is already rejected', async () => {
      const task = makeTask({ status: 'rejected' });
      taskRepo.findOneOrFail.mockResolvedValue(task);

      await expect(service.reject('task-1')).rejects.toThrow(ConflictException);
    });

    it('does not wrap rejection in a transaction (uses repo.update directly)', async () => {
      const task = makeTask({ status: 'pending_approval' });
      const rejectedTask = makeTask({ status: 'rejected' });

      taskRepo.findOneOrFail.mockResolvedValueOnce(task);
      taskRepo.update.mockResolvedValue(undefined as any);
      taskRepo.findOneOrFail.mockResolvedValueOnce(rejectedTask);

      await service.reject('task-1', 'reason');

      // Unlike approve/complete, reject does not use ds.transaction
      expect(ds.transaction).not.toHaveBeenCalled();
    });
  });

  // ── getForChild ──────────────────────────────────────────────────────────────

  describe('getForChild', () => {
    it('returns tasks ordered by createdAt DESC for the given child', async () => {
      const tasks = [makeTask({ id: 'task-2' }), makeTask({ id: 'task-1' })];
      taskRepo.find.mockResolvedValue(tasks);

      const result = await service.getForChild('child-1');

      expect(taskRepo.find).toHaveBeenCalledWith({
        where: { child: { id: 'child-1' } },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('returns empty array when child has no tasks', async () => {
      taskRepo.find.mockResolvedValue([]);

      const result = await service.getForChild('child-1');

      expect(result).toEqual([]);
    });
  });
});
