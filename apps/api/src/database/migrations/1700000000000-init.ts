import { MigrationInterface, QueryRunner } from 'typeorm'

export class Init1700000000000 implements MigrationInterface {
  name = 'Init1700000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) UNIQUE NOT NULL,
        "name" varchar(255) NOT NULL,
        "password_hash" varchar(255),
        "avatar_url" varchar(1024),
        "providers" text[] NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "installed_tools" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "tool_id" varchar(128) NOT NULL,
        "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "enabled" boolean NOT NULL DEFAULT true,
        "installed_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE("user_id", "tool_id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "tool_action_invocations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "tool_id" varchar(128) NOT NULL,
        "action_id" varchar(128) NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'pending',
        "input" jsonb NOT NULL,
        "output" jsonb,
        "error" text,
        "started_at" timestamptz NOT NULL DEFAULT now(),
        "finished_at" timestamptz
      )
    `)

    /* ===== Context Store Scopes ===== */

    await queryRunner.query(`
      CREATE TABLE "ctx_work_log" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "project" varchar(255),
        "summary" text NOT NULL,
        "tags" text[] NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "ctx_job_target" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "company" varchar(255) NOT NULL,
        "role" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "url" varchar(1024),
        "status" varchar(32) NOT NULL DEFAULT 'open',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "ctx_skill" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "level" varchar(32) NOT NULL,
        "years_of_experience" int,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "ctx_project" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "url" varchar(1024),
        "start_date" date NOT NULL,
        "end_date" date,
        "tech" text[] NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "ctx_education" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "institution" varchar(255) NOT NULL,
        "degree" varchar(255) NOT NULL,
        "field" varchar(255) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "ctx_goal" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "target_date" date,
        "status" varchar(32) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "ctx_social_voice" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "platform" varchar(32) NOT NULL,
        "content" text NOT NULL,
        "posted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "ctx_health_log" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "type" varchar(32) NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "ctx_summaries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "scope" varchar(64) NOT NULL,
        "summary" text NOT NULL,
        "generated_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE("user_id", "scope")
      )
    `)

    await queryRunner.query(`CREATE INDEX "idx_work_log_user_date" ON "ctx_work_log" ("user_id", "date" DESC)`)
    await queryRunner.query(`CREATE INDEX "idx_job_target_user_status" ON "ctx_job_target" ("user_id", "status")`)
    await queryRunner.query(`CREATE INDEX "idx_invocations_user" ON "tool_action_invocations" ("user_id", "started_at" DESC)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'ctx_summaries',
      'ctx_health_log',
      'ctx_social_voice',
      'ctx_goal',
      'ctx_education',
      'ctx_project',
      'ctx_skill',
      'ctx_job_target',
      'ctx_work_log',
      'tool_action_invocations',
      'installed_tools',
      'users',
    ]
    for (const t of tables) await queryRunner.query(`DROP TABLE IF EXISTS "${t}"`)
  }
}
