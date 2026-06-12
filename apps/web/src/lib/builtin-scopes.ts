import type { ContextScopeId, CustomFieldDef } from '@onlydesk/shared-types'

/**
 * Client-side field templates for the eight built-in context scopes, mirroring
 * the API's typed entities. They feed the same DynamicForm used for custom
 * JSONB scopes, so hydrating built-in data is one code path.
 */

export type ScopePillar = 'personal' | 'professional'

export type BuiltinScopeMeta = {
  id: ContextScopeId
  name: string
  description: string
  /** Which drawer pillar this scope belongs to. */
  pillar: ScopePillar
  fields: CustomFieldDef[]
  /** Fields the API stores as string[]; submitted as comma-separated text. */
  arrayFields?: string[]
  /** Fields the API stores as JSONB objects; submitted as raw JSON text. */
  jsonFields?: string[]
}

export const BUILTIN_SCOPES_META: readonly BuiltinScopeMeta[] = [
  {
    id: 'work_log',
    pillar: 'professional',
    name: 'Work Log',
    description: 'What you did, day by day.',
    arrayFields: ['tags'],
    fields: [
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'project', label: 'Project', type: 'string' },
      { name: 'summary', label: 'Summary', type: 'text', required: true },
      { name: 'tags', label: 'Tags (comma separated)', type: 'string' },
    ],
  },
  {
    id: 'job_target',
    pillar: 'professional',
    name: 'Job Targets',
    description: 'Roles you are aiming for.',
    fields: [
      { name: 'company', label: 'Company', type: 'string', required: true },
      { name: 'role', label: 'Role', type: 'string', required: true },
      { name: 'description', label: 'Job description', type: 'text', required: true },
      { name: 'url', label: 'Listing URL', type: 'string' },
      { name: 'status', label: 'Status', type: 'enum', options: ['open', 'applied', 'interviewing', 'closed'] },
    ],
  },
  {
    id: 'skills',
    pillar: 'professional',
    name: 'Skills',
    description: 'What you know and how well.',
    fields: [
      { name: 'name', label: 'Skill', type: 'string', required: true },
      { name: 'level', label: 'Level', type: 'enum', required: true, options: ['beginner', 'intermediate', 'advanced', 'expert'] },
      { name: 'yearsOfExperience', label: 'Years of experience', type: 'number' },
    ],
  },
  {
    id: 'projects',
    pillar: 'professional',
    name: 'Projects',
    description: 'Things you have built.',
    arrayFields: ['tech'],
    fields: [
      { name: 'name', label: 'Name', type: 'string', required: true },
      { name: 'description', label: 'Description', type: 'text', required: true },
      { name: 'url', label: 'URL', type: 'string' },
      { name: 'startDate', label: 'Started', type: 'date', required: true },
      { name: 'endDate', label: 'Ended', type: 'date' },
      { name: 'tech', label: 'Tech (comma separated)', type: 'string' },
    ],
  },
  {
    id: 'education',
    pillar: 'professional',
    name: 'Education',
    description: 'Schools, degrees, dates.',
    fields: [
      { name: 'institution', label: 'Institution', type: 'string', required: true },
      { name: 'degree', label: 'Degree', type: 'string', required: true },
      { name: 'field', label: 'Field of study', type: 'string', required: true },
      { name: 'startDate', label: 'Started', type: 'date', required: true },
      { name: 'endDate', label: 'Ended', type: 'date' },
    ],
  },
  {
    id: 'goals',
    pillar: 'personal',
    name: 'Goals',
    description: 'Active, achieved, abandoned.',
    fields: [
      { name: 'title', label: 'Title', type: 'string', required: true },
      { name: 'description', label: 'Description', type: 'text', required: true },
      { name: 'targetDate', label: 'Target date', type: 'date' },
      { name: 'status', label: 'Status', type: 'enum', options: ['active', 'achieved', 'abandoned'] },
    ],
  },
  {
    id: 'social_voice',
    pillar: 'personal',
    name: 'Social Voice',
    description: 'Past posts that sound like you.',
    fields: [
      { name: 'platform', label: 'Platform', type: 'enum', required: true, options: ['twitter', 'linkedin', 'other'] },
      { name: 'content', label: 'Post content', type: 'text', required: true },
      { name: 'postedAt', label: 'Posted at', type: 'date' },
    ],
  },
  {
    id: 'todos',
    pillar: 'personal',
    name: 'Todos & Habits',
    description: 'Tasks and recurring habits — Smart Todo writes here.',
    arrayFields: ['tags'],
    fields: [
      { name: 'title', label: 'Task', type: 'string', required: true },
      { name: 'dueDate', label: 'Due date', type: 'date' },
      { name: 'time', label: 'Time (HH:MM)', type: 'string' },
      { name: 'recurrence', label: 'Recurrence', type: 'enum', options: ['none', 'daily', 'weekly'] },
      { name: 'tags', label: 'Tags (comma separated)', type: 'string' },
    ],
  },
  {
    id: 'health_log',
    pillar: 'personal',
    name: 'Health Log',
    description: 'Workouts, weight, sleep.',
    jsonFields: ['payload'],
    fields: [
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'type', label: 'Type', type: 'enum', required: true, options: ['workout', 'weight', 'sleep', 'other'] },
      { name: 'payload', label: 'Details (JSON)', type: 'text' },
    ],
  },
] as const

export const getBuiltinMeta = (id: string): BuiltinScopeMeta | undefined => BUILTIN_SCOPES_META.find((s) => s.id === id)
