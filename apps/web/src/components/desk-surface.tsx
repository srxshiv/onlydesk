'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

const lampLabels: Record<string, string> = { bright: 'bright', dim: 'dim', off: 'off' }

export const DeskSurface = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const cycle = () => {
    const order = ['bright', 'dim', 'off']
    const idx = order.indexOf(theme ?? 'bright')
    setTheme(order[(idx + 1) % order.length] ?? 'bright')
  }
  return (
    <section className="relative min-h-[80vh] overflow-hidden rounded-xl bg-desk-wood bg-desk-grain p-10 shadow-inner">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 0%, rgba(255,219,160,calc(var(--desk-ambient)*0.6)), transparent 60%)' }} />
      <button onClick={cycle} className={cn('absolute right-6 top-6 z-10 rounded-full bg-amber-200/80 px-3 py-1 text-xs font-medium text-amber-900 shadow', !mounted && 'opacity-0')}>
        lamp: {mounted ? lampLabels[theme ?? 'bright'] : '…'}
      </button>
      <div className="relative z-0 grid grid-cols-3 gap-8 sm:grid-cols-4 lg:grid-cols-6">{children}</div>
    </section>
  )
}
