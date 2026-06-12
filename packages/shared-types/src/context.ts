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
  | 'todos'

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

export type TodoRecurrence = 'none' | 'daily' | 'weekly'

/** A task or habit. Recurring todos track per-day completion dates. */
export type TodoEntry = {
  id: string
  userId: string
  title: string
  /** One-off due date (YYYY-MM-DD); null for recurring habits. */
  dueDate: string | null
  /** Time of day, HH:MM 24h. */
  time: string | null
  recurrence: TodoRecurrence
  /** Weekly recurrence days, 0=Sun … 6=Sat. */
  recurrenceDays: number[]
  tags: string[]
  /** ISO dates (YYYY-MM-DD) on which this recurring todo was checked off. */
  completions: string[]
  status: 'open' | 'done'
  createdAt: string
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
  todos: TodoEntry
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

/** ===== Dynamic / user-defined context scopes ===== */

/**
 * Field types a user may declare on a custom context scope. These map to
 * JSON-serializable values stored inside a single JSONB `data` column, so a
 * new scope never requires a native database migration.
 */
export type CustomFieldType = 'string' | 'text' | 'number' | 'boolean' | 'date' | 'enum'

export type CustomFieldDef = {
  /** Stable key used inside the JSONB payload. */
  name: string
  /** Human label for UI rendering. */
  label?: string
  type: CustomFieldType
  required?: boolean
  /** Allowed values when `type === 'enum'`. */
  options?: string[]
}

/**
 * Metadata row describing a user-defined scope. The `key` is a slug unique per
 * user and is used in the same `/context/:scope` routes as the built-in scopes.
 */
export type CustomScopeDefinition = {
  id: string
  userId: string
  key: string
  name: string
  description: string | null
  fields: CustomFieldDef[]
  createdAt: string
  updatedAt: string
}

/** A single record stored against a custom scope definition. */
export type CustomContextRecord = {
  id: string
  userId: string
  scopeKey: string
  data: Record<string, unknown>
  createdAt: string
}

/** A scope id that may be either a known built-in scope or a custom slug. */
export type AnyContextScopeId = ContextScopeId | (string & {})
