import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingLevelUp1780100000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "children"
      ADD COLUMN IF NOT EXISTS "pendingLevelUp" integer DEFAULT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "children"
      DROP COLUMN IF EXISTS "pendingLevelUp"
    `);
  }
}
