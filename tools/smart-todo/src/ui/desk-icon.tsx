'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2, Sparkles } from 'lucide-react'
import type { TodoEntry } from '@onlydesk/shared-types'
import { asApiError, cn, useScopeRecords, useUpdateRecord, useInvokeAction, isCompletedOn, isRecurring, isScheduledOn, isoDate, toggleCompletion, type ToolDeskIconProps } from '@onlydesk/tool-ui-kit'

/**
 * The Omni-Input Bar — type like a human ("gym at 7pm every Monday",
 * "remind me to push the migration tonight") and the parse-todo action turns
 * it into a structured task instantly. Shared by the widget and the workspace.
 */
export const OmniBar = ({ compact }: { compact?: boolean }) => {
  const invoke = useInvokeAction()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setError(null)
    try {
      const invocation = await invoke.mutateAsync({ toolId: 'smart-todo', actionId: 'parse-todo', input: { text: t } })
      // Inline actions return a terminal invocation — surface handler failures
      // (e.g. Gemini not configured) instead of silently swallowing them.
      if (invocation.status === 'failed') {
        setError(invocation.error ?? 'Could not parse that — try rephrasing.')
        return
      }
      setText('')
    } catch (err) {
      setError(asApiError(err).message)
    }
  }

  return (
    <form onSubmit={submit} onPointerDownCapture={(e) => e.stopPropagation()} className="space-y-1">
      <div className={cn('flex items-center gap-2 rounded-xl border border-line/[0.12] bg-pane/[0.05] px-3 backdrop-blur-md transition-colors focus-within:border-accent/50', compact ? 'h-8' : 'h-10')}>
        {invoke.isPending ? <Loader2 size={13} className="shrink-0 animate-spin text-accent" /> : <Sparkles size={13} className="shrink-0 text-accent/70" />}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={compact ? 'gym at 7pm every Monday…' : 'Type like a human — "gym at 7pm every Monday", "push the migration tonight"…'}
          disabled={invoke.isPending}
          className="w-full bg-transparent text-xs text-ink placeholder:text-ink-dim/45 outline-none"
          aria-label="Add a task in natural language"
        />
      </div>
      {error && <p className="px-1 text-[10px] text-clay-soft">{error}</p>}
    </form>
  )
}

/** The desk-widget surface: today's tasks + the omni bar pinned at the bottom. */
export const ToolDeskIcon = ({ size }: ToolDeskIconProps) => {
  const rows = size === 'lg' ? 6 : 3
  const records = useScopeRecords('todos')
  const update = useUpdateRecord('todos')
  const todos = (records.data ?? []) as unknown as TodoEntry[]
  const today = new Date()

  // Today's slice: scheduled habits first, then open one-offs due today/overdue.
  const habitsToday = todos.filter((t) => isRecurring(t) && isScheduledOn(t, today))
  const oneOffs = todos.filter((t) => !isRecurring(t) && t.status === 'open' && (!t.dueDate || t.dueDate <= isoDate(today)))
  const items = [...habitsToday, ...oneOffs].slice(0, rows)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {records.isLoading && <li className="py-2 text-center text-[11px] text-ink-dim/60">opening the notebook…</li>}
        {!records.isLoading && items.length === 0 && <li className="py-2 text-center text-[11px] italic text-ink-dim/60">Nothing on the desk for today.</li>}
        {items.map((t) => {
          const habit = isRecurring(t)
          const done = habit ? isCompletedOn(t, today) : false
          return (
            <li key={t.id} className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 640, damping: 16 }}
                onClick={() =>
                  habit
                    ? update.mutate({ id: t.id, patch: { completions: toggleCompletion(t, today) } })
                    : update.mutate({ id: t.id, patch: { status: 'done' } })
                }
                onPointerDownCapture={(e) => e.stopPropagation()}
                aria-label={done ? 'Mark not done' : 'Mark done'}
                className={cn(
                  'flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-colors',
                  done ? 'border-accent/60 bg-accent/30' : 'border-line/20 hover:border-accent/40',
                )}
              >
                {done && <Check size={11} className="text-ink" />}
              </motion.button>
              <span className={cn('truncate text-[11px]', done ? 'text-ink-dim/50 line-through' : 'text-ink/90')}>{t.title}</span>
              {t.time && <span className="ml-auto shrink-0 text-[10px] tabular-nums text-ink-dim/60">{t.time}</span>}
            </li>
          )
        })}
      </ul>
      <div className="pt-1.5">
        <OmniBar compact />
      </div>
    </div>
  )
}
