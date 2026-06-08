import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { AuthModule } from '../src/auth/auth.module';
import { FamiliesModule } from '../src/families/families.module';
import { ChildrenModule } from '../src/children/children.module';
import { TasksModule } from '../src/tasks/tasks.module';
import { RewardsModule } from '../src/rewards/rewards.module';
import { TransactionsModule } from '../src/transactions/transactions.module';
import { NotificationsModule } from '../src/notifications/notifications.module';

import { Family } from '../src/families/family.entity';
import { ParentAccount } from '../src/families/parent-account.entity';
import { Child } from '../src/children/child.entity';
import { PinAttempt } from '../src/children/pin-attempt.entity';
import { Task } from '../src/tasks/task.entity';
import { Reward } from '../src/rewards/reward.entity';
import { Transaction } from '../src/transactions/transaction.entity';
import { NotificationIntent } from '../src/notifications/notification-intent.entity';
import { EmailVerification } from '../src/auth/entities/email-verification.entity';
import { PasswordReset } from '../src/auth/entities/password-reset.entity';
import { JwtService } from '@nestjs/jwt';

const TEST_DB_URL =
  process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/kiddo_test';

const ALL_ENTITIES = [
  Family, ParentAccount, Child, PinAttempt,
  Task, Reward, Transaction,
  NotificationIntent,
  EmailVerification, PasswordReset,
];

async function truncateAll(ds: DataSource): Promise<void> {
  await ds.query('SET session_replication_role = replica');
  for (const entity of ALL_ENTITIES) {
    const meta = ds.getMetadata(entity);
    await ds.query(`TRUNCATE TABLE "${meta.tableName}" CASCADE`);
  }
  await ds.query('SET session_replication_role = DEFAULT');
}

/** Mint a parent JWT directly without going through HTTP. */
function mintParentToken(jwt: JwtService, accountId: string, familyId: string, email: string): string {
  return jwt.sign({ sub: accountId, familyId, role: 'parent', email });
}

