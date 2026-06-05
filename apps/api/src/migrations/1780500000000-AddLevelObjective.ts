import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLevelObjective1780500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "levelGoal" integer`);
    await queryRunner.query(`ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "levelGoalReward" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "children" DROP COLUMN IF EXISTS "levelGoal"`);
    await queryRunner.query(`ALTER TABLE "children" DROP COLUMN IF EXISTS "levelGoalReward"`);
  }
}
