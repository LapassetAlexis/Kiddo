import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { FamiliesService } from './families.service';
import { Family } from './family.entity';
import { ParentAccount } from './parent-account.entity';

// ── External mocks ──────────────────────────────────────────────────────────

jest.mock('bcrypt', () => ({
  hash:    jest.fn().mockResolvedValue('new-hash'),
  compare: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'abcd1234' }),
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
    manager: {
      transaction: jest.fn(),
    },
  } as unknown as jest.Mocked<Repository<T>>;
}

// ── Test data builders ──────────────────────────────────────────────────────

function makeFamily(overrides: Partial<Family> = {}): Family {
  return {
    id:         'fam-1',
    inviteCode: 'CODE1234',
    timezone:   'Europe/Paris',
    children:   [],
    createdAt:  new Date(),
    ...overrides,
  } as any;
}

function makeAccount(overrides: Partial<ParentAccount> = {}): ParentAccount {
  return {
    id:                 'acc-1',
    email:              'test@example.com',
    name:               'Test User',
    passwordHash:       'hash',
    fcmToken:           'fcm-token',
    notifTaskSubmitted: true,
    notifRewardClaimed: true,
    notifStreakAlert:   false,
    family:             makeFamily(),
    ...overrides,
  } as any;
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('FamiliesService', () => {
  let service: FamiliesService;
  let familyRepo: jest.Mocked<Repository<Family>>;
  let accountsRepo: jest.Mocked<Repository<ParentAccount>>;

  beforeEach(async () => {
    familyRepo   = mockRepo<Family>();
    accountsRepo = mockRepo<ParentAccount>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: getRepositoryToken(Family),        useValue: familyRepo },
        { provide: getRepositoryToken(ParentAccount), useValue: accountsRepo },
      ],
    }).compile();

    service = module.get<FamiliesService>(FamiliesService);

    // Reset bcrypt mocks between tests
    (bcrypt.hash    as jest.Mock).mockResolvedValue('new-hash');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  // ── getMe ─────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('returns correct shape with email, familyId, and inviteCode', async () => {
      const account = makeAccount();
      accountsRepo.findOne.mockResolvedValue(account);

      const result = await service.getMe('acc-1');

      expect(result.id).toBe('acc-1');
      expect(result.email).toBe('test@example.com');
      expect(result.familyId).toBe('fam-1');
      expect(result.inviteCode).toBe('CODE1234');
      expect(result.timezone).toBe('Europe/Paris');
    });

    it('queries with relations family and family.children', async () => {
      accountsRepo.findOne.mockResolvedValue(makeAccount());

      await service.getMe('acc-1');

      expect(accountsRepo.findOne).toHaveBeenCalledWith({
        where:     { id: 'acc-1' },
        relations: { family: { children: true } },
      });
    });

    it('maps children into id/name/avatar/color objects', async () => {
      const child = { id: 'child-1', name: 'Alice', avatar: '🐶', color: '#FFB300' };
      const account = makeAccount({ family: makeFamily({ children: [child as any] }) });
      accountsRepo.findOne.mockResolvedValue(account);

      const result = await service.getMe('acc-1');

      expect(result.children).toEqual([{ id: 'child-1', name: 'Alice', avatar: '🐶', color: '#FFB300' }]);
    });

    it('throws NotFoundException when account not found', async () => {
      accountsRepo.findOne.mockResolvedValue(null);

      await expect(service.getMe('acc-99')).rejects.toThrow(NotFoundException);
    });

    it('includes notif preferences in the response', async () => {
      const account = makeAccount({ notifTaskSubmitted: true, notifRewardClaimed: false, notifStreakAlert: true });
      accountsRepo.findOne.mockResolvedValue(account);

      const result = await service.getMe('acc-1');

      expect(result.notifTaskSubmitted).toBe(true);
      expect(result.notifRewardClaimed).toBe(false);
      expect(result.notifStreakAlert).toBe(true);
    });
  });

  // ── updateProfile ─────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('throws ConflictException when the new email is already taken', async () => {
      const account = makeAccount({ email: 'old@example.com' });
      accountsRepo.findOneOrFail.mockResolvedValue(account);
      accountsRepo.findOne
        // first call: findOneOrFail
        .mockResolvedValueOnce(makeAccount({ email: 'taken@example.com' })); // duplicate check

      await expect(
        service.updateProfile('acc-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('calls accounts.update with new email when it is unique', async () => {
      const account = makeAccount({ email: 'old@example.com' });
      accountsRepo.findOneOrFail.mockResolvedValue(account);
      accountsRepo.findOne
        .mockResolvedValueOnce(null)        // duplicate check: email not taken
        .mockResolvedValue(makeAccount());  // getMe internal call

      await service.updateProfile('acc-1', { email: 'new@example.com' });

      expect(accountsRepo.update).toHaveBeenCalledWith('acc-1', { email: 'new@example.com' });
    });

    it('calls accounts.update with name when name is provided', async () => {
      const account = makeAccount();
      accountsRepo.findOneOrFail.mockResolvedValue(account);
      accountsRepo.findOne.mockResolvedValue(makeAccount());

      await service.updateProfile('acc-1', { name: 'New Name' });

      expect(accountsRepo.update).toHaveBeenCalledWith('acc-1', { name: 'New Name' });
    });

    it('calls family repo update with timezone when timezone is provided', async () => {
      const account = makeAccount();
      accountsRepo.findOneOrFail.mockResolvedValue(account);
      accountsRepo.findOne.mockResolvedValue(makeAccount());

      await service.updateProfile('acc-1', { timezone: 'America/New_York' });

      expect(familyRepo.update).toHaveBeenCalledWith('fam-1', { timezone: 'America/New_York' });
    });

    it('does not update email when new email is the same as current', async () => {
      const account = makeAccount({ email: 'same@example.com' });
      accountsRepo.findOneOrFail.mockResolvedValue(account);
      accountsRepo.findOne.mockResolvedValue(makeAccount());

      await service.updateProfile('acc-1', { email: 'same@example.com' });

      // update should NOT be called for email since it didn't change
      const emailUpdateCall = (accountsRepo.update as jest.Mock).mock.calls
        .find(([, data]) => data?.email === 'same@example.com');
      expect(emailUpdateCall).toBeUndefined();
    });
  });

  // ── updateNotifPrefs ──────────────────────────────────────────────────────

  describe('updateNotifPrefs', () => {
    it('calls accounts.update with the provided prefs', async () => {
      accountsRepo.findOne.mockResolvedValue(makeAccount());

      await service.updateNotifPrefs('acc-1', { notifTaskSubmitted: false });

      expect(accountsRepo.update).toHaveBeenCalledWith('acc-1', { notifTaskSubmitted: false });
    });
  });

  // ── changePassword ────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('throws UnauthorizedException when current password is wrong', async () => {
      accountsRepo.findOneOrFail.mockResolvedValue(makeAccount({ passwordHash: 'old-hash' }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('acc-1', 'wrong-password', 'newpass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('calls accounts.update with new hash when current password is correct', async () => {
      accountsRepo.findOneOrFail.mockResolvedValue(makeAccount({ passwordHash: 'old-hash' }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.changePassword('acc-1', 'correct-password', 'newpass');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 12);
      expect(accountsRepo.update).toHaveBeenCalledWith('acc-1', { passwordHash: 'new-hash' });
    });

    it('returns success message on valid password change', async () => {
      accountsRepo.findOneOrFail.mockResolvedValue(makeAccount());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.changePassword('acc-1', 'correct', 'newpass');

      expect(result).toEqual({ message: 'Mot de passe mis à jour' });
    });
  });

  // ── regenerateInviteCode ──────────────────────────────────────────────────

  describe('regenerateInviteCode', () => {
    it('calls family repo update with a new invite code', async () => {
      const account = makeAccount();
      accountsRepo.findOneOrFail.mockResolvedValue(account);
      accountsRepo.findOne.mockResolvedValue(account);

      await service.regenerateInviteCode('acc-1');

      expect(familyRepo.update).toHaveBeenCalledWith(
        'fam-1',
        expect.objectContaining({ inviteCode: expect.any(String) }),
      );
    });
  });

  // ── listParents ───────────────────────────────────────────────────────────

  describe('listParents', () => {
    it('returns an array of {id, name, email} for all accounts in the family', async () => {
      const accounts = [
        makeAccount({ id: 'acc-1', name: 'Alice', email: 'alice@example.com' }),
        makeAccount({ id: 'acc-2', name: 'Bob',   email: 'bob@example.com' }),
      ];
      accountsRepo.find.mockResolvedValue(accounts);

      const result = await service.listParents('fam-1');

      expect(result).toEqual([
        { id: 'acc-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'acc-2', name: 'Bob',   email: 'bob@example.com' },
      ]);
    });

    it('returns empty array when family has no parents', async () => {
      accountsRepo.find.mockResolvedValue([]);

      const result = await service.listParents('fam-1');

      expect(result).toEqual([]);
    });
  });

  // ── getFamilyParentsForNotif ───────────────────────────────────────────────

  describe('getFamilyParentsForNotif', () => {
    it('returns all accounts with an fcmToken when no opts provided', async () => {
      const accounts = [
        makeAccount({ id: 'acc-1', fcmToken: 'token-1' }),
        makeAccount({ id: 'acc-2', fcmToken: 'token-2' }),
      ];
      accountsRepo.find.mockResolvedValue(accounts);

      const result = await service.getFamilyParentsForNotif('fam-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'acc-1', fcmToken: 'token-1' });
    });

    it('excludes account with null fcmToken', async () => {
      const accounts = [
        makeAccount({ id: 'acc-1', fcmToken: 'token-1' }),
        makeAccount({ id: 'acc-2', fcmToken: null as any }),
      ];
      accountsRepo.find.mockResolvedValue(accounts);

      const result = await service.getFamilyParentsForNotif('fam-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('acc-1');
    });

    it('excludes the account matching the exclude option', async () => {
      const accounts = [
        makeAccount({ id: 'acc-1', fcmToken: 'token-1' }),
        makeAccount({ id: 'acc-2', fcmToken: 'token-2' }),
      ];
      accountsRepo.find.mockResolvedValue(accounts);

      const result = await service.getFamilyParentsForNotif('fam-1', { exclude: 'acc-1' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('acc-2');
    });

    it('excludes accounts where notifTaskSubmitted=false when event=task', async () => {
      const accounts = [
        makeAccount({ id: 'acc-1', fcmToken: 'token-1', notifTaskSubmitted: true }),
        makeAccount({ id: 'acc-2', fcmToken: 'token-2', notifTaskSubmitted: false }),
      ];
      accountsRepo.find.mockResolvedValue(accounts);

      const result = await service.getFamilyParentsForNotif('fam-1', { event: 'task' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('acc-1');
    });

    it('excludes accounts where notifRewardClaimed=false when event=reward', async () => {
      const accounts = [
        makeAccount({ id: 'acc-1', fcmToken: 'token-1', notifRewardClaimed: true }),
        makeAccount({ id: 'acc-2', fcmToken: 'token-2', notifRewardClaimed: false }),
      ];
      accountsRepo.find.mockResolvedValue(accounts);

      const result = await service.getFamilyParentsForNotif('fam-1', { event: 'reward' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('acc-1');
    });

    it('excludes accounts where notifStreakAlert=false when event=streak', async () => {
      const accounts = [
        makeAccount({ id: 'acc-1', fcmToken: 'token-1', notifStreakAlert: true }),
        makeAccount({ id: 'acc-2', fcmToken: 'token-2', notifStreakAlert: false }),
      ];
      accountsRepo.find.mockResolvedValue(accounts);

      const result = await service.getFamilyParentsForNotif('fam-1', { event: 'streak' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('acc-1');
    });

    it('combines exclude and event filters', async () => {
      const accounts = [
        makeAccount({ id: 'acc-1', fcmToken: 'token-1', notifTaskSubmitted: true }),
        makeAccount({ id: 'acc-2', fcmToken: 'token-2', notifTaskSubmitted: true }),
        makeAccount({ id: 'acc-3', fcmToken: 'token-3', notifTaskSubmitted: false }),
      ];
      accountsRepo.find.mockResolvedValue(accounts);

      const result = await service.getFamilyParentsForNotif('fam-1', { event: 'task', exclude: 'acc-1' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('acc-2');
    });

    it('returns empty array when all accounts are filtered out', async () => {
      const accounts = [
        makeAccount({ id: 'acc-1', fcmToken: null as any }),
      ];
      accountsRepo.find.mockResolvedValue(accounts);

      const result = await service.getFamilyParentsForNotif('fam-1');

      expect(result).toEqual([]);
    });
  });
});
