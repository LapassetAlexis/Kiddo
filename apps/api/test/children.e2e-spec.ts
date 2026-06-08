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

function mintParentToken(jwt: JwtService, accountId: string, familyId: string, email: string): string {
  return jwt.sign({ sub: accountId, familyId, role: 'parent', email });
}

function mintChildToken(jwt: JwtService, childId: string, familyId: string): string {
  return jwt.sign({ sub: childId, familyId, role: 'child' }, { expiresIn: '8h' });
}

describe('Children E2E', () => {
  let app: INestApplication;
  let ds: DataSource;
  let jwt: JwtService;
  let familyRepo: Repository<Family>;
  let accountRepo: Repository<ParentAccount>;
  let childRepo: Repository<Child>;

  let familyA: Family;
  let familyB: Family;
  let accountA: ParentAccount;
  let accountB: ParentAccount;
  let childA: Child;
  let childB: Child;
  let parentTokenA: string;
  let parentTokenB: string;
  let childTokenA: string;

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

    familyA = familyRepo.create({});
    await familyRepo.save(familyA);
    accountA = accountRepo.create({ email: 'parentA@test.com', passwordHash: await bcrypt.hash('pass', 4), family: familyA });
    await accountRepo.save(accountA);

    familyB = familyRepo.create({});
    await familyRepo.save(familyB);
    accountB = accountRepo.create({ email: 'parentB@test.com', passwordHash: await bcrypt.hash('pass', 4), family: familyB });
    await accountRepo.save(accountB);

    childA = childRepo.create({
      name: 'ChildA',
      avatar: '🐶',
      pinHash: await bcrypt.hash('1234', 4),
      family: familyA,
    });
    await childRepo.save(childA);

    childB = childRepo.create({
      name: 'ChildB',
      avatar: '🐱',
      pinHash: await bcrypt.hash('5678', 4),
      family: familyB,
    });
    await childRepo.save(childB);

    parentTokenA = mintParentToken(jwt, accountA.id, familyA.id, accountA.email);
    parentTokenB = mintParentToken(jwt, accountB.id, familyB.id, accountB.email);
    childTokenA = mintChildToken(jwt, childA.id, familyA.id);
  });

  // ── POST /api/children ────────────────────────────────────────────────────────

  describe('POST /api/children (create)', () => {
    it('creates child and returns 201 with name, avatar, level=1', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/children')
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ name: 'NewChild', avatar: '🦊', pin: '9999' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('NewChild');
      expect(res.body.avatar).toBe('🦊');
      expect(res.body.level).toBe(1);
    });

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/children')
        .send({ name: 'Ghost', avatar: '👻', pin: '0000' });

      expect(res.status).toBe(401);
    });

    it('returns 403 with child token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/children')
        .set('Authorization', `Bearer ${childTokenA}`)
        .send({ name: 'Ghost', avatar: '👻', pin: '0000' });

      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/children ─────────────────────────────────────────────────────────

  describe('GET /api/children (list)', () => {
    it('returns 200 with array containing childA', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/children')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((c: any) => c.id === childA.id)).toBe(true);
    });

    it('returns only family\'s own children (not childB)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/children')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.some((c: any) => c.id === childB.id)).toBe(false);
    });
  });

  // ── GET /api/children/:id ─────────────────────────────────────────────────────

  describe('GET /api/children/:id', () => {
    it('parent can get stats for own child (200, has stats field)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/children/${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
    });

    it('child token can get own stats', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/children/${childA.id}`)
        .set('Authorization', `Bearer ${childTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
    });

    it('returns 404 for child in other family', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/children/${childB.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /api/children/:id ───────────────────────────────────────────────────

  describe('PATCH /api/children/:id', () => {
    it('updates name and returns 200 with new name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/children/${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ name: 'UpdatedName' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('UpdatedName');
    });

    it('returns 404 for child in other family', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/children/${childB.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/children/:id ──────────────────────────────────────────────────

  describe('DELETE /api/children/:id', () => {
    it('returns 204 for own child', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/children/${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(204);
    });

    it('returns 404 for child in other family', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/children/${childB.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/children/:id/reset-pin ─────────────────────────────────────────

  describe('POST /api/children/:id/reset-pin', () => {
    it('returns 200 for valid new 4-digit pin', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/children/${childA.id}/reset-pin`)
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ newPin: '4321' });

      expect(res.status).toBe(200);
    });

    it('returns 404 for child in other family', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/children/${childB.id}/reset-pin`)
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ newPin: '4321' });

      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/children/:id/balance ────────────────────────────────────────────

  describe('GET /api/children/:id/balance', () => {
    it('returns 200 with { balance: 0 } for new child', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/children/${childA.id}/balance`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ balance: 0 });
    });
  });

  // ── PATCH /api/children/:id/level-objective ───────────────────────────────────

  describe('PATCH /api/children/:id/level-objective', () => {
    it('returns 204, subsequent GET includes levelGoal in response', async () => {
      const patchRes = await request(app.getHttpServer())
        .patch(`/api/children/${childA.id}/level-objective`)
        .set('Authorization', `Bearer ${parentTokenA}`)
        .send({ targetLevel: 5, rewardTitle: 'New bike' });

      expect(patchRes.status).toBe(204);

      const getRes = await request(app.getHttpServer())
        .get(`/api/children/${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.levelGoal).toBe(5);
    });
  });
});
