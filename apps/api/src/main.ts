import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { env } from './env'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.use(helmet())
  app.use(cookieParser())
  app.enableCors({ origin: env.WEB_ORIGIN, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  app.useGlobalFilters(new AllExceptionsFilter())
  app.setGlobalPrefix('api')
  await app.listen(env.PORT)
  console.info(`[onlydesk-api] listening on :${env.PORT}`)
}

bootstrap()
