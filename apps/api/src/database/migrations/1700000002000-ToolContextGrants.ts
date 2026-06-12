import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Per-installation context grants: the user-owned list of scope keys a tool may
 * read. Backfilled from each tool's declared manifest scopes so existing
 * installs keep working exactly as before.
 */
export class ToolContextGrants1700000002000 implements MigrationInterface {
  name = 'ToolContextGrants1700000002000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "installed_tools" ADD COLUMN "context_grants" jsonb NOT NULL DEFAULT '[]'::jsonb`)
    await queryRunner.query(`
      UPDATE "installed_tools" it
      SET "context_grants" = COALESCE(tm."manifest"->'contextScopes', '[]'::jsonb)
      FROM "tool_manifests" tm
      WHERE tm."tool_id" = it."tool_id"
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "installed_tools" DROP COLUMN "context_grants"`)
  }
}
