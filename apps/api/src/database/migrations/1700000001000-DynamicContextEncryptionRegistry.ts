import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Phase 0.5 hardening:
 *  - DB-backed tool manifest registry (`tool_manifests`).
 *  - Dynamic, user-defined context scopes (`ctx_custom_schemas` + `ctx_custom_records`).
 *  - Convert `installed_tools.config` from jsonb to a text AES-256-GCM envelope.
 */
export class DynamicContextEncryptionRegistry1700000001000 implements MigrationInterface {
  name = 'DynamicContextEncryptionRegistry1700000001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* ===== DB-backed tool manifest registry ===== */
    await queryRunner.query(`
      CREATE TABLE "tool_manifests" (
        "tool_id" varchar(128) PRIMARY KEY,
        "name" varchar(128) NOT NULL,
        "version" varchar(32) NOT NULL,
        "category" varchar(32) NOT NULL,
        "manifest" jsonb NOT NULL,
        "builtin" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    /* ===== Dynamic custom context scopes ===== */
    await queryRunner.query(`
      CREATE TABLE "ctx_custom_schemas" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "key" varchar(64) NOT NULL,
        "name" varchar(128) NOT NULL,
        "description" text,
        "fields" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE("user_id", "key")
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_custom_schemas_user" ON "ctx_custom_schemas" ("user_id")`)

    await queryRunner.query(`
      CREATE TABLE "ctx_custom_records" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "schema_id" uuid NOT NULL REFERENCES "ctx_custom_schemas"("id") ON DELETE CASCADE,
        "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_custom_records_user_schema_created" ON "ctx_custom_records" ("user_id", "schema_id", "created_at" DESC)`)

    /* ===== Encrypt installed_tools.config at rest (jsonb -> text envelope) ===== */
    // Existing values cannot be re-encrypted in SQL; reset to empty (re-configure on next install).
    await queryRunner.query(`ALTER TABLE "installed_tools" ALTER COLUMN "config" DROP DEFAULT`)
    await queryRunner.query(`ALTER TABLE "installed_tools" ALTER COLUMN "config" TYPE text USING ''`)
    await queryRunner.query(`ALTER TABLE "installed_tools" ALTER COLUMN "config" SET DEFAULT ''`)
    await queryRunner.query(`ALTER TABLE "installed_tools" ALTER COLUMN "config" SET NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "installed_tools" ALTER COLUMN "config" DROP DEFAULT`)
    await queryRunner.query(`ALTER TABLE "installed_tools" ALTER COLUMN "config" TYPE jsonb USING '{}'::jsonb`)
    await queryRunner.query(`ALTER TABLE "installed_tools" ALTER COLUMN "config" SET DEFAULT '{}'::jsonb`)

    await queryRunner.query(`DROP TABLE IF EXISTS "ctx_custom_records"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "ctx_custom_schemas"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "tool_manifests"`)
  }
}
