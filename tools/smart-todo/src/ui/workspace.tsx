'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck2, Check, Flame, Grid3X3, Loader2 } from 'lucide-react'
import type { TodoEntry } from '@onlydesk/shared-types'
import { cn, Chip, useScopeRecords, useUpdateRecord, currentStreak, heatmapData, isCompletedOn, isRecurring, isScheduledOn, isoDate, toggleCompletion, weekDates, type ToolWorkspaceProps } from '@onlydesk/tool-ui-kit'
import { OmniBar } from './desk-icon'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * Smart Todo workspace — the Habit Matrix. Recurring tasks on the left, the
 * current week's seven days across; the Streaks tab is a GitHub-style heatmap
 * of habit consistency. Checking a cell rings a mechanical click animation.
 */
export const ToolWorkspace = (_props: ToolWorkspaceProps) => {
  const records = useScopeRecords('todos')
  const [tab, setTab] = useState<'matrix' | 'streaks'>('matrix')
  const todos = (records.data ?? []) as unknown as TodoEntry[]
  const habits = todos.filter(isRecurring)
  const oneOffs = todos.filter((t) => !isRecurring(t) && t.status === 'open')
  const week = useMemo(() => weekDates(), [])
  const streak = useMemo(() => currentStreak(todos), [todos])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-line/[0.08] px-4 py-2">
        <button onClick={() => setTab('matrix')} className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors', tab === 'matrix' ? 'bg-accent/20 text-ink' : 'text-ink-dim hover:text-ink')}>
          <Grid3X3 size={13} /> Habit Matrix
        </button>
        <button onClick={() => setTab('streaks')} className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors', tab === 'streaks' ? 'bg-accent/20 text-ink' : 'text-ink-dim hover:text-ink')}>
          <Flame size={13} /> Streaks
        </button>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-dim">
          <Flame size={13} className="text-accent" /> {streak} day streak
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {records.isLoading ? (
          <div className="flex justify-center py-12 text-ink-dim">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : tab === 'matrix' ? (
          <div className="space-y-6">
            <HabitMatrix habits={habits} week={week} />
            <OneOffList oneOffs={oneOffs} />
          </div>
        ) : (
          <StreakHeatmap todos={todos} />
        )}
      </div>

      {/* The Omni-Input Bar lives down here too — same engine as the widget */}
      <div className="border-t border-line/[0.08] p-3.5">
        <OmniBar />
      </div>
    </div>
  )
}

/* ===== The 7-day matrix ===== */

const HabitMatrix = ({ habits, week }: { habits: TodoEntry[]; week: Date[] }) => {
  if (!habits.length) return <p className="py-8 text-center text-sm italic text-ink-dim/70">No recurring habits yet — try “gym at 7pm every Monday” below.</p>
  const today = isoDate(new Date())

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-y-1">
        <thead>
          <tr>
            <th className="engraved pb-1 text-left font-medium">Habit</th>
            {week.map((d, i) => (
              <th key={i} className={cn('pb-1 text-center text-[10px] font-medium uppercase tracking-wider', isoDate(d) === today ? 'text-accent' : 'text-ink-dim/70')}>
                {DAY_LABELS[i]}
                <span className="block text-[9px] font-normal text-ink-dim/50">{d.getDate()}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} week={week} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const HabitRow = ({ habit, week }: { habit: TodoEntry; week: Date[] }) => {
  const update = useUpdateRecord('todos')
  return (
    <tr>
      <td className="rounded-l-xl border-y border-l border-line/[0.07] bg-pane/[0.03] py-2 pl-3 pr-2">
        <p className="text-xs text-ink">{habit.title}</p>
        <p className="text-[10px] text-ink-dim/70">
          {habit.time ? `${habit.time} · ` : ''}
          {habit.recurrence === 'daily' ? 'every day' : habit.recurrenceDays.map((d) => DAY_LABELS[(d + 6) % 7]).join(', ')}
        </p>
      </td>
      {week.map((date, i) => {
        const scheduled = isScheduledOn(habit, date)
        const done = isCompletedOn(habit, date)
        const future = date > new Date()
        return (
          <td key={i} className={cn('border-y border-line/[0.07] bg-pane/[0.03] text-center', i === week.length - 1 && 'rounded-r-xl border-r')}>
            {scheduled ? (
              <MatrixCheck
                done={done}
                disabled={update.isPending || future}
                dim={future}
                onToggle={() => update.mutate({ id: habit.id, patch: { completions: toggleCompletion(habit, date) } })}
              />
            ) : (
              <span className="mx-auto block h-1 w-1 rounded-full bg-line/15" />
            )}
          </td>
        )
      })}
    </tr>
  )
}

/** The mechanical click — a fast press-in, an overshooting spring back, a popping tick. */
const MatrixCheck = ({ done, disabled, dim, onToggle }: { done: boolean; disabled?: boolean; dim?: boolean; onToggle: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.72 }}
    transition={{ type: 'spring', stiffness: 640, damping: 16 }}
    onClick={onToggle}
    disabled={disabled}
    aria-label={done ? 'Mark not done' : 'Mark done'}
    className={cn(
      'mx-auto my-1 flex h-7 w-7 items-center justify-center rounded-lg border transition-colors',
      done ? 'border-accent/60 bg-accent/30 shadow-[0_0_12px_hsl(var(--accent)/0.35)]' : 'border-line/[0.14] bg-pane/[0.04] hover:border-accent/40',
      dim && 'opacity-35',
    )}
  >
    {done && (
      <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 700, damping: 18 }}>
        <Check size={14} className="text-ink" />
      </motion.span>
    )}
  </motion.button>
)

