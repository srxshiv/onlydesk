import { MigrationInterface, QueryRunner } from 'typeorm'

/** Cloud-synced desk layout: each installation remembers its widget placement. */
export class ToolLayouts1700000004000 implements MigrationInterface {
  name = 'ToolLayouts1700000004000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "installed_tools" ADD COLUMN "layout" jsonb`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "installed_tools" DROP COLUMN "layout"`)
  }
}
