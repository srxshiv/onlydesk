import type { ActionHandler } from '@onlydesk/tools-sdk'

type Scopes = 'work_log' | 'projects' | 'skills' | 'education' | 'job_target'

/**
 * Phase-1 stub: real Overleaf MCP wiring lands in Phase 2.
 * This proves the end-to-end install -> invoke -> result loop works.
 */
export const tailorResume: ActionHandler<Scopes> = async ({ input, ctx, runAgent }) => {
  const jobTargetId = input.jobTargetId as string | undefined
  if (!jobTargetId) throw new Error('jobTargetId is required')

  const [workLog, projects, skills, education, targets] = await Promise.all([
    ctx.read('work_log', { limit: 50 }),
    ctx.read('projects', { limit: 20 }),
    ctx.read('skills', { limit: 50 }),
    ctx.read('education', { limit: 10 }),
    ctx.read('job_target', { limit: 50 }),
  ])

  const target = targets.find((t) => t.id === jobTargetId)
  if (!target) throw new Error('Job target not found')

  const agent = await runAgent({
    model: 'gemini-2.5-pro',
    instruction: 'You are a resume tailoring expert. Produce a LaTeX resume tailored to the given job description. Use only facts grounded in the provided context.',
    prompt: JSON.stringify({ target, workLog, projects, skills, education }, null, 2),
  })

  return {
    latex: agent.text,
    jobTargetId,
    generatedAt: new Date().toISOString(),
  }
}
