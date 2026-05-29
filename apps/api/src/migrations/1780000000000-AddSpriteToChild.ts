import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpriteToChild1780000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "children"
      ADD COLUMN IF NOT EXISTS "sprite" character varying
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "children"
      DROP COLUMN IF EXISTS "sprite"
    `);
  }
}
