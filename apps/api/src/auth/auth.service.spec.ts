import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { Family } from '../families/family.entity';
import { ParentAccount } from '../families/parent-account.entity';
import { Child } from '../children/child.entity';
import { PinAttempt } from '../children/pin-attempt.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { PasswordReset } from './entities/password-reset.entity';

// ── Repository mock factory ─────────────────────────────────────────────────

function mockRepo<T extends Record<string, any>>(): jest.Mocked<Repository<T>> {
  return {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 4);
}

async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 4);
}

function makeAccount(overrides: Partial<ParentAccount & { family: Family }> = {}): ParentAccount & { family: Family } {
  return {
    id: 'acc-1',
    email: 'parent@example.com',
    passwordHash: 'hashed',
    family: { id: 'fam-1', timezone: 'Europe/Paris', children: [], parentAccounts: [], createdAt: new Date() } as Family,
    createdAt: new Date(),
    ...overrides,
  } as any;
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let familyRepo: jest.Mocked<Repository<Family>>;
  let accountRepo: jest.Mocked<Repository<ParentAccount>>;
  let childRepo: jest.Mocked<Repository<Child>>;
  let pinAttemptRepo: jest.Mocked<Repository<PinAttempt>>;
  let emailVerifRepo: jest.Mocked<Repository<EmailVerification>>;
  let pwdResetRepo: jest.Mocked<Repository<PasswordReset>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    familyRepo    = mockRepo<Family>();
    accountRepo   = mockRepo<ParentAccount>();
    childRepo     = mockRepo<Child>();
    pinAttemptRepo = mockRepo<PinAttempt>();
    emailVerifRepo = mockRepo<EmailVerification>();
    pwdResetRepo   = mockRepo<PasswordReset>();

    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };

    const emailSvc: jest.Mocked<Pick<EmailService, 'sendVerificationCode' | 'sendPasswordReset' | 'isEnabled'>> = {
      isEnabled:            true,
      sendVerificationCode: jest.fn().mockResolvedValue(undefined),
      sendPasswordReset:    jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Family),            useValue: familyRepo },
        { provide: getRepositoryToken(ParentAccount),     useValue: accountRepo },
        { provide: getRepositoryToken(Child),             useValue: childRepo },
        { provide: getRepositoryToken(PinAttempt),        useValue: pinAttemptRepo },
        { provide: getRepositoryToken(EmailVerification), useValue: emailVerifRepo },
        { provide: getRepositoryToken(PasswordReset),     useValue: pwdResetRepo },
        { provide: JwtService,                            useValue: jwtService },
        { provide: EmailService,                          useValue: emailSvc },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates a family + account and sends a verification code when email is new', async () => {
      accountRepo.findOne.mockResolvedValue(null);
      familyRepo.create.mockReturnValue({ id: 'fam-1' } as Family);
      familyRepo.save.mockResolvedValue({ id: 'fam-1' } as Family);
      accountRepo.create.mockReturnValue({ id: 'acc-1', email: 'test@example.com' } as ParentAccount);
      accountRepo.save.mockResolvedValue({ id: 'acc-1' } as ParentAccount);
      emailVerifRepo.create.mockReturnValue({ id: 'ev-1', email: 'test@example.com', code: '123456' } as EmailVerification);
      emailVerifRepo.save.mockResolvedValue({} as EmailVerification);

      const result = await service.register('Alice', 'test@example.com', 'password123');

      expect(accountRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(familyRepo.save).toHaveBeenCalled();
      expect(accountRepo.save).toHaveBeenCalled();
      expect(emailVerifRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('throws ConflictException when email is already registered', async () => {
      accountRepo.findOne.mockResolvedValue({ id: 'acc-existing' } as ParentAccount);

      await expect(service.register('Alice', 'test@example.com', 'password123'))
        .rejects.toThrow(ConflictException);
    });
  });

  // ── parentLogin ─────────────────────────────────────────────────────────────

  describe('parentLogin', () => {
    it('returns an access token when credentials are correct', async () => {
      const passwordHash = await hashPassword('correct-password');
      const account = makeAccount({ passwordHash });
      accountRepo.findOne.mockResolvedValue(account as any);

      const result = await service.parentLogin('parent@example.com', 'correct-password');

      expect(result).toEqual({ accessToken: 'signed-token' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'acc-1', familyId: 'fam-1', role: 'parent', email: 'parent@example.com' }),
      );
    });

    it('throws UnauthorizedException when the account is not found', async () => {
      accountRepo.findOne.mockResolvedValue(null);

      await expect(service.parentLogin('ghost@example.com', 'any-password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      const passwordHash = await hashPassword('correct-password');
      accountRepo.findOne.mockResolvedValue(makeAccount({ passwordHash }) as any);

      await expect(service.parentLogin('parent@example.com', 'wrong-password'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ── childPin ────────────────────────────────────────────────────────────────

  describe('childPin', () => {
    const CHILD_ID = 'child-1';
    const FAMILY_ID = 'fam-1';
    const CORRECT_PIN = '1234';

    async function makeChild(pin = CORRECT_PIN): Promise<Child> {
      return {
        id: CHILD_ID,
        name: 'Alice',
        avatar: '🐶',
        color: '#FFB300',
        pinHash: await hashPin(pin),
        xp: 0,
        class: 'warrior',
        fcmToken: null as any,
        family: { id: FAMILY_ID } as Family,
        tasks: [],
        rewards: [],
        transactions: [],
        pinAttempts: [],
        createdAt: new Date(),
        sprite: null,
      } as Child;
    }

    it('returns an access token when PIN is correct and no lockout', async () => {
      const child = await makeChild();
      childRepo.findOne.mockResolvedValue(child);
      pinAttemptRepo.findOne.mockResolvedValue(null);

      const result = await service.childPin(CHILD_ID, CORRECT_PIN);

      expect(result).toEqual({ accessToken: 'signed-token' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: CHILD_ID, familyId: FAMILY_ID, role: 'child' }),
        expect.objectContaining({ expiresIn: '8h' }),
      );
    });

    it('throws UnauthorizedException when child is not found', async () => {
      childRepo.findOne.mockResolvedValue(null);

      await expect(service.childPin('ghost-child', CORRECT_PIN))
        .rejects.toThrow(UnauthorizedException);
    });

    it('increments attempt count on wrong PIN', async () => {
      const child = await makeChild();
      childRepo.findOne.mockResolvedValue(child);
      pinAttemptRepo.findOne.mockResolvedValue(null);
      pinAttemptRepo.upsert.mockResolvedValue(undefined as any);

      await expect(service.childPin(CHILD_ID, 'wrong-pin'))
        .rejects.toThrow(UnauthorizedException);

      expect(pinAttemptRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ attemptCount: 1, child: { id: CHILD_ID } }),
        ['child'],
      );
    });

    it('increments attempt count based on existing count on a subsequent wrong PIN', async () => {
      const child = await makeChild();
      childRepo.findOne.mockResolvedValue(child);
      pinAttemptRepo.findOne.mockResolvedValue({
        id: 'pa-1',
        attemptCount: 3,
        lockedUntil: undefined as any,
        child: child,
        updatedAt: new Date(),
      } as PinAttempt);
      pinAttemptRepo.upsert.mockResolvedValue(undefined as any);

      await expect(service.childPin(CHILD_ID, 'wrong-pin'))
        .rejects.toThrow(UnauthorizedException);

      expect(pinAttemptRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ attemptCount: 4 }),
        ['child'],
      );
    });

    it('sets lockedUntil after 5 wrong PIN attempts', async () => {
      const child = await makeChild();
      childRepo.findOne.mockResolvedValue(child);
      pinAttemptRepo.findOne.mockResolvedValue({
        id: 'pa-1',
        attemptCount: 4,
        lockedUntil: undefined as any,
        child: child,
        updatedAt: new Date(),
      } as PinAttempt);
      pinAttemptRepo.upsert.mockResolvedValue(undefined as any);

      await expect(service.childPin(CHILD_ID, 'wrong-pin'))
        .rejects.toThrow(UnauthorizedException);

      const upsertCall = pinAttemptRepo.upsert.mock.calls[0][0] as any;
      expect(upsertCall.attemptCount).toBe(5);
      expect(upsertCall.lockedUntil).toBeInstanceOf(Date);
      expect(upsertCall.lockedUntil.getTime()).toBeGreaterThan(Date.now());
    });

    it('throws BadRequestException (lockout error) when lockedUntil is in the future', async () => {
      const child = await makeChild();
      childRepo.findOne.mockResolvedValue(child);
      pinAttemptRepo.findOne.mockResolvedValue({
        id: 'pa-1',
        attemptCount: 5,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
        child: child,
        updatedAt: new Date(),
      } as PinAttempt);

      await expect(service.childPin(CHILD_ID, CORRECT_PIN))
        .rejects.toThrow(BadRequestException);
    });

    it('resets attempt count to 0 on a correct PIN after previous failures', async () => {
      const child = await makeChild();
      const existingAttempt: PinAttempt = {
        id: 'pa-1',
        attemptCount: 3,
        lockedUntil: undefined as any,
        child: child,
        updatedAt: new Date(),
      };
      childRepo.findOne.mockResolvedValue(child);
      pinAttemptRepo.findOne.mockResolvedValue(existingAttempt);
      pinAttemptRepo.update.mockResolvedValue(undefined as any);

      const result = await service.childPin(CHILD_ID, CORRECT_PIN);

      expect(result).toEqual({ accessToken: 'signed-token' });
      expect(pinAttemptRepo.update).toHaveBeenCalledWith(
        existingAttempt.id,
        expect.objectContaining({ attemptCount: 0 }),
      );
    });

    it('does not call update when there is no existing attempt record', async () => {
      const child = await makeChild();
      childRepo.findOne.mockResolvedValue(child);
      pinAttemptRepo.findOne.mockResolvedValue(null);

      await service.childPin(CHILD_ID, CORRECT_PIN);

      expect(pinAttemptRepo.update).not.toHaveBeenCalled();
    });
  });

  // ── verifyEmail ─────────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('returns accessToken when code is valid', async () => {
      const mockRecord: EmailVerification = {
        id: 'ev-1',
        email: 'user@example.com',
        code: '123456',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null as any,
        createdAt: new Date(),
      };

      emailVerifRepo.findOne.mockResolvedValue(mockRecord);
      emailVerifRepo.update.mockResolvedValue(undefined as any);
      accountRepo.findOne.mockResolvedValue(makeAccount({ email: 'user@example.com' }) as any);

      const result = await service.verifyEmail('user@example.com', '123456');

      expect(result).toHaveProperty('accessToken');
      expect(emailVerifRepo.update).toHaveBeenCalledWith(mockRecord.id, { usedAt: expect.any(Date) });
    });

    it('throws BadRequestException when code is not found', async () => {
      emailVerifRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('user@example.com', '000000'))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when code has already been used', async () => {
      emailVerifRepo.findOne.mockResolvedValue({
        id: 'ev-1',
        email: 'user@example.com',
        code: '123456',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: new Date(),
        createdAt: new Date(),
      } as EmailVerification);

      await expect(service.verifyEmail('user@example.com', '123456'))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when code has expired', async () => {
      emailVerifRepo.findOne.mockResolvedValue({
        id: 'ev-1',
        email: 'user@example.com',
        code: '123456',
        expiresAt: new Date(Date.now() - 60_000),
        usedAt: null as any,
        createdAt: new Date(),
      } as EmailVerification);

      await expect(service.verifyEmail('user@example.com', '123456'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ── forgotPassword ──────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('creates a reset code when the account exists', async () => {
      accountRepo.findOne.mockResolvedValue({ id: 'acc-1', email: 'user@example.com' } as ParentAccount);
      pwdResetRepo.create.mockReturnValue({ id: 'pr-1', email: 'user@example.com', code: '654321' } as PasswordReset);
      pwdResetRepo.save.mockResolvedValue({} as PasswordReset);

      const result = await service.forgotPassword('user@example.com');

      expect(pwdResetRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('returns the same generic message when account does not exist (no enumeration)', async () => {
      accountRepo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword('nobody@example.com');

      expect(pwdResetRepo.save).not.toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });
  });

  // ── resetPassword ───────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('updates passwordHash when code is valid and not used', async () => {
      const mockRecord: PasswordReset = {
        id: 'pr-1',
        email: 'user@example.com',
        code: '123456',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null as any,
        createdAt: new Date(),
      };

      pwdResetRepo.findOne.mockResolvedValue(mockRecord);
      accountRepo.findOne.mockResolvedValue({ id: 'acc-1', email: 'user@example.com' } as ParentAccount);
      accountRepo.update.mockResolvedValue(undefined as any);
      pwdResetRepo.update.mockResolvedValue(undefined as any);

      const result = await service.resetPassword('user@example.com', '123456', 'NewPassword123');

      expect(accountRepo.update).toHaveBeenCalledWith(
        'acc-1',
        expect.objectContaining({ passwordHash: expect.any(String) }),
      );
      expect(pwdResetRepo.update).toHaveBeenCalledWith(mockRecord.id, { usedAt: expect.any(Date) });
      expect(result).toHaveProperty('message');
    });

    it('throws BadRequestException when reset code is invalid', async () => {
      pwdResetRepo.findOne.mockResolvedValue(null);

      await expect(service.resetPassword('user@example.com', '000000', 'NewPassword123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ── getMe ───────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('returns parent profile for a parent JWT payload', async () => {
      const account = makeAccount();
      (account.family as any).children = [{ id: 'child-1', name: 'Kid', avatar: '🐶' }];
      accountRepo.findOne.mockResolvedValue(account as any);

      const result = await service.getMe({ sub: 'acc-1', familyId: 'fam-1', role: 'parent', email: 'parent@example.com' });

      expect(result.role).toBe('parent');
      expect((result as any).email).toBe('parent@example.com');
      expect((result as any).children).toHaveLength(1);
    });

    it('returns child profile for a child JWT payload', async () => {
      const mockChild: Child = {
        id: 'child-1',
        name: 'Alice',
        avatar: '⭐',
        color: '#FFB300',
        pinHash: 'hash',
        xp: 0,
        class: 'warrior',
        fcmToken: null as any,
        family: { id: 'fam-1' } as Family,
        tasks: [],
        rewards: [],
        transactions: [],
        pinAttempts: [],
        createdAt: new Date(),
        sprite: null,
      };
      childRepo.findOne.mockResolvedValue(mockChild);

      const result = await service.getMe({ sub: 'child-1', role: 'child', familyId: 'fam-1' });

      expect(result.role).toBe('child');
      expect((result as any).name).toBe('Alice');
      expect((result as any).familyId).toBe('fam-1');
    });

    it('throws UnauthorizedException when parent account is not found', async () => {
      accountRepo.findOne.mockResolvedValue(null);

      await expect(service.getMe({ sub: 'acc-x', familyId: 'fam-x', role: 'parent' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when child is not found', async () => {
      childRepo.findOne.mockResolvedValue(null);

      await expect(service.getMe({ sub: 'child-x', role: 'child', familyId: 'fam-1' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
