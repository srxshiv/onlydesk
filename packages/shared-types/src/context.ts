/**
 * Context Store — the typed event log every tool reads from.
 *
 * Each scope is a typed table on the API side. Tools declare scopes
 * they need in their ToolManifest; runtime enforces declared-only reads.
 */

export type ContextScopeId =
  | 'work_log'
  | 'job_target'
  | 'skills'
  | 'projects'
  | 'education'
  | 'goals'
  | 'social_voice'
  | 'health_log'

export type WorkLogEntry = {
  id: string
  userId: string
  date: string
  project: string | null
  summary: string
  tags: string[]
  createdAt: string
}

export type JobTarget = {
  id: string
  userId: string
  company: string
  role: string
  description: string
  url: string | null
  status: 'open' | 'applied' | 'interviewing' | 'closed'
  createdAt: string
  updatedAt: string
}

export type Skill = {
  id: string
  userId: string
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  yearsOfExperience: number | null
}

export type ProjectEntry = {
  id: string
  userId: string
  name: string
  description: string
  url: string | null
  startDate: string
  endDate: string | null
  tech: string[]
}

export type EducationEntry = {
  id: string
  userId: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string | null
}

export type GoalEntry = {
  id: string
  userId: string
  title: string
  description: string
  targetDate: string | null
  status: 'active' | 'achieved' | 'abandoned'
}

export type SocialVoiceSample = {
  id: string
  userId: string
  platform: 'twitter' | 'linkedin' | 'other'
  content: string
  postedAt: string | null
}

export type HealthLogEntry = {
  id: string
  userId: string
  date: string
  type: 'workout' | 'weight' | 'sleep' | 'other'
  payload: Record<string, unknown>
}

/** Maps a scope id to its entry type at the type level. */
export type ContextEntryByScope = {
  work_log: WorkLogEntry
  job_target: JobTarget
  skills: Skill
  projects: ProjectEntry
  education: EducationEntry
  goals: GoalEntry
  social_voice: SocialVoiceSample
  health_log: HealthLogEntry
}

export type ContextQuery<S extends ContextScopeId> = {
  scope: S
  limit?: number
  since?: string
  tags?: string[]
}

export type ContextSummary = {
  scope: ContextScopeId
  summary: string
  generatedAt: string
}
