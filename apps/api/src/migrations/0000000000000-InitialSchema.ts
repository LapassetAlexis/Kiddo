import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1000000000000 implements MigrationInterface {
    name = 'InitialSchema1000000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "parent_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "name" character varying, "fcmToken" character varying, "notifTaskSubmitted" boolean NOT NULL DEFAULT true, "notifRewardClaimed" boolean NOT NULL DEFAULT true, "notifStreakAlert" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "familyId" uuid, CONSTRAINT "UQ_cc01b77c65ccde2e6ca72689284" UNIQUE ("email"), CONSTRAINT "PK_7e39d3f86bf0707a68b3482b8ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "families" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying, "timezone" character varying NOT NULL DEFAULT 'Europe/Paris', "inviteCode" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_37a88e1783ea7185aac89233724" UNIQUE ("inviteCode"), CONSTRAINT "PK_70414ac0c8f45664cf71324b9bb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "goldReward" integer NOT NULL, "difficulty" character varying NOT NULL DEFAULT 'easy', "frequency" character varying NOT NULL DEFAULT 'daily', "status" character varying NOT NULL DEFAULT 'created', "photoUrl" text, "note" character varying, "rejectionReason" character varying, "timesPerDay" integer NOT NULL DEFAULT '1', "bonusGold" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "submittedAt" TIMESTAMP, "validatedAt" TIMESTAMP, "approvedByName" character varying, "childId" uuid, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rewards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "emoji" character varying, "cost" integer NOT NULL, "availability" character varying NOT NULL DEFAULT 'unlimited', "status" character varying NOT NULL DEFAULT 'available', "claimedByChildId" character varying, "grantedByName" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "familyId" uuid, CONSTRAINT "PK_3d947441a48debeb9b7366f8b8c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pin_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptCount" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "childId" uuid, CONSTRAINT "PK_bc40035572f6707e3bb34e587e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "children" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "avatar" character varying NOT NULL, "color" character varying NOT NULL DEFAULT '#FFB300', "sprite" character varying, "pinHash" character varying NOT NULL, "xp" integer NOT NULL DEFAULT '0', "class" character varying NOT NULL DEFAULT 'warrior', "fcmToken" character varying, "pendingLevelUp" integer, "levelGoal" integer, "levelGoalReward" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "familyId" uuid, CONSTRAINT "PK_8c5a7cbebf2c702830ef38d22b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "amount" integer NOT NULL, "currency" character varying NOT NULL DEFAULT 'gold', "referenceId" character varying, "note" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "childId" uuid, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification_intents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fcmToken" character varying NOT NULL, "payload" jsonb NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "sentAt" TIMESTAMP, CONSTRAINT "PK_17dbdb2e23e3f8a487f3f0f56da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "qr_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tokenHash" character varying NOT NULL, "childId" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a15da7300056c43ee429dec3211" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "password_resets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "code" character varying(6) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4816377aa98211c1de34469e742" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "email_verifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "code" character varying(6) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c1ea2921e767f83cd44c0af203f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "parent_accounts" ADD CONSTRAINT "FK_99affa2a40778f0b008f90c7029" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_72527f399abce0550bb6e7963da" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rewards" ADD CONSTRAINT "FK_7d10ffb644d0243020a523fdbce" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pin_attempts" ADD CONSTRAINT "FK_65bd55504d72cdc4d84293e4cdd" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "children" ADD CONSTRAINT "FK_60470a6ffee687392d8c64c31a9" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_9cca4e4584c7a51cd3f7fdd499a" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_9cca4e4584c7a51cd3f7fdd499a"`);
        await queryRunner.query(`ALTER TABLE "children" DROP CONSTRAINT "FK_60470a6ffee687392d8c64c31a9"`);
        await queryRunner.query(`ALTER TABLE "pin_attempts" DROP CONSTRAINT "FK_65bd55504d72cdc4d84293e4cdd"`);
        await queryRunner.query(`ALTER TABLE "rewards" DROP CONSTRAINT "FK_7d10ffb644d0243020a523fdbce"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_72527f399abce0550bb6e7963da"`);
        await queryRunner.query(`ALTER TABLE "parent_accounts" DROP CONSTRAINT "FK_99affa2a40778f0b008f90c7029"`);
        await queryRunner.query(`DROP TABLE "email_verifications"`);
        await queryRunner.query(`DROP TABLE "password_resets"`);
        await queryRunner.query(`DROP TABLE "qr_tokens"`);
        await queryRunner.query(`DROP TABLE "notification_intents"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "children"`);
        await queryRunner.query(`DROP TABLE "pin_attempts"`);
        await queryRunner.query(`DROP TABLE "rewards"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TABLE "families"`);
        await queryRunner.query(`DROP TABLE "parent_accounts"`);
    }

}
