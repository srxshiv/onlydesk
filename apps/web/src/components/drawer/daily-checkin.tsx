'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, GlassWater, Loader2, Minus, Plus } from 'lucide-react'
import { GlassButton } from '@/components/ui/glass'
import { useCreateRecord } from '@/hooks/use-context'
import { asApiError } from '@/lib/errors'

const MOODS = [
  { value: 1, face: '🌧', label: 'Rough' },
  { value: 2, face: '🌫', label: 'Meh' },
  { value: 3, face: '⛅', label: 'Okay' },
  { value: 4, face: '🌤', label: 'Good' },
  { value: 5, face: '☀️', label: 'Great' },
] as const

/**
 * "How are you doing today?" — the drawer's quick-entry header for temporal
 * daily data. Mood, energy, and water land in the built-in health_log as a
 * `daily_checkin` payload, so tools granted health_log can read it like any
 * other entry.
 */
export const DailyCheckin = () => {
  const create = useCreateRecord('health_log')
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState(3)
  const [waterMl, setWaterMl] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    try {
      await create.mutateAsync({
        date: new Date().toISOString().slice(0, 10),
        type: 'other',
        payload: { kind: 'daily_checkin', mood, energy, waterMl },
      })
      setDone(true)
    } catch (e) {
      setError(asApiError(e).message)
    }
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="pane-edge flex items-center gap-3 rounded-2xl border border-line/10 bg-pane/[0.05] px-4 py-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moss/20 text-moss-soft">
          <Check size={15} />
        </span>
        <div>
          <p className="font-display text-sm text-ink">Noted for today.</p>
          <p className="text-[11px] text-ink-dim">Logged to your Health Log.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="pane-edge rounded-2xl border border-line/10 bg-pane/[0.05] p-4">
      <p className="font-display text-[15px] text-ink">How are you doing today?</p>

      {/* Mood */}
      <div className="mt-3 flex justify-between gap-1">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMood(m.value)}
            aria-label={m.label}
            title={m.label}
            className={`flex h-10 flex-1 items-center justify-center rounded-xl border text-lg transition-all ${
              mood === m.value ? 'border-accent/50 bg-accent/20 shadow-[0_0_16px_hsl(var(--accent)/0.25)]' : 'border-line/[0.07] bg-pane/[0.03] opacity-60 hover:opacity-100'
            }`}
          >
            {m.face}
          </button>
        ))}
      </div>

      {/* Energy */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="engraved">Energy</span>
          <span className="text-[11px] text-ink-dim">{['—', 'running on fumes', 'low', 'steady', 'charged', 'electric'][energy]}</span>
        </div>
        <input type="range" min={1} max={5} step={1} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="slider-warm" aria-label="Energy level" />
      </div>

      {/* Water */}
      <div className="mt-4 flex items-center justify-between">
        <span className="engraved flex items-center gap-1.5">
          <GlassWater size={12} /> Water
        </span>
        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWaterMl((v) => Math.max(0, v - 250))} aria-label="Less water">
            <Minus size={13} />
          </GlassButton>
          <span className="w-16 text-center text-sm tabular-nums text-ink">{waterMl} ml</span>
          <GlassButton variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWaterMl((v) => v + 250)} aria-label="More water">
            <Plus size={13} />
          </GlassButton>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg border border-clay/25 bg-clay/10 px-3 py-2 text-xs text-clay-soft">{error}</p>}

      <GlassButton variant="accent" size="sm" className="mt-4 w-full" onClick={submit} disabled={create.isPending || mood === null}>
        {create.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
        {mood === null ? 'Pick a mood to log today' : 'Log today'}
      </GlassButton>
    </div>
  )
}
