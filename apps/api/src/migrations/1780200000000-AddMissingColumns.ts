import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumns1780200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // children
    await queryRunner.query(`ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "fcmToken" character varying`);

    // parent_accounts
    await queryRunner.query(`ALTER TABLE "parent_accounts" ADD COLUMN IF NOT EXISTS "fcmToken" character varying`);
    await queryRunner.query(`ALTER TABLE "parent_accounts" ADD COLUMN IF NOT EXISTS "notifTaskSubmitted" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "parent_accounts" ADD COLUMN IF NOT EXISTS "notifRewardClaimed" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "parent_accounts" ADD COLUMN IF NOT EXISTS "notifStreakAlert" boolean NOT NULL DEFAULT false`);

    // tasks
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "photoUrl" text`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "rejectionReason" character varying`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "approvedByName" character varying`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "timesPerDay" integer NOT NULL DEFAULT 1`);

    // rewards
    await queryRunner.query(`ALTER TABLE "rewards" ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'available'`);
    await queryRunner.query(`ALTER TABLE "rewards" ADD COLUMN IF NOT EXISTS "claimedByChildId" character varying DEFAULT NULL`);
    await queryRunner.query(`ALTER TABLE "rewards" ADD COLUMN IF NOT EXISTS "grantedByName" character varying`);

    // families
    await queryRunner.query(`ALTER TABLE "families" ADD COLUMN IF NOT EXISTS "timezone" character varying NOT NULL DEFAULT 'Europe/Paris'`);

    // notification_intents table (may not exist yet)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_intents" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fcmToken"   character varying NOT NULL,
        "payload"    jsonb NOT NULL,
        "status"     character varying NOT NULL DEFAULT 'pending',
        "attempts"   integer NOT NULL DEFAULT 0,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        "sentAt"     TIMESTAMP,
        CONSTRAINT "PK_notification_intents" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_intents"`);
    await queryRunner.query(`ALTER TABLE "families" DROP COLUMN IF EXISTS "timezone"`);
    await queryRunner.query(`ALTER TABLE "rewards" DROP COLUMN IF EXISTS "grantedByName"`);
    await queryRunner.query(`ALTER TABLE "rewards" DROP COLUMN IF EXISTS "claimedByChildId"`);
    await queryRunner.query(`ALTER TABLE "rewards" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "timesPerDay"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "approvedByName"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "rejectionReason"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "photoUrl"`);
    await queryRunner.query(`ALTER TABLE "parent_accounts" DROP COLUMN IF EXISTS "notifStreakAlert"`);
    await queryRunner.query(`ALTER TABLE "parent_accounts" DROP COLUMN IF EXISTS "notifRewardClaimed"`);
    await queryRunner.query(`ALTER TABLE "parent_accounts" DROP COLUMN IF EXISTS "notifTaskSubmitted"`);
    await queryRunner.query(`ALTER TABLE "parent_accounts" DROP COLUMN IF EXISTS "fcmToken"`);
    await queryRunner.query(`ALTER TABLE "children" DROP COLUMN IF EXISTS "fcmToken"`);
  }
}
