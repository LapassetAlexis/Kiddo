import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { RewardsService } from './rewards.service';
import { Reward } from './reward.entity';
import { Transaction } from '../transactions/transaction.entity';
import { NotificationIntent } from '../notifications/notification-intent.entity';
import { Child } from '../children/child.entity';
import { FamiliesService } from '../families/families.service';

// ── Mock factories ────────────────────────────────────────────────────────────

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

function mockQueryBuilder(affected = 1) {
  const qb: any = {
    update:  jest.fn().mockReturnThis(),
    set:     jest.fn().mockReturnThis(),
    where:   jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected }),
  };
  return qb;
}

function mockEntityManager(affected = 1): jest.Mocked<EntityManager> & { _qb: ReturnType<typeof mockQueryBuilder> } {
  const qb = mockQueryBuilder(affected);
  return {
    _qb:      qb,
    update:   jest.fn().mockResolvedValue(undefined),
    save:     jest.fn().mockResolvedValue({}),
    create:   jest.fn().mockImplementation((_cls: any, data: any) => data),
    findOne:  jest.fn().mockResolvedValue(null),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    count:    jest.fn().mockResolvedValue(0),
  } as unknown as jest.Mocked<EntityManager> & { _qb: ReturnType<typeof mockQueryBuilder> };
}

function mockDataSource(em: jest.Mocked<EntityManager>): jest.Mocked<DataSource> {
  return {
    transaction: jest.fn().mockImplementation(async (cb: (em: EntityManager) => Promise<any>) => cb(em)),
  } as unknown as jest.Mocked<DataSource>;
}

// ── Test data builders ────────────────────────────────────────────────────────

function makeReward(overrides: Partial<Reward> = {}): Reward {
  return {
    id:              'rew-1',
    title:           'Pizza 🍕',
    description:     null as any,
    emoji:           '🍕',
    cost:            50,
    availability:    'unlimited',
    status:          'available',
    claimedByChildId: null,
    grantedByName:   null as any,
    family:          { id: 'fam-1' } as any,
    createdAt:       new Date(),
    ...overrides,
  } as any;
}

