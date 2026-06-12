import 'reflect-metadata'
import { DataSource, DataSourceOptions } from 'typeorm'
import { env } from '../env'
import { UserEntity } from '../users/entities/user.entity'
import { InstalledToolEntity } from '../tools/entities/installed-tool.entity'
import { ToolActionInvocationEntity } from '../tools/entities/tool-action-invocation.entity'
import { ToolManifestEntity } from '../tools/entities/tool-manifest.entity'
import {
  ContextRecordEntity,
  ContextSchemaEntity,
  ContextSummaryEntity,
  EducationEntity,
  GoalEntity,
  HealthLogEntity,
  JobTargetEntity,
  ProjectEntryEntity,
  SkillEntity,
  SocialVoiceEntity,
  TodoEntity,
  WorkLogEntity,
} from '../context/entities'

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: env.DATABASE_URL,
  // Schema is owned exclusively by migrations. `synchronize` is hard-off in every
  // environment to prevent accidental schema drift or destructive auto-alters.
  synchronize: false,
  // Migrations are run explicitly via `pnpm db:migrate`, never on boot.
  migrationsRun: false,
  logging: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  // Explicit list — a filename glob silently misses entities that live in
  // barrel files (context/entities/index.ts) and breaks under compiled output.
  entities: [
    UserEntity,
    InstalledToolEntity,
    ToolActionInvocationEntity,
    ToolManifestEntity,
    WorkLogEntity,
    JobTargetEntity,
    SkillEntity,
    ProjectEntryEntity,
    EducationEntity,
    GoalEntity,
    SocialVoiceEntity,
    HealthLogEntity,
    TodoEntity,
    ContextSummaryEntity,
    ContextSchemaEntity,
    ContextRecordEntity,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
}

export default new DataSource(dataSourceOptions)
