import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrTokens1780400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "qr_tokens" (
        "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tokenHash" VARCHAR NOT NULL,
        "childId"   UUID NOT NULL REFERENCES "children"("id") ON DELETE CASCADE,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt"    TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_qr_tokens_tokenHash" ON "qr_tokens" ("tokenHash");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "qr_tokens";`);
  }
}