/* ===== One-off tasks under the matrix ===== */

const OneOffList = ({ oneOffs }: { oneOffs: TodoEntry[] }) => {
  const update = useUpdateRecord('todos')
  if (!oneOffs.length) return null
  return (
    <section>
      <p className="engraved mb-2 flex items-center gap-1.5">
        <CalendarCheck2 size={11} /> One-off tasks
      </p>
      <ul className="space-y-1.5">
        {oneOffs.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-xl border border-line/[0.07] bg-pane/[0.03] px-3 py-2">
            <MatrixCheck done={false} onToggle={() => update.mutate({ id: t.id, patch: { status: 'done' } })} />
            <span className="flex-1 text-xs text-ink">{t.title}</span>
            {t.dueDate && <Chip>{t.dueDate}{t.time ? ` ${t.time}` : ''}</Chip>}
            {t.tags.filter((x) => x !== 'seed').map((x) => (
              <Chip key={x}>{x}</Chip>
            ))}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ===== Streak heatmap — GitHub contributions, but for habits ===== */

const StreakHeatmap = ({ todos }: { todos: TodoEntry[] }) => {
  const columns = useMemo(() => heatmapData(todos, 12), [todos])
  const cellTone = (ratio: number, scheduled: number): string => {
    if (!scheduled) return 'bg-pane/[0.04]'
    if (ratio === 0) return 'bg-pane/[0.08]'
    if (ratio < 0.5) return 'bg-accent/25'
    if (ratio < 1) return 'bg-accent/50'
    return 'bg-accent/80 shadow-[0_0_8px_hsl(var(--accent)/0.4)]'
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-dim">Last 12 weeks of habit consistency — darker squares are fuller days.</p>
      <div className="flex gap-1 overflow-x-auto pb-2">
        <div className="mr-1 flex flex-col justify-between py-0.5">
          {['Mon', 'Thu', 'Sun'].map((d) => (
            <span key={d} className="text-[9px] text-ink-dim/60">{d}</span>
          ))}
        </div>
        {columns.map((col, w) => (
          <div key={w} className="flex flex-col gap-1">
            {col.map((day, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (w * 7 + i) * 0.004 }}
                title={`${isoDate(day.date)} — ${day.completed}/${day.scheduled} done`}
                className={cn('h-4 w-4 rounded-[4px]', cellTone(day.ratio, day.scheduled), day.date > new Date() && 'opacity-25')}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-ink-dim/70">
        less
        {['bg-pane/[0.08]', 'bg-accent/25', 'bg-accent/50', 'bg-accent/80'].map((c) => (
          <span key={c} className={cn('h-3 w-3 rounded-[3px]', c)} />
        ))}
        more
      </div>
    </div>
  )
}
