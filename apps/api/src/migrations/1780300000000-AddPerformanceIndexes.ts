import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1780300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_childId" ON "tasks" ("childId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_childId_status" ON "tasks" ("childId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_childId_status_validatedAt" ON "tasks" ("childId", "status", "validatedAt") WHERE "validatedAt" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_childId" ON "transactions" ("childId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_childId_type_currency" ON "transactions" ("childId", "type", "currency")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_rewards_familyId" ON "rewards" ("familyId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_rewards_familyId_status" ON "rewards" ("familyId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_intents_status" ON "notification_intents" ("status") WHERE "status" = 'pending'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_childId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_childId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_childId_status_validatedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_childId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_childId_type_currency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rewards_familyId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rewards_familyId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_intents_status"`);
  }
}
