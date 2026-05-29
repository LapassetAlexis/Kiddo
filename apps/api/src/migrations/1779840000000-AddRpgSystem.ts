import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRpgSystem1779840000000 implements MigrationInterface {
  name = 'AddRpgSystem1779840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // children: add xp accumulator and RPG class
    await queryRunner.query(`ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "xp" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "class" varchar NOT NULL DEFAULT 'warrior'`);

    // tasks: rename points → goldReward, bonusPoints → bonusGold, add difficulty
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='points') THEN
          ALTER TABLE "tasks" RENAME COLUMN "points" TO "goldReward";
        END IF;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='bonusPoints') THEN
          ALTER TABLE "tasks" RENAME COLUMN "bonusPoints" TO "bonusGold";
        END IF;
      END $$
    `);
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "difficulty" varchar NOT NULL DEFAULT 'easy'`);

    // transactions: distinguish XP ledger from gold ledger (existing rows are gold)
    await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "currency" varchar NOT NULL DEFAULT 'gold'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "currency"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "difficulty"`);
    await queryRunner.query(`ALTER TABLE "tasks" RENAME COLUMN "bonusGold" TO "bonusPoints"`);
    await queryRunner.query(`ALTER TABLE "tasks" RENAME COLUMN "goldReward" TO "points"`);
    await queryRunner.query(`ALTER TABLE "children" DROP COLUMN IF EXISTS "class"`);
    await queryRunner.query(`ALTER TABLE "children" DROP COLUMN IF EXISTS "xp"`);
  }
}
