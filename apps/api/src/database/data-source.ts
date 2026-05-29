import 'reflect-metadata'
import { DataSource, DataSourceOptions } from 'typeorm'
import { env } from '../env'

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: env.DATABASE_URL,
  synchronize: false,
  logging: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
}

export default new DataSource(dataSourceOptions)
