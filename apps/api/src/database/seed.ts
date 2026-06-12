import 'reflect-metadata'
import { resumeEditorTool } from '@onlydesk/tool-resume-editor'
import { smartTodoTool } from '@onlydesk/tool-smart-todo'
import dataSource from './data-source'
import { ToolManifestEntity } from '../tools/entities/tool-manifest.entity'
import { ProjectEntryEntity, SkillEntity, TodoEntity, WorkLogEntity } from '../context/entities'
import { UserEntity } from '../users/entities/user.entity'

/**
 * Idempotent seed.
 *  1. Registers core tool manifests into the DB registry.
 *  2. Test data for the first user (or SEED_USER_EMAIL): an AI fullstack
 *     developer's work_log / skills / projects, plus a 6-day gym split with
 *     8 weeks of completion history so the habit matrix and streak heatmap
 *     render immediately.
 * Seeded rows are tagged 'seed' and skipped on re-run.
 */

const iso = (d: Date): string => d.toISOString().slice(0, 10)
const daysAgo = (n: number): Date => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function seedManifests(): Promise<void> {
  const repo = dataSource.getRepository(ToolManifestEntity)
  for (const manifest of [resumeEditorTool.manifest, smartTodoTool.manifest]) {
    await repo.save(repo.create({ toolId: manifest.id, name: manifest.name, version: manifest.version, category: manifest.category, manifest, builtin: true }))
    console.info(`[seed] upserted manifest: ${manifest.id} v${manifest.version}`)
  }
}

async function seedProfessionalContext(userId: string): Promise<void> {
  const workRepo = dataSource.getRepository(WorkLogEntity)
  const exists = await workRepo.findOne({ where: { userId, project: 'AI Interview Platform' } })
  if (exists) {
    console.info('[seed] professional context already present — skipping')
    return
  }

  const work: Array<Partial<WorkLogEntity>> = [
    { date: iso(daysAgo(2)), project: 'AI Interview Platform', summary: 'Shipped real-time interview rooms on WebRTC with live Gemini-powered question generation and answer scoring; cut median question latency from 2.1s to 380ms with streaming', tags: ['nextjs', 'webrtc', 'gemini', 'seed'] },
    { date: iso(daysAgo(5)), project: 'AI Interview Platform', summary: 'Built the NestJS evaluation pipeline: BullMQ workers transcribe answers, run rubric-based LLM grading, and persist structured feedback to Postgres', tags: ['nestjs', 'bullmq', 'postgresql', 'seed'] },
    { date: iso(daysAgo(9)), project: 'Telecalling Dashboard', summary: 'Designed server-side telecalling dashboard with live agent status over WebSockets; virtualized call-log tables to handle 50k rows without jank', tags: ['nestjs', 'websockets', 'react', 'seed'] },
    { date: iso(daysAgo(12)), project: 'Telecalling Dashboard', summary: 'Implemented call-outcome analytics in TypeScript: conversion funnels, per-agent leaderboards, and CSV export with streamed server-side generation', tags: ['typescript', 'analytics', 'seed'] },
    { date: iso(daysAgo(16)), project: 'AI Interview Platform', summary: 'Migrated session state to Redis with optimistic locking, enabling horizontal scale-out of interview rooms across 3 nodes', tags: ['redis', 'scaling', 'seed'] },
    { date: iso(daysAgo(20)), project: 'Internal Platform', summary: 'Introduced strict TypeScript across the Next.js App Router monorepo with shared zod contracts between API and client; removed 400+ implicit anys', tags: ['typescript', 'nextjs', 'zod', 'seed'] },
    { date: iso(daysAgo(25)), project: 'Telecalling Dashboard', summary: 'Hardened auth with JWT rotation and httpOnly cookies; added CASL row-level authorization across all tenant endpoints', tags: ['security', 'nestjs', 'seed'] },
    { date: iso(daysAgo(30)), project: 'AI Interview Platform', summary: 'Prototyped retrieval over candidate resumes with pgvector embeddings to auto-suggest follow-up questions', tags: ['ai', 'pgvector', 'seed'] },
  ]
  await workRepo.save(work.map((w) => workRepo.create({ ...w, userId })))

  const skillRepo = dataSource.getRepository(SkillEntity)
  const skills: Array<Partial<SkillEntity>> = [
    { name: 'TypeScript', level: 'expert', yearsOfExperience: 5 },
    { name: 'Next.js', level: 'expert', yearsOfExperience: 4 },
    { name: 'NestJS', level: 'advanced', yearsOfExperience: 3 },
    { name: 'React', level: 'expert', yearsOfExperience: 5 },
    { name: 'PostgreSQL', level: 'advanced', yearsOfExperience: 4 },
    { name: 'Redis & BullMQ', level: 'advanced', yearsOfExperience: 3 },
    { name: 'Gemini / LLM integration', level: 'advanced', yearsOfExperience: 2 },
    { name: 'WebRTC', level: 'intermediate', yearsOfExperience: 2 },
    { name: 'Docker', level: 'advanced', yearsOfExperience: 4 },
  ]
  await skillRepo.save(skills.map((s) => skillRepo.create({ ...s, userId })))

  const projRepo = dataSource.getRepository(ProjectEntryEntity)
  const projects: Array<Partial<ProjectEntryEntity>> = [
    {
      name: 'AI Interview Platform',
      description: 'Real-time technical interview platform: WebRTC rooms, streaming Gemini question generation, rubric-graded answers, and recruiter analytics. Next.js front, NestJS + BullMQ back.',
      url: 'https://github.com/example/ai-interview',
      startDate: iso(daysAgo(220)),
      endDate: null,
      tech: ['Next.js', 'NestJS', 'TypeScript', 'WebRTC', 'Gemini', 'PostgreSQL', 'Redis'],
    },
    {
      name: 'Telecalling Dashboard',
      description: 'Server-side dashboard for telecalling teams: live agent presence over WebSockets, 50k-row virtualized call logs, conversion funnels, and streamed CSV exports.',
      url: 'https://github.com/example/telecalling-dashboard',
      startDate: iso(daysAgo(400)),
      endDate: iso(daysAgo(160)),
      tech: ['NestJS', 'React', 'TypeScript', 'WebSockets', 'PostgreSQL'],
    },
  ]
  await projRepo.save(projects.map((p) => projRepo.create({ ...p, userId })))

  console.info(`[seed] professional context: ${work.length} work-log, ${skills.length} skills, ${projects.length} projects`)
}

