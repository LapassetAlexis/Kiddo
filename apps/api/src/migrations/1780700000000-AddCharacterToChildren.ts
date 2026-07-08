import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCharacterToChildren1780700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE children
        ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT NULL;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE children
        DROP COLUMN IF EXISTS avatar_config;
    `);
  }
}
