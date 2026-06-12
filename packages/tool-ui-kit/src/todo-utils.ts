import type { TodoEntry } from '@onlydesk/shared-types'

export const isoDate = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Monday-start dates of the week containing `now`. */
export const weekDates = (now = new Date()): Date[] => {
  const monday = new Date(now)
  const offset = (now.getDay() + 6) % 7 // 0 for Monday
  monday.setDate(now.getDate() - offset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export const isRecurring = (t: TodoEntry): boolean => t.recurrence !== 'none'

/** Is this recurring todo scheduled on the given date? */
export const isScheduledOn = (t: TodoEntry, date: Date): boolean => {
  if (t.recurrence === 'daily') return true
  if (t.recurrence === 'weekly') return t.recurrenceDays.includes(date.getDay())
  return false
}

export const isCompletedOn = (t: TodoEntry, date: Date): boolean => t.completions.includes(isoDate(date))

/** Toggle a completion date, returning the next completions array. */
export const toggleCompletion = (t: TodoEntry, date: Date): string[] => {
  const key = isoDate(date)
  return t.completions.includes(key) ? t.completions.filter((c) => c !== key) : [...t.completions, key].sort()
}

export type HeatDay = { date: Date; scheduled: number; completed: number; ratio: number }

/** Daily completion ratios for the trailing `weeks` (heatmap source). */
export const heatmapData = (todos: TodoEntry[], weeks = 12, now = new Date()): HeatDay[][] => {
  const recurring = todos.filter(isRecurring)
  const thisWeek = weekDates(now)
  const columns: HeatDay[][] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const col: HeatDay[] = thisWeek.map((d) => {
      const date = new Date(d)
      date.setDate(d.getDate() - w * 7)
      const scheduled = recurring.filter((t) => isScheduledOn(t, date)).length
      const completed = recurring.filter((t) => isScheduledOn(t, date) && isCompletedOn(t, date)).length
      return { date, scheduled, completed, ratio: scheduled ? completed / scheduled : 0 }
    })
    columns.push(col)
  }
  return columns
}

/** Current streak: consecutive days (ending today/yesterday) with every scheduled habit done. */
export const currentStreak = (todos: TodoEntry[], now = new Date()): number => {
  const recurring = todos.filter(isRecurring)
  if (!recurring.length) return 0
  let streak = 0
  for (let back = 0; back < 365; back++) {
    const d = new Date(now)
    d.setDate(now.getDate() - back)
    const scheduled = recurring.filter((t) => isScheduledOn(t, d))
    if (!scheduled.length) {
      if (back === 0) continue
      streak++
      continue
    }
    const allDone = scheduled.every((t) => isCompletedOn(t, d))
    if (allDone) streak++
    else if (back === 0) continue // today isn't over yet
    else break
  }
  return streak
}
