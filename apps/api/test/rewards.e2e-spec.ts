import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { AuthModule } from '../src/auth/auth.module';
import { FamiliesModule } from '../src/families/families.module';
import { ChildrenModule } from '../src/children/children.module';
import { TasksModule } from '../src/tasks/tasks.module';
import { RewardsModule } from '../src/rewards/rewards.module';
import { TransactionsModule } from '../src/transactions/transactions.module';
import { NotificationsModule } from '../src/notifications/notifications.module';

import { Family } from '../src/families/family.entity';
import { Child } from '../src/children/child.entity';
import { PinAttempt } from '../src/children/pin-attempt.entity';
import { Task } from '../src/tasks/task.entity';
import { Reward } from '../src/rewards/reward.entity';
import { Transaction } from '../src/transactions/transaction.entity';
import { NotificationIntent } from '../src/notifications/notification-intent.entity';
import { EmailVerification } from '../src/auth/entities/email-verification.entity';
import { PasswordReset } from '../src/auth/entities/password-reset.entity';

const TEST_DB_URL =
  process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/kidpoints_test';

const ALL_ENTITIES = [
  Family, Child, PinAttempt,
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

function mintParentToken(jwt: JwtService, familyId: string, email: string): string {
  return jwt.sign({ sub: familyId, role: 'parent', email });
}

function mintChildToken(jwt: JwtService, childId: string, familyId: string): string {
  return jwt.sign({ sub: childId, familyId, role: 'child' }, { expiresIn: '8h' });
}

/** Directly insert an earn transaction to give a child a balance. */
async function giveChildPoints(
  transactionRepo: Repository<Transaction>,
  childId: string,
  amount: number,
): Promise<void> {
  const tx = transactionRepo.create({
    type: 'earn',
    amount,
    referenceId: 'seed-task-id',
    child: { id: childId } as any,
  });
  await transactionRepo.save(tx);
}

describe('Rewards E2E', () => {
  let app: INestApplication;
  let ds: DataSource;
  let jwt: JwtService;
  let familyRepo: Repository<Family>;
  let childRepo: Repository<Child>;
  let rewardRepo: Repository<Reward>;
  let transactionRepo: Repository<Transaction>;

  let family: Family;
  let child: Child;
  let parentToken: string;
  let childToken: string;

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
    childRepo = module.get<Repository<Child>>(getRepositoryToken(Child));
    rewardRepo = module.get<Repository<Reward>>(getRepositoryToken(Reward));
    transactionRepo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  afterAll(async () => {
    await truncateAll(ds);
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(ds);

    family = familyRepo.create({
      email: 'rewards-parent@test.com',
      passwordHash: await bcrypt.hash('pass', 4),
    });
    await familyRepo.save(family);

    child = childRepo.create({
      name: 'RewardKid',
      avatar: '⭐',
      pinHash: await bcrypt.hash('1234', 4),
      family,
    });
    await childRepo.save(child);

    parentToken = mintParentToken(jwt, family.id, family.email);
    childToken = mintChildToken(jwt, child.id, family.id);
  });

  // ── Create reward ─────────────────────────────────────────────────────────────

  describe('POST /api/rewards (create)', () => {
    it('creates a reward and returns 201 with status=available', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Extra screen time', emoji: '📺', cost: 50 });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('available');
      expect(res.body.title).toBe('Extra screen time');
      expect(res.body.cost).toBe(50);
    });

    it('creates a once reward with availability=once', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Movie night', emoji: '🎬', cost: 100, availability: 'once' });

      expect(res.status).toBe(201);
      expect(res.body.availability).toBe('once');
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/rewards')
        .send({ title: 'Unauthorized reward', emoji: '🚫', cost: 10 });

      expect(res.status).toBe(401);
    });

    it('returns 403 when a child tries to create a reward', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${childToken}`)
        .send({ title: 'Self reward', emoji: '🎁', cost: 5 });

      expect(res.status).toBe(403);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Missing emoji and cost' });

      expect(res.status).toBe(400);
    });
  });

  // ── List rewards ──────────────────────────────────────────────────────────────

  describe('GET /api/rewards', () => {
    it('returns 200 with list of family rewards', async () => {
      await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Ice cream', emoji: '🍦', cost: 30 });

      const res = await request(app.getHttpServer())
        .get('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Ice cream');
    });
  });

  // ── Child redeems reward ──────────────────────────────────────────────────────

  describe('POST /api/rewards/:id/redeem', () => {
    it('allows child to redeem when they have sufficient balance, creates spend transaction', async () => {
      await giveChildPoints(transactionRepo, child.id, 100);

      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Toy', emoji: '🧸', cost: 60 });
      const rewardId: string = createRes.body.id;

      const redeemRes = await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Authorization', `Bearer ${childToken}`)
        .send({ childId: child.id });

      expect(redeemRes.status).toBe(200);

      // Verify spend transaction was created
      const transactions = await transactionRepo.find({
        where: { referenceId: rewardId, type: 'spend' },
      });
      expect(transactions.length).toBe(1);
      expect(transactions[0].amount).toBe(60);
    });

    it('returns 400 when child has insufficient balance', async () => {
      await giveChildPoints(transactionRepo, child.id, 10); // Only 10 points

      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Expensive toy', emoji: '🎮', cost: 200 });
      const rewardId: string = createRes.body.id;

      const redeemRes = await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Authorization', `Bearer ${childToken}`)
        .send({ childId: child.id });

      expect(redeemRes.status).toBe(400);
    });

    it('returns 400 when child has zero balance', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Any reward', emoji: '🎯', cost: 10 });
      const rewardId: string = createRes.body.id;

      const redeemRes = await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Authorization', `Bearer ${childToken}`)
        .send({ childId: child.id });

      expect(redeemRes.status).toBe(400);
    });
  });

  // ── once reward cannot be redeemed twice ─────────────────────────────────────

  describe('once reward redemption', () => {
    it('marks reward as claimed after first redemption and blocks second redemption', async () => {
      await giveChildPoints(transactionRepo, child.id, 500);

      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'One-time trip', emoji: '✈️', cost: 100, availability: 'once' });
      const rewardId: string = createRes.body.id;

      // First redemption — should succeed
      const firstRedeem = await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Authorization', `Bearer ${childToken}`)
        .send({ childId: child.id });
      expect(firstRedeem.status).toBe(200);

      // Verify reward status is now 'claimed'
      const rewardAfterFirst = await rewardRepo.findOneOrFail({ where: { id: rewardId } });
      expect(rewardAfterFirst.status).toBe('claimed');

      // Second redemption — should fail with 409
      const secondRedeem = await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Authorization', `Bearer ${childToken}`)
        .send({ childId: child.id });
      expect(secondRedeem.status).toBe(409);
    });
  });

  // ── Parent grants reward ──────────────────────────────────────────────────────

  describe('POST /api/rewards/:id/grant', () => {
    it('changes reward status to granted after it was claimed', async () => {
      await giveChildPoints(transactionRepo, child.id, 200);

      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Sleep-over', emoji: '🛌', cost: 150, availability: 'once' });
      const rewardId: string = createRes.body.id;

      // Child redeems
      await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Authorization', `Bearer ${childToken}`)
        .send({ childId: child.id });

      // Parent grants
      const grantRes = await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/grant`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ childId: child.id });

      expect(grantRes.status).toBe(200);
      expect(grantRes.body.status).toBe('granted');
    });

    it('returns 409 when trying to grant a reward that has not been claimed', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Unclaimed', emoji: '🎁', cost: 50 });
      const rewardId: string = createRes.body.id;

      const grantRes = await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/grant`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ childId: child.id });

      expect(grantRes.status).toBe(409);
    });
  });

  // ── Parent refuses reward — points re-credited ────────────────────────────────

  describe('POST /api/rewards/:id/refuse', () => {
    it('re-credits points and resets reward to available when parent refuses', async () => {
      await giveChildPoints(transactionRepo, child.id, 200);

      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Weekend trip', emoji: '🚌', cost: 100, availability: 'once' });
      const rewardId: string = createRes.body.id;

      // Child redeems
      await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Authorization', `Bearer ${childToken}`)
        .send({ childId: child.id });

      // Verify balance reduced after redemption (200 - 100 = 100)
      const txsAfterRedeem = await transactionRepo.find({ where: { child: { id: child.id } } });
      const earnTotal = txsAfterRedeem.filter(t => t.type === 'earn').reduce((s, t) => s + t.amount, 0);
      const spendTotal = txsAfterRedeem.filter(t => t.type === 'spend').reduce((s, t) => s + t.amount, 0);
      expect(earnTotal - spendTotal).toBe(100);

      // Parent refuses
      const refuseRes = await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/refuse`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ childId: child.id });

      expect(refuseRes.status).toBe(200);
      expect(refuseRes.body.status).toBe('available');

      // Verify points were re-credited (new earn transaction for 100)
      const txsAfterRefuse = await transactionRepo.find({ where: { child: { id: child.id } } });
      const earnTotalAfter = txsAfterRefuse.filter(t => t.type === 'earn').reduce((s, t) => s + t.amount, 0);
      const spendTotalAfter = txsAfterRefuse.filter(t => t.type === 'spend').reduce((s, t) => s + t.amount, 0);
      expect(earnTotalAfter - spendTotalAfter).toBe(200); // back to original balance
    });

    it('returns 409 when trying to refuse a reward that has not been claimed', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Unclaimed refuse', emoji: '🎁', cost: 50 });
      const rewardId: string = createRes.body.id;

      const refuseRes = await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/refuse`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ childId: child.id });

      expect(refuseRes.status).toBe(409);
    });

    it('makes once reward available again after refuse, allowing re-redemption', async () => {
      await giveChildPoints(transactionRepo, child.id, 500);

      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Re-claimable', emoji: '🔄', cost: 50, availability: 'once' });
      const rewardId: string = createRes.body.id;

      // Redeem
      await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Authorization', `Bearer ${childToken}`)
        .send({ childId: child.id });

      // Refuse
      await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/refuse`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ childId: child.id });

      // Redeem again — should succeed because status is back to available
      const secondRedeem = await request(app.getHttpServer())
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Authorization', `Bearer ${childToken}`)
        .send({ childId: child.id });

      expect(secondRedeem.status).toBe(200);
    });
  });

  // ── Delete reward ─────────────────────────────────────────────────────────────

  describe('DELETE /api/rewards/:id', () => {
    it('deletes a reward and returns 204', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Delete me', emoji: '🗑️', cost: 10 });
      const rewardId: string = createRes.body.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/rewards/${rewardId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(deleteRes.status).toBe(204);

      const reward = await rewardRepo.findOne({ where: { id: rewardId } });
      expect(reward).toBeNull();
    });

    it('returns 404 when trying to delete a reward from another family', async () => {
      // Create second family
      const family2 = familyRepo.create({
        email: 'other@test.com',
        passwordHash: await bcrypt.hash('pass', 4),
      });
      await familyRepo.save(family2);
      const parentToken2 = mintParentToken(jwt, family2.id, family2.email);

      const createRes = await request(app.getHttpServer())
        .post('/api/rewards')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Family 1 reward', emoji: '🎁', cost: 20 });
      const rewardId: string = createRes.body.id;

      // Family 2 tries to delete family 1's reward
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/rewards/${rewardId}`)
        .set('Authorization', `Bearer ${parentToken2}`);

      expect(deleteRes.status).toBe(404);
    });
  });
});
