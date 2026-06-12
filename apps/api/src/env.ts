// Load apps/api/.env before validation — Nest and the TypeORM CLI don't do it.
import 'dotenv/config'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/** Decode a base64 or hex string and return its byte length (0 if invalid). */
function decodeKeyBytes(value: string): number {
  if (/^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0) return value.length / 2
  try {
    return Buffer.from(value, 'base64').length
  } catch {
    return 0
  }
}

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    WEB_ORIGIN: z.string().url(),

    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('30d'),
    COOKIE_DOMAIN: z.string().default('localhost'),

    /**
     * 32-byte key for AES-256-GCM at-rest encryption of per-tool secrets
     * (`installed_tools.config`). Accepts base64 or hex; must decode to exactly
     * 32 bytes. Generate with: `openssl rand -base64 32`.
     */
    CONFIG_ENCRYPTION_KEY: z.string().refine((v) => decodeKeyBytes(v) === 32, {
      message: 'CONFIG_ENCRYPTION_KEY must be a base64 or hex string decoding to exactly 32 bytes',
    }),

    /** BullMQ tuning for the tool-action pipeline. */
    JOB_ATTEMPTS: z.coerce.number().int().min(1).default(3),
    JOB_BACKOFF_MS: z.coerce.number().int().min(0).default(2000),
    JOB_TIMEOUT_MS: z.coerce.number().int().min(1000).default(120000),
    JOB_CONCURRENCY: z.coerce.number().int().min(1).default(5),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GITHUB_CALLBACK_URL: z.string().url().optional(),

    GOOGLE_API_KEY: z.string().optional(),
    GEMINI_DEFAULT_MODEL: z.string().default('gemini-2.5-pro'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})

export type Env = typeof env
