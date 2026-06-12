import type { ActionHandler } from '@onlydesk/tools-sdk'
import type { TodoEntry, TodoRecurrence } from '@onlydesk/shared-types'

export type ParsedTodo = {
  title: string
  dueDate: string | null
  time: string | null
  recurrence: TodoRecurrence
  recurrenceDays: number[]
  tags: string[]
}

export type ParseTodoOutput = {
  /** Every task extracted from the sentence — one input can yield several. */
  todos: TodoEntry[]
  parsed: ParsedTodo[]
  engine: 'gemini-2.5-pro'
}

const INSTRUCTION = `You parse natural-language task input into structured tasks. Today's date and
weekday are given in the prompt.

A single sentence may contain MULTIPLE tasks (e.g. "Gym at 7pm every Monday and stretch
for 10 min daily" is TWO tasks). Extract each one.

Field rules:
- title: clean imperative phrase with all date/time/recurrence words removed.
- dueDate: YYYY-MM-DD, only for one-off tasks ("tonight"/"today" = today, "tomorrow" = today+1). Null for recurring.
- time: HH:MM 24-hour, or null.
- recurrence: "none", "daily", or "weekly".
- recurrenceDays: for weekly only — integers 0-6, 0=Sunday.
- tags: lowercase topical tags implied by the task (e.g. fitness, health, work), plus any explicit #hashtags.`

/** JSON Schema enforced via Gemini structured output. */
const RESPONSE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    todos: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          dueDate: { type: ['string', 'null'] },
          time: { type: ['string', 'null'] },
          recurrence: { type: 'string', enum: ['none', 'daily', 'weekly'] },
          recurrenceDays: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 6 } },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'dueDate', 'time', 'recurrence', 'recurrenceDays', 'tags'],
      },
    },
  },
  required: ['todos'],
}

const extractJson = <T>(text: string): T | null => {
  try {
    return JSON.parse(text) as T
  } catch {
    /* fall through */
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

const sanitize = (p: Partial<ParsedTodo>): ParsedTodo | null => {
  if (typeof p.title !== 'string' || !p.title.trim()) return null
  const recurrence: TodoRecurrence = p.recurrence === 'daily' || p.recurrence === 'weekly' ? p.recurrence : 'none'
  return {
    title: p.title.trim(),
    dueDate: typeof p.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.dueDate) ? p.dueDate : null,
    time: typeof p.time === 'string' && /^\d{2}:\d{2}$/.test(p.time) ? p.time : null,
    recurrence,
    recurrenceDays:
      recurrence === 'weekly' && Array.isArray(p.recurrenceDays) ? p.recurrenceDays.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6) : [],
    tags: Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase().replace(/^#/, '')) : [],
  }
}

/**
 * parse-todo — the Omni-Input Bar's brain. Gemini 2.5 Pro extracts one or more
 * structured tasks from the sentence (schema-enforced JSON) and each is
 * persisted to the `todos` scope. No mock engine: a missing key or failed run
 * fails the invocation with a clear, user-visible error.
 */
export const parseTodo: ActionHandler<'todos'> = async ({ input, ctx, runAgent }) => {
  const text = typeof input.text === 'string' ? input.text.trim() : ''
  if (!text) throw new Error('text is required')

  const now = new Date()
  const result = await runAgent({
    instruction: INSTRUCTION,
    prompt: `Today is ${now.toISOString().slice(0, 10)} (a ${now.toLocaleDateString('en-US', { weekday: 'long' })}).\nInput: ${text}`,
    responseSchema: RESPONSE_SCHEMA,
  })

  const raw = extractJson<{ todos?: Partial<ParsedTodo>[] }>(result.text)
  const parsed = (raw?.todos ?? []).map(sanitize).filter((p): p is ParsedTodo => p !== null)
  if (!parsed.length) throw new Error('Gemini could not extract any task from that input — try rephrasing')

  const todos: TodoEntry[] = []
  for (const p of parsed) {
    todos.push(
      await ctx.write('todos', {
        title: p.title,
        dueDate: p.dueDate,
        time: p.time,
        recurrence: p.recurrence,
        recurrenceDays: p.recurrenceDays,
        tags: p.tags,
        completions: [],
        status: 'open',
      }),
    )
  }

  const out: ParseTodoOutput = { todos, parsed, engine: 'gemini-2.5-pro' }
  return out
}