describe('Families E2E', () => {
  let app: INestApplication;
  let ds: DataSource;
  let jwt: JwtService;
  let familyRepo: Repository<Family>;
  let accountRepo: Repository<ParentAccount>;
  let childRepo: Repository<Child>;

  // Fixtures seeded before each test
  let familyA: Family;
  let familyB: Family;
  let accountA: ParentAccount;
  let accountB: ParentAccount;
  let childA: Child;
  let parentTokenA: string;
  let parentTokenB: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: TEST_DB_URL,
          entities: ALL_ENTITIES,
          synchronize: true,
          logging: false,
        }),
        AuthModule,
        FamiliesModule,
        ChildrenModule,
        TasksModule,
        RewardsModule,
        TransactionsModule,
        NotificationsModule,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    ds = module.get(DataSource);
    jwt = module.get(JwtService);
    familyRepo = module.get<Repository<Family>>(getRepositoryToken(Family));
    accountRepo = module.get<Repository<ParentAccount>>(getRepositoryToken(ParentAccount));
    childRepo = module.get<Repository<Child>>(getRepositoryToken(Child));
  });

  afterAll(async () => {
    await truncateAll(ds);
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(ds);

    // Seed family A + parent account A
    familyA = familyRepo.create({});
    await familyRepo.save(familyA);
    accountA = accountRepo.create({
      email: 'a@test.com',
      passwordHash: await bcrypt.hash('pass', 4),
      family: familyA,
    });
    await accountRepo.save(accountA);

    // Seed family B + parent account B
    familyB = familyRepo.create({});
    await familyRepo.save(familyB);
    accountB = accountRepo.create({
      email: 'b@test.com',
      passwordHash: await bcrypt.hash('pass', 4),
      family: familyB,
    });
    await accountRepo.save(accountB);

    // Seed child for family A
    childA = childRepo.create({
      name: 'ChildA',
      avatar: '🐶',
      pinHash: await bcrypt.hash('1234', 4),
      family: familyA,
    });
    await childRepo.save(childA);

    parentTokenA = mintParentToken(jwt, accountA.id, familyA.id, accountA.email);
    parentTokenB = mintParentToken(jwt, accountB.id, familyB.id, accountB.email);
  });

  // ── GET /api/families/me ──────────────────────────────────────────────────────

  describe('GET /api/families/me', () => {
    it('returns 200 with email, familyId, inviteCode fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/families/me')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('a@test.com');
      expect(res.body.familyId).toBe(familyA.id);
      expect(res.body).toHaveProperty('inviteCode');
    });

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/families/me');

      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/families/parents ─────────────────────────────────────────────────

  describe('GET /api/families/parents', () => {
    it('returns 200 with array containing accountA', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/families/parents')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const ids = res.body.map((p: any) => p.id);
      expect(ids).toContain(accountA.id);
    });

    it('does NOT include accountB (different family)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/families/parents')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((p: any) => p.id);
      expect(ids).not.toContain(accountB.id);
    });
  });

  // ── PATCH /api/families/me (update profile) ───────────────────────────────────

  describe('PATCH /api/families/me', () => {
    it('updates name → 200, subsequent GET /me returns new name', async () => {
      const patchRes = await request(app.getHttpServer())
        .patch('/api/families/me')
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ name: 'Alice' });

      expect(patchRes.status).toBe(200);

      const getRes = await request(app.getHttpServer())
        .get('/api/families/me')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.name).toBe('Alice');
    });

    it('updates email to unique value → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/families/me')
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ email: 'new-a@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('new-a@test.com');
    });

    it('returns 409 when email already used by accountB', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/families/me')
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ email: 'b@test.com' });

      expect(res.status).toBe(409);
    });

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/families/me')
        .send({ name: 'Ghost' });

      expect(res.status).toBe(401);
    });
  });

  // ── PATCH /api/families/me/password ──────────────────────────────────────────

  describe('PATCH /api/families/me/password', () => {
    it('returns 200 with success message when currentPassword is correct', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/families/me/password')
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ currentPassword: 'pass', newPassword: 'newpass123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeTruthy();
    });

    it('returns 401 when currentPassword is wrong', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/families/me/password')
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ currentPassword: 'wrongpass', newPassword: 'newpass123' });

      expect(res.status).toBe(401);
    });
  });

  // ── PATCH /api/families/me/notifications ─────────────────────────────────────

  describe('PATCH /api/families/me/notifications', () => {
    it('returns 200 with updated notif prefs (notifTaskSubmitted: false)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/families/me/notifications')
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ notifTaskSubmitted: false });

      expect(res.status).toBe(200);
      expect(res.body.notifTaskSubmitted).toBe(false);
    });
  });

  // ── POST /api/families/invite-code/regenerate ─────────────────────────────────

  describe('POST /api/families/invite-code/regenerate', () => {
    it('returns 200 with new inviteCode different from the original', async () => {
      // Fetch original invite code
      const meRes = await request(app.getHttpServer())
        .get('/api/families/me')
        .set('Authorization', `Bearer ${parentTokenA}`);
      const originalCode: string = meRes.body.inviteCode;

      const res = await request(app.getHttpServer())
        .post('/api/families/invite-code/regenerate')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.inviteCode).toBeTruthy();
      expect(res.body.inviteCode).not.toBe(originalCode);
    });
  });

  // ── DELETE /api/families/me ───────────────────────────────────────────────────

  describe('DELETE /api/families/me', () => {
    it('returns 200, subsequent GET /me with old token returns 404 (account gone)', async () => {
      const deleteRes = await request(app.getHttpServer())
        .delete('/api/families/me')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(deleteRes.status).toBe(200);

      const meRes = await request(app.getHttpServer())
        .get('/api/families/me')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(meRes.status).toBe(404);
    });

    it('when family has 2 parents, deleting one does NOT delete the family — other parent still accessible', async () => {
      // Seed a second parent in familyA
      const accountA2 = accountRepo.create({
        email: 'a2@test.com',
        passwordHash: await bcrypt.hash('pass', 4),
        family: familyA,
      });
      await accountRepo.save(accountA2);
      const parentTokenA2 = mintParentToken(jwt, accountA2.id, familyA.id, accountA2.email);

      // Delete accountA
      const deleteRes = await request(app.getHttpServer())
        .delete('/api/families/me')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(deleteRes.status).toBe(200);

      // accountA2 should still be able to access their profile
      const meRes = await request(app.getHttpServer())
        .get('/api/families/me')
        .set('Authorization', `Bearer ${parentTokenA2}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.id).toBe(accountA2.id);
      expect(meRes.body.familyId).toBe(familyA.id);
    });
  });
});
