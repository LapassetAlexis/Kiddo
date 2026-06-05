import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema0000000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "families" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name"       VARCHAR,
        "timezone"   VARCHAR NOT NULL DEFAULT 'Europe/Paris',
        "inviteCode" VARCHAR UNIQUE,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parent_accounts" (
        "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"              VARCHAR NOT NULL UNIQUE,
        "passwordHash"       VARCHAR NOT NULL,
        "name"               VARCHAR,
        "fcmToken"           VARCHAR,
        "notifTaskSubmitted" BOOLEAN NOT NULL DEFAULT true,
        "notifRewardClaimed" BOOLEAN NOT NULL DEFAULT true,
        "notifStreakAlert"   BOOLEAN NOT NULL DEFAULT false,
        "familyId"           UUID REFERENCES "families"("id") ON DELETE CASCADE,
        "createdAt"          TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "children" (
        "id"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name"     VARCHAR NOT NULL,
        "avatar"   VARCHAR NOT NULL,
        "color"    VARCHAR NOT NULL DEFAULT '#FFB300',
        "sprite"   VARCHAR,
        "pinHash"  VARCHAR NOT NULL,
        "familyId" UUID REFERENCES "families"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title"           VARCHAR NOT NULL,
        "description"     VARCHAR,
        "goldReward"      INTEGER NOT NULL,
        "difficulty"      VARCHAR NOT NULL DEFAULT 'easy',
        "frequency"       VARCHAR NOT NULL DEFAULT 'daily',
        "status"          VARCHAR NOT NULL DEFAULT 'created',
        "photoUrl"        TEXT,
        "note"            VARCHAR,
        "rejectionReason" VARCHAR,
        "timesPerDay"     INTEGER NOT NULL DEFAULT 1,
        "bonusGold"       INTEGER NOT NULL DEFAULT 0,
        "childId"         UUID REFERENCES "children"("id") ON DELETE CASCADE,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "submittedAt"     TIMESTAMP,
        "validatedAt"     TIMESTAMP,
        "approvedByName"  VARCHAR
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "type"        VARCHAR NOT NULL,
        "currency"    VARCHAR NOT NULL DEFAULT 'gold',
        "amount"      INTEGER NOT NULL,
        "referenceId" VARCHAR,
        "note"        VARCHAR,
        "childId"     UUID REFERENCES "children"("id") ON DELETE CASCADE,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rewards" (
        "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title"           VARCHAR NOT NULL,
        "description"     VARCHAR,
        "emoji"           VARCHAR,
        "cost"            INTEGER NOT NULL,
        "availability"    VARCHAR NOT NULL DEFAULT 'unlimited',
        "status"          VARCHAR NOT NULL DEFAULT 'available',
        "claimedByChildId" VARCHAR,
        "grantedByName"   VARCHAR,
        "familyId"        UUID REFERENCES "families"("id") ON DELETE CASCADE,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_intents" (
        "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "fcmToken"  VARCHAR NOT NULL,
        "payload"   JSONB NOT NULL,
        "status"    VARCHAR NOT NULL DEFAULT 'pending',
        "attempts"  INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "sentAt"    TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_verifications" (
        "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"     VARCHAR NOT NULL,
        "code"      VARCHAR(6) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt"    TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_resets" (
        "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"     VARCHAR NOT NULL,
        "code"      VARCHAR(6) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt"    TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pin_attempts" (
        "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "childId"      UUID REFERENCES "children"("id") ON DELETE CASCADE,
        "attemptCount" INTEGER NOT NULL DEFAULT 0,
        "lockedUntil"  TIMESTAMP,
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "qr_tokens" (
        "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tokenHash" VARCHAR NOT NULL,
        "childId"   UUID NOT NULL REFERENCES "children"("id") ON DELETE CASCADE,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt"    TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_qr_tokens_tokenHash" ON "qr_tokens" ("tokenHash");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "qr_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pin_attempts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_resets" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "email_verifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_intents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rewards" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tasks" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "children" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parent_accounts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "families" CASCADE`);
  }
}
