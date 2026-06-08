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

/** Mint a child JWT directly. */
function mintChildToken(jwt: JwtService, childId: string, familyId: string): string {
  return jwt.sign({ sub: childId, familyId, role: 'child' }, { expiresIn: '8h' });
}

describe('Transactions E2E', () => {
  let app: INestApplication;
  let ds: DataSource;
  let jwt: JwtService;
  let familyRepo: Repository<Family>;
  let accountRepo: Repository<ParentAccount>;
  let childRepo: Repository<Child>;
  let txRepo: Repository<Transaction>;
  let taskRepo: Repository<Task>;

  // Fixtures seeded before each test
  let familyA: Family;
  let familyB: Family;
  let accountA: ParentAccount;
  let accountB: ParentAccount;
  let childA: Child;
  let childB: Child;
  let parentTokenA: string;
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
    txRepo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    taskRepo = module.get<Repository<Task>>(getRepositoryToken(Task));
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
    accountA = accountRepo.create({ email: 'parentA@test.com', passwordHash: await bcrypt.hash('pass', 4), family: familyA });
    await accountRepo.save(accountA);

    // Seed family B + parent account B
    familyB = familyRepo.create({});
    await familyRepo.save(familyB);
    accountB = accountRepo.create({ email: 'parentB@test.com', passwordHash: await bcrypt.hash('pass', 4), family: familyB });
    await accountRepo.save(accountB);

    // Seed child for family A
    childA = childRepo.create({
      name: 'ChildA',
      avatar: '🐶',
      pinHash: await bcrypt.hash('1234', 4),
      family: familyA,
    });
    await childRepo.save(childA);

    // Seed child for family B
    childB = childRepo.create({
      name: 'ChildB',
      avatar: '🐱',
      pinHash: await bcrypt.hash('5678', 4),
      family: familyB,
    });
    await childRepo.save(childB);

    parentTokenA = mintParentToken(jwt, accountA.id, familyA.id, accountA.email);
    childTokenA = mintChildToken(jwt, childA.id, familyA.id);
  });

  // ── GET /api/transactions?childId=X (history) ─────────────────────────────────

  describe('GET /api/transactions (history)', () => {
    it('returns 200 with paginated shape and empty data for a new child', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/transactions?childId=${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
    });

    it('returns total: 1 and data.length: 1 after seeding 1 earn transaction', async () => {
      await txRepo.save(txRepo.create({ type: 'earn', currency: 'gold', amount: 100, child: childA }));

      const res = await request(app.getHttpServer())
        .get(`/api/transactions?childId=${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data.length).toBe(1);
    });

    it('child token: GET /api/transactions (no childId needed) returns own history', async () => {
      await txRepo.save(txRepo.create({ type: 'earn', currency: 'gold', amount: 50, child: childA }));

      const res = await request(app.getHttpServer())
        .get('/api/transactions')
        .set('Authorization', `Bearer ${childTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data.length).toBe(1);
    });

    it('returns 404 when parentTokenA requests history for a child in another family', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/transactions?childId=${childB.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(404);
    });

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/transactions?childId=${childA.id}`);

      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/transactions/balance/:childId ────────────────────────────────────

  describe('GET /api/transactions/balance/:childId', () => {
    it('returns zeroed stats for a new child', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/transactions/balance/${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        balance: 0,
        earnedTotal: 0,
        spentTotal: 0,
        earnedThisWeek: 0,
        spentThisWeek: 0,
      });
    });

    it('returns correct balance after 100 earn + 30 spend', async () => {
      await txRepo.save(txRepo.create({ type: 'earn', currency: 'gold', amount: 100, child: childA }));
      await txRepo.save(txRepo.create({ type: 'spend', currency: 'gold', amount: 30, child: childA }));

      const res = await request(app.getHttpServer())
        .get(`/api/transactions/balance/${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        balance: 70,
        earnedTotal: 100,
        spentTotal: 30,
      });
    });

    it('child token: GET /api/transactions/balance/:childId returns 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/transactions/balance/${childA.id}`)
        .set('Authorization', `Bearer ${childTokenA}`);

      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/transactions/streak/:childId ─────────────────────────────────────

  describe('GET /api/transactions/streak/:childId', () => {
    it('returns zeroed streak for a new child with no tasks', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/transactions/streak/${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
      });
    });

    it('returns currentStreak: 1 and longestStreak: 1 after 1 validated task yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await taskRepo.save(taskRepo.create({
        title: 'Task yesterday',
        goldReward: 10,
        status: 'validated',
        validatedAt: yesterday,
        child: childA,
      }));

      const res = await request(app.getHttpServer())
        .get(`/api/transactions/streak/${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.currentStreak).toBe(1);
      expect(res.body.longestStreak).toBe(1);
    });

    it('returns currentStreak: 2 after tasks on yesterday and the day before', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const dayBefore = new Date();
      dayBefore.setDate(dayBefore.getDate() - 2);

      await taskRepo.save(taskRepo.create({
        title: 'Task yesterday',
        goldReward: 10,
        status: 'validated',
        validatedAt: yesterday,
        child: childA,
      }));

      await taskRepo.save(taskRepo.create({
        title: 'Task day before',
        goldReward: 10,
        status: 'validated',
        validatedAt: dayBefore,
        child: childA,
      }));

      const res = await request(app.getHttpServer())
        .get(`/api/transactions/streak/${childA.id}`)
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.currentStreak).toBe(2);
      expect(res.body.longestStreak).toBe(2);
    });

    it('child token: GET /api/transactions/streak/:childId returns 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/transactions/streak/${childA.id}`)
        .set('Authorization', `Bearer ${childTokenA}`);

      expect(res.status).toBe(200);
    });
  });
});
