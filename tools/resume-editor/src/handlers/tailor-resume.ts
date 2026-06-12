import type { ActionHandler } from '@onlydesk/tools-sdk'

/** One modified bullet in the JD delta diff. */
export type ResumeChange = {
  section: string
  before: string
  after: string
  reason: string
}

export type TailorResumeOutput = {
  latex: string
  changes: ResumeChange[]
  /** JD keywords not found anywhere in the user's context. */
  missingKeywords: string[]
  filename: string
  engine: 'gemini-2.5-pro'
}

const INSTRUCTION = `You are an expert resume tailor and LaTeX typesetter.

You receive a job description and the user's real context (work log, projects, skills,
education, job targets) as JSON. Produce a one-page, syntactically correct LaTeX resume
tailored to the JD.

Hard rules:
- NEVER invent experience, employers, dates, or metrics. Only rephrase, reorder, and
  emphasize what exists in the provided context.
- Mirror the JD's vocabulary only where the context can honestly support it.
- The "latex" field must be a COMPLETE compilable document: \\documentclass{article},
  geometry margins, no packages beyond geometry/enumitem, properly escaped specials
  (& % $ # _ { }).
- "changes" must list every bullet you rewrote: the exact original text from the
  context, your rewritten version, and which JD requirement the rewrite serves.
- "missingKeywords" must list JD requirements the context cannot honestly claim —
  these are the user's real gaps; do not smuggle them into the resume.`

/** JSON Schema enforced via Gemini structured output (responseJsonSchema). */
const RESPONSE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    latex: { type: 'string', description: 'Complete compilable LaTeX document' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section: { type: 'string' },
          before: { type: 'string' },
          after: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['section', 'before', 'after', 'reason'],
      },
    },
    missingKeywords: { type: 'array', items: { type: 'string' } },
  },
  required: ['latex', 'changes', 'missingKeywords'],
}

/** Defensive JSON extraction — structured output should be pure JSON, but never trust blindly. */
export const extractJson = <T>(text: string): T | null => {
  try {
    return JSON.parse(text) as T
  } catch {
    /* fall through to brace-walk */
  }
  const cleaned = text.replace(/```(?:json)?/g, '')
  const start = cleaned.indexOf('{')
  if (start < 0) return null
  let depth = 0
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++
    else if (cleaned[i] === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1)) as T
        } catch {
          return null
        }
      }
    }
  }
  return null
}

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))

type Scopes = 'work_log' | 'projects' | 'skills' | 'education' | 'job_target'

/**
 * tailor-resume — ingests every granted scope via readAny, stringifies it into
 * Gemini 2.5 Pro's context window, and demands schema-enforced JSON back.
 * No mock engine: a missing key or failed run fails the invocation with a
 * clear, user-visible error.
 */
export const tailorResume: ActionHandler<Scopes> = async ({ input, ctx, stream, runAgent, grantedScopes }) => {
  const jd = str(input.jobDescription).trim()
  if (!jd) throw new Error('jobDescription is required')
  const filename = str(input.filename).trim() || 'resume.pdf'

  // 1. Explicitly ingest everything the user granted this tool.
  stream({ type: 'progress', data: `Reading granted context (${grantedScopes.join(', ') || 'none'})` })
  const context: Record<string, Record<string, unknown>[]> = {}
  let total = 0
  for (const scope of grantedScopes) {
    const rows = await ctx.readAny(scope, { limit: 50 })
    context[scope] = rows
    total += rows.length
  }
  stream({ type: 'progress', data: `Ingested ${total} entries across ${grantedScopes.length} scope(s)` })
  if (total === 0) {
    throw new Error('No context to tailor from — add work log, skills, and projects in the Context Store (or wire scopes to this tool in Tool access).')
  }

  // 2. Gemini, schema-enforced.
  stream({ type: 'progress', data: 'Tailoring with Gemini 2.5 Pro (structured output)…' })
  const result = await runAgent({
    instruction: INSTRUCTION,
    prompt: `JOB DESCRIPTION:\n${jd}\n\nUSER CONTEXT (JSON):\n${JSON.stringify(context, null, 1)}`,
    responseSchema: RESPONSE_SCHEMA,
  })

  const parsed = extractJson<{ latex?: string; changes?: ResumeChange[]; missingKeywords?: string[] }>(result.text)
  if (!parsed?.latex?.trim()) {
    throw new Error('Gemini returned output without a usable "latex" field — try again')
  }

  stream({ type: 'progress', data: `LaTeX generated (${parsed.latex.length} chars, ${parsed.changes?.length ?? 0} diff entries)` })
  const out: TailorResumeOutput = {
    latex: parsed.latex,
    changes: Array.isArray(parsed.changes) ? parsed.changes : [],
    missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
    filename,
    engine: 'gemini-2.5-pro',
  }
  return out
}