/** 6-day split, Mon–Sat, with ~85% completion over the past 8 weeks. */
async function seedGymSplit(userId: string): Promise<void> {
  const todoRepo = dataSource.getRepository(TodoEntity)
  const existing = await todoRepo
    .createQueryBuilder('t')
    .where('t.user_id = :userId AND :tag = ANY(t.tags)', { userId, tag: 'seed' })
    .getCount()
  if (existing > 0) {
    console.info('[seed] gym split already present — skipping')
    return
  }

  const split: Array<{ title: string; day: number }> = [
    { title: 'Push day — chest, shoulders, triceps', day: 1 },
    { title: 'Pull day — back & biceps', day: 2 },
    { title: 'Leg day — squat focus', day: 3 },
    { title: 'Push day — overhead focus', day: 4 },
    { title: 'Pull day — deadlift focus', day: 5 },
    { title: 'Cardio & core', day: 6 },
  ]

  // Deterministic "misses": skip roughly 1 in 7 scheduled sessions, plus the
  // most recent 0-2 days so today's matrix has something left to check off.
  const todos = split.map(({ title, day }, idx) => {
    const completions: string[] = []
    for (let back = 56; back >= 1; back--) {
      const d = daysAgo(back)
      if (d.getDay() !== day) continue
      const skip = (back + idx * 3) % 7 === 0
      if (!skip) completions.push(iso(d))
    }
    return todoRepo.create({
      userId,
      title,
      dueDate: null,
      time: '19:00',
      recurrence: 'weekly' as const,
      recurrenceDays: [day],
      tags: ['fitness', 'gym', 'seed'],
      completions,
      status: 'open' as const,
    })
  })
  await todoRepo.save(todos)

  // A couple of one-offs so the list view isn't only habits.
  await todoRepo.save([
    todoRepo.create({ userId, title: 'Push the database migration', dueDate: iso(new Date()), time: '21:00', recurrence: 'none' as const, recurrenceDays: [], tags: ['work', 'seed'], completions: [], status: 'open' as const }),
    todoRepo.create({ userId, title: 'Renew gym membership', dueDate: iso(daysAgo(-3)), time: null, recurrence: 'none' as const, recurrenceDays: [], tags: ['fitness', 'seed'], completions: [], status: 'open' as const }),
  ])

  console.info(`[seed] gym split: ${todos.length} recurring habits + 2 one-offs (8 weeks of history)`)
}

async function seed(): Promise<void> {
  await dataSource.initialize()
  console.info('[seed] connected')

  await seedManifests()

  const users = dataSource.getRepository(UserEntity)
  const target = process.env.SEED_USER_EMAIL
    ? await users.findOne({ where: { email: process.env.SEED_USER_EMAIL } })
    : (await users.find({ order: { createdAt: 'ASC' }, take: 1 }))[0]

  if (!target) {
    console.info('[seed] no user found — sign up first, then re-run `pnpm db:seed` for test data')
  } else {
    console.info(`[seed] seeding test data for ${target.email}`)
    await seedProfessionalContext(target.id)
    await seedGymSplit(target.id)
  }

  await dataSource.destroy()
  console.info('[seed] done')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
