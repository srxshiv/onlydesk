import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Phase 2: the `todos` built-in scope (smart-todo's home) and a structured
 * progress log on invocations so the UI can render live execution status.
 */
export class TodosAndProgress1700000003000 implements MigrationInterface {
  name = 'TodosAndProgress1700000003000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ctx_todo" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" varchar(512) NOT NULL,
        "due_date" date,
        "time" varchar(16),
        "recurrence" varchar(16) NOT NULL DEFAULT 'none',
        "recurrence_days" int[] NOT NULL DEFAULT '{}',
        "tags" text[] NOT NULL DEFAULT '{}',
        "completions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "status" varchar(16) NOT NULL DEFAULT 'open',
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_todo_user_created" ON "ctx_todo" ("user_id", "created_at" DESC)`)
    await queryRunner.query(`ALTER TABLE "tool_action_invocations" ADD COLUMN "progress" jsonb NOT NULL DEFAULT '[]'::jsonb`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tool_action_invocations" DROP COLUMN "progress"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "ctx_todo"`)
  }
}