function makeChild(overrides: Partial<Child> = {}): Child {
  return {
    id:       'child-1',
    name:     'Emma',
    avatar:   '🦊',
    fcmToken: 'fcm-child',
    family:   { id: 'fam-1' } as any,
    ...overrides,
  } as any;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns a QB chain that resolves getRawOne with the given result. */
function makeBalanceQb(balanceStr: string) {
  const qb: any = {};
  qb.select      = jest.fn().mockReturnValue(qb);
  qb.where       = jest.fn().mockReturnValue(qb);
  qb.andWhere    = jest.fn().mockReturnValue(qb);
  qb.setParameter = jest.fn().mockReturnValue(qb);
  qb.getRawOne   = jest.fn().mockResolvedValue({ balance: balanceStr });
  return qb;
}

/** EntityManager that returns the given balance from its createQueryBuilder chain. */
function makeEmWithBalance(balanceStr: string, affected = 1) {
  const updateQb = mockQueryBuilder(affected);
  const balanceQb: any = {
    select:   jest.fn().mockReturnThis(),
    where:    jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ balance: balanceStr }),
  };

  let callCount = 0;
  const em = {
    _qb:      updateQb,
    update:   jest.fn().mockResolvedValue(undefined),
    save:     jest.fn().mockResolvedValue({}),
    create:   jest.fn().mockImplementation((_cls: any, data: any) => data),
    findOne:  jest.fn().mockResolvedValue(null),
    // First call → update QB, second call → balance QB
    createQueryBuilder: jest.fn().mockImplementation((..._args: any[]) => {
      callCount++;
      return callCount === 1 ? updateQb : balanceQb;
    }),
    count: jest.fn().mockResolvedValue(0),
  } as unknown as jest.Mocked<EntityManager> & { _qb: ReturnType<typeof mockQueryBuilder> };

  return em;
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('RewardsService', () => {
  let service: RewardsService;
  let rewardRepo:  jest.Mocked<Repository<Reward>>;
  let txRepo:      jest.Mocked<Repository<Transaction>>;
  let notifRepo:   jest.Mocked<Repository<NotificationIntent>>;
  let childRepo:   jest.Mocked<Repository<Child>>;
  let em:          jest.Mocked<EntityManager> & { _qb: ReturnType<typeof mockQueryBuilder> };
  let ds:          jest.Mocked<DataSource>;
  let familiesSvc: jest.Mocked<Pick<FamiliesService, 'getDisplayName' | 'getFamilyParentTokens' | 'getFamilyParentsForNotif'>>;

  beforeEach(async () => {
    rewardRepo = mockRepo<Reward>();
    txRepo     = mockRepo<Transaction>();
    notifRepo  = mockRepo<NotificationIntent>();
    childRepo  = mockRepo<Child>();
    em         = mockEntityManager();
    ds         = mockDataSource(em);

    familiesSvc = {
      getDisplayName:           jest.fn().mockResolvedValue('Alice Parent'),
      getFamilyParentTokens:    jest.fn().mockResolvedValue(['fcm-token-1']),
      getFamilyParentsForNotif: jest.fn().mockResolvedValue([{ id: 'acc-1', fcmToken: 'fcm-1' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        { provide: getRepositoryToken(Reward),              useValue: rewardRepo },
        { provide: getRepositoryToken(Transaction),         useValue: txRepo },
        { provide: getRepositoryToken(NotificationIntent),  useValue: notifRepo },
        { provide: getRepositoryToken(Child),               useValue: childRepo },
        { provide: DataSource,                              useValue: ds },
        { provide: FamiliesService,                         useValue: familiesSvc },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
  });

  // ── findAllForFamily ─────────────────────────────────────────────────────────

  describe('findAllForFamily', () => {
    it('returns rewards as-is when none are claimed', async () => {
      const rewards = [makeReward({ status: 'available' }), makeReward({ id: 'rew-2', status: 'granted' })];
      rewardRepo.find.mockResolvedValue(rewards);

      const result = await service.findAllForFamily('fam-1');

      expect(rewardRepo.find).toHaveBeenCalledWith({
        where: { family: { id: 'fam-1' } },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect((result[0] as any).childName).toBeUndefined();
    });

    it('enriches claimed rewards with child name and emoji', async () => {
      const reward = makeReward({ status: 'claimed', claimedByChildId: 'child-1' });
      rewardRepo.find.mockResolvedValue([reward]);
      childRepo.find.mockResolvedValue([makeChild({ id: 'child-1', name: 'Emma', avatar: '🦊' })]);

      const result = await service.findAllForFamily('fam-1');

      expect(result[0]).toMatchObject({
        childId:    'child-1',
        childName:  'Emma',
        childEmoji: '🦊',
      });
    });

    it('uses fallback values when claimed child is not found', async () => {
      const reward = makeReward({ status: 'claimed', claimedByChildId: 'child-ghost' });
      rewardRepo.find.mockResolvedValue([reward]);
      childRepo.find.mockResolvedValue([]);

      const result = await service.findAllForFamily('fam-1');

      expect(result[0]).toMatchObject({ childName: '?', childEmoji: '👶' });
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('calls rewards.create and rewards.save with correct data', async () => {
      const reward = makeReward();
      rewardRepo.create.mockReturnValue(reward);
      rewardRepo.save.mockResolvedValue(reward);

      const result = await service.create(
        { title: 'Pizza 🍕', emoji: '🍕', cost: 50, availability: 'unlimited' },
        'fam-1',
      );

      expect(rewardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Pizza 🍕', cost: 50, family: { id: 'fam-1' } }),
      );
      expect(rewardRepo.save).toHaveBeenCalledWith(reward);
      expect(result).toBe(reward);
    });

    it('defaults availability to "unlimited" when not provided', async () => {
      const reward = makeReward();
      rewardRepo.create.mockReturnValue(reward);
      rewardRepo.save.mockResolvedValue(reward);

      await service.create({ title: 'Candy', cost: 20 } as any, 'fam-1');

      expect(rewardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ availability: 'unlimited' }),
      );
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when reward does not belong to family', async () => {
      rewardRepo.findOne.mockResolvedValue(null);

      await expect(service.update('rew-1', 'fam-1', { title: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('updates reward and returns updated entity', async () => {
      const reward  = makeReward();
      const updated = makeReward({ title: 'New Title' });
      rewardRepo.findOne.mockResolvedValue(reward);
      rewardRepo.update.mockResolvedValue(undefined as any);
      rewardRepo.findOneOrFail.mockResolvedValue(updated);

      const result = await service.update('rew-1', 'fam-1', { title: 'New Title' });

      expect(rewardRepo.update).toHaveBeenCalledWith('rew-1', expect.objectContaining({ title: 'New Title' }));
      expect(result.title).toBe('New Title');
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when reward does not belong to family', async () => {
      rewardRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('rew-1', 'fam-1')).rejects.toThrow(NotFoundException);
    });

    it('deletes the reward when ownership is confirmed', async () => {
      rewardRepo.findOne.mockResolvedValue(makeReward());
      rewardRepo.delete.mockResolvedValue(undefined as any);

      await service.remove('rew-1', 'fam-1');

      expect(rewardRepo.delete).toHaveBeenCalledWith('rew-1');
    });
  });

  // ── redeem ───────────────────────────────────────────────────────────────────

  describe('redeem', () => {
    it('throws NotFoundException when reward is not found', async () => {
      rewardRepo.findOne.mockResolvedValue(null);

      await expect(service.redeem('rew-1', 'child-1', 'fam-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when reward status is not "available"', async () => {
      rewardRepo.findOne.mockResolvedValue(makeReward({ status: 'claimed' }));

      await expect(service.redeem('rew-1', 'child-1', 'fam-1')).rejects.toThrow(ConflictException);
    });

    it('throws ForbiddenException when child does not belong to the family', async () => {
      rewardRepo.findOne.mockResolvedValue(makeReward({ status: 'available' }));
      childRepo.findOne.mockResolvedValue(null);

      await expect(service.redeem('rew-1', 'child-1', 'fam-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when child has insufficient balance', async () => {
      rewardRepo.findOne.mockResolvedValue(makeReward({ status: 'available', cost: 50 }));
      childRepo.findOne.mockResolvedValue(makeChild());
      const balanceQb = makeBalanceQb('30'); // balance=30 < cost=50
      txRepo.createQueryBuilder.mockReturnValue(balanceQb as any);

      await expect(service.redeem('rew-1', 'child-1', 'fam-1')).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when atomic update returns 0 affected rows', async () => {
      rewardRepo.findOne.mockResolvedValue(makeReward({ status: 'available', cost: 10 }));
      childRepo.findOne.mockResolvedValue(makeChild());
      const balanceQb = makeBalanceQb('100');
      txRepo.createQueryBuilder.mockReturnValue(balanceQb as any);
      familiesSvc.getFamilyParentTokens.mockResolvedValue([]);

      // Entity manager update QB returns affected=0
      const raceEm = mockEntityManager(0);
      ds.transaction.mockImplementation(async (cb: any) => cb(raceEm));

      await expect(service.redeem('rew-1', 'child-1', 'fam-1')).rejects.toThrow(ConflictException);
    });

    it('executes transaction and returns updated reward on success', async () => {
      const reward  = makeReward({ status: 'available', cost: 10 });
      const claimed = makeReward({ status: 'claimed', claimedByChildId: 'child-1' });

      rewardRepo.findOne.mockResolvedValue(reward);
      childRepo.findOne.mockResolvedValue(makeChild());
      const balanceQb = makeBalanceQb('100');
      txRepo.createQueryBuilder.mockReturnValue(balanceQb as any);
      familiesSvc.getFamilyParentTokens.mockResolvedValue(['parent-fcm']);
      rewardRepo.findOneOrFail.mockResolvedValue(claimed);

      const result = await service.redeem('rew-1', 'child-1', 'fam-1');

      expect(ds.transaction).toHaveBeenCalled();
      expect(em.createQueryBuilder).toHaveBeenCalled();
      expect(em._qb.update).toHaveBeenCalledWith(Reward);
      expect(em._qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'claimed', claimedByChildId: 'child-1' }),
      );
      expect(result.status).toBe('claimed');
    });

    it('sends a notification for each parent FCM token on success', async () => {
      rewardRepo.findOne.mockResolvedValue(makeReward({ status: 'available', cost: 10 }));
      childRepo.findOne.mockResolvedValue(makeChild({ name: 'Emma' }));
      txRepo.createQueryBuilder.mockReturnValue(makeBalanceQb('100') as any);
      familiesSvc.getFamilyParentTokens.mockResolvedValue(['token-a', 'token-b']);
      rewardRepo.findOneOrFail.mockResolvedValue(makeReward({ status: 'claimed' }));

      await service.redeem('rew-1', 'child-1', 'fam-1');

      const saveCalls = (em.save as jest.Mock).mock.calls;
      expect(saveCalls).toHaveLength(2);
    });
  });

  // ── grant ────────────────────────────────────────────────────────────────────

  describe('grant', () => {
    it('throws ConflictException when reward status is not "claimed"', async () => {
      const emForGrant = makeEmWithBalance('100', 1);
      emForGrant.findOne.mockResolvedValue(makeReward({ status: 'available' }));
      ds.transaction.mockImplementation(async (cb: any) => cb(emForGrant));

      await expect(service.grant('rew-1', 'fam-1', 'acc-1')).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when child has insufficient balance', async () => {
      const emForGrant = makeEmWithBalance('30', 1); // balance=30 < cost=50
      emForGrant.findOne
        .mockResolvedValueOnce(makeReward({ status: 'claimed', cost: 50, claimedByChildId: 'child-1' })) // reward
        .mockResolvedValueOnce(makeChild()); // child

      // Override createQueryBuilder to return balance QB
      const balanceQb: any = {
        select:   jest.fn().mockReturnThis(),
        where:    jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: '30' }),
      };
      emForGrant.createQueryBuilder.mockReturnValue(balanceQb);
      ds.transaction.mockImplementation(async (cb: any) => cb(emForGrant));

      await expect(service.grant('rew-1', 'fam-1', 'acc-1')).rejects.toThrow(BadRequestException);
    });

    it('sets status to "granted" when availability is "once"', async () => {
      const reward = makeReward({ status: 'claimed', cost: 10, availability: 'once', claimedByChildId: 'child-1' });
      const child  = makeChild();

      const emForGrant = mockEntityManager(1);
      emForGrant.findOne
        .mockResolvedValueOnce(reward)
        .mockResolvedValueOnce(child);
      const balanceQb: any = {
        select:   jest.fn().mockReturnThis(),
        where:    jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: '100' }),
      };
      emForGrant.createQueryBuilder.mockReturnValue(balanceQb);
      ds.transaction.mockImplementation(async (cb: any) => cb(emForGrant));
      rewardRepo.findOneOrFail.mockResolvedValue(makeReward({ status: 'granted' }));

      const result = await service.grant('rew-1', 'fam-1', 'acc-1');

      expect(emForGrant.update).toHaveBeenCalledWith(
        Reward,
        'rew-1',
        expect.objectContaining({ status: 'granted' }),
      );
      expect(result.status).toBe('granted');
    });

    it('sets status back to "available" when availability is "unlimited"', async () => {
      const reward = makeReward({ status: 'claimed', cost: 10, availability: 'unlimited', claimedByChildId: 'child-1' });
      const child  = makeChild();

      const emForGrant = mockEntityManager(1);
      emForGrant.findOne
        .mockResolvedValueOnce(reward)
        .mockResolvedValueOnce(child);
      const balanceQb: any = {
        select:   jest.fn().mockReturnThis(),
        where:    jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: '100' }),
      };
      emForGrant.createQueryBuilder.mockReturnValue(balanceQb);
      ds.transaction.mockImplementation(async (cb: any) => cb(emForGrant));
      rewardRepo.findOneOrFail.mockResolvedValue(makeReward({ status: 'available' }));

      const result = await service.grant('rew-1', 'fam-1', 'acc-1');

      expect(emForGrant.update).toHaveBeenCalledWith(
        Reward,
        'rew-1',
        expect.objectContaining({ status: 'available', claimedByChildId: null }),
      );
      expect(result.status).toBe('available');
    });

    it('creates a spend transaction with the correct amount', async () => {
      const reward = makeReward({ status: 'claimed', cost: 25, availability: 'unlimited', claimedByChildId: 'child-1' });
      const child  = makeChild();

      const emForGrant = mockEntityManager(1);
      emForGrant.findOne
        .mockResolvedValueOnce(reward)
        .mockResolvedValueOnce(child);
      const balanceQb: any = {
        select:   jest.fn().mockReturnThis(),
        where:    jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: '100' }),
      };
      emForGrant.createQueryBuilder.mockReturnValue(balanceQb);
      ds.transaction.mockImplementation(async (cb: any) => cb(emForGrant));
      rewardRepo.findOneOrFail.mockResolvedValue(makeReward());

      await service.grant('rew-1', 'fam-1', 'acc-1');

      expect(emForGrant.save).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({ type: 'spend', amount: 25 }),
      );
    });
  });

  // ── refuse ───────────────────────────────────────────────────────────────────

  describe('refuse', () => {
    it('throws ConflictException when reward is not in "claimed" status', async () => {
      const emForRefuse = mockEntityManager(1);
      emForRefuse.findOne.mockResolvedValue(makeReward({ status: 'available' }));
      ds.transaction.mockImplementation(async (cb: any) => cb(emForRefuse));

      await expect(service.refuse('rew-1', 'fam-1', 'acc-1')).rejects.toThrow(ConflictException);
    });

    it('resets reward status to "available" and clears claimedByChildId', async () => {
      const reward = makeReward({ status: 'claimed', claimedByChildId: 'child-1' });
      const child  = makeChild({ fcmToken: null as any });

      const emForRefuse = mockEntityManager(1);
      emForRefuse.findOne
        .mockResolvedValueOnce(reward)
        .mockResolvedValueOnce(child);
      ds.transaction.mockImplementation(async (cb: any) => cb(emForRefuse));
      rewardRepo.findOneOrFail.mockResolvedValue(makeReward({ status: 'available' }));
      familiesSvc.getFamilyParentTokens.mockResolvedValue([]);

      const result = await service.refuse('rew-1', 'fam-1', 'acc-1');

      expect(emForRefuse.update).toHaveBeenCalledWith(
        Reward,
        'rew-1',
        expect.objectContaining({ status: 'available', claimedByChildId: null }),
      );
      expect(result.status).toBe('available');
    });

    it('notifies child via FCM when child has a token', async () => {
      const reward = makeReward({ status: 'claimed', claimedByChildId: 'child-1' });
      const child  = makeChild({ fcmToken: 'fcm-child-token' });

      const emForRefuse = mockEntityManager(1);
      emForRefuse.findOne
        .mockResolvedValueOnce(reward)
        .mockResolvedValueOnce(child);
      ds.transaction.mockImplementation(async (cb: any) => cb(emForRefuse));
      rewardRepo.findOneOrFail.mockResolvedValue(makeReward({ status: 'available' }));
      familiesSvc.getFamilyParentTokens.mockResolvedValue([]);

      await service.refuse('rew-1', 'fam-1', 'acc-1');

      const saveCalls = (emForRefuse.save as jest.Mock).mock.calls;
      const notifCall = saveCalls.find(
        ([cls, data]) => cls === NotificationIntent && data?.fcmToken === 'fcm-child-token',
      );
      expect(notifCall).toBeDefined();
    });
  });
});
