import type { ContextScopeId } from '@onlydesk/shared-types'

/** The eight first-class, typed scopes backed by dedicated tables. */
export const BUILTIN_SCOPES: readonly ContextScopeId[] = ['work_log', 'job_target', 'skills', 'projects', 'education', 'goals', 'social_voice', 'health_log', 'todos']

export function isBuiltinScope(scope: string): scope is ContextScopeId {
  return (BUILTIN_SCOPES as readonly string[]).includes(scope)
}
