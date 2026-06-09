import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleAuth1780600000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE "parent_accounts" ALTER COLUMN "passwordHash" DROP NOT NULL`);
    await qr.query(`ALTER TABLE "parent_accounts" ADD COLUMN IF NOT EXISTS "googleId" varchar UNIQUE`);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE "parent_accounts" DROP COLUMN IF EXISTS "googleId"`);
    await qr.query(`UPDATE "parent_accounts" SET "passwordHash" = '' WHERE "passwordHash" IS NULL`);
    await qr.query(`ALTER TABLE "parent_accounts" ALTER COLUMN "passwordHash" SET NOT NULL`);
  }
}
