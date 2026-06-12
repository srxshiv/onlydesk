'use client'

import Link from 'next/link'
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { asApiError } from '@/lib/errors'

/**
 * Auth surfaces — the first glass the user ever touches, so it must feel like
 * the desk: dark room, two warm lamps, one floating frosted card.
 */

export const AuthShell = ({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) => (
  <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
    {/* Static lamp field — the live, animated lamps wait on the desk itself. */}
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -left-[18%] -top-[28%] h-[75vmax] w-[75vmax] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,176,84,0.22) 0%, transparent 60%)' }} />
      <div className="absolute -bottom-[32%] -right-[12%] h-[65vmax] w-[65vmax] rounded-full" style={{ background: 'radial-gradient(circle, rgba(214,108,44,0.16) 0%, transparent 62%)' }} />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="pane-edge w-full max-w-md rounded-3xl border border-line/10 bg-pane/[0.055] p-8 shadow-[0_24px_90px_rgba(8,4,0,0.55)] backdrop-blur-xl sm:p-10"
    >
      <Link href="/" className="mb-8 inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-accent/80 transition-colors hover:text-accent">
        onlydesk
      </Link>
      <h1 className="font-display text-3xl tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-sm italic text-ink-dim">{subtitle}</p>

      <div className="mt-8">{children}</div>

      <p className="mt-7 text-center text-xs text-ink-dim">{footer}</p>
    </motion.div>
  </main>
)

/* ===== Inputs ===== */

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: LucideIcon
  /** Renders a show/hide toggle and switches type between password/text. */
  reveal?: boolean
  hint?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(({ label, icon: Icon, reveal, hint, className, type, ...props }, ref) => {
  const [shown, setShown] = useState(false)
  return (
    <label className="block">
      <span className="engraved mb-1.5 block">{label}</span>
      <div className="group relative">
        <Icon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim transition-colors group-focus-within:text-accent" />
        <input
          ref={ref}
          type={reveal ? (shown ? 'text' : 'password') : type}
          className={cn(
            'h-11 w-full rounded-xl border border-line/10 bg-pane/[0.05] pl-10 pr-3 text-sm text-ink placeholder:text-ink-dim/50 outline-none backdrop-blur-md transition-all',
            'focus:border-accent/50 focus:bg-pane/[0.08] focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.08),0_4px_24px_hsl(var(--accent)/0.1)]',
            reveal && 'pr-11',
            className,
          )}
          {...props}
        />
        {reveal && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-pane/[0.08] hover:text-ink"
          >
            {shown ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && <span className="mt-1.5 block text-[11px] text-ink-dim/70">{hint}</span>}
    </label>
  )
})
AuthInput.displayName = 'AuthInput'

/* ===== Submit + error ===== */

export const AuthSubmit = ({ pending, children, disabled }: { pending: boolean; children: ReactNode; disabled?: boolean }) => (
  <motion.button
    type="submit"
    whileTap={{ scale: 0.985 }}
    disabled={pending || disabled}
    className="pane-edge flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/25 text-sm font-medium text-ink shadow-[0_4px_28px_hsl(var(--accent)/0.2)] transition-colors hover:bg-accent/35 disabled:pointer-events-none disabled:opacity-40"
  >
    {pending ? <Loader2 size={15} className="animate-spin" /> : null}
    {children}
  </motion.button>
)

/** Inline notice for client-side validation messages (same dress as AuthError). */
export const AuthNotice = ({ message }: { message: string | null }) => {
  if (!message) return null
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-2.5 text-xs leading-relaxed text-ink/90">
      {message}
    </motion.p>
  )
}

/** Maps the typed error contract to copy a human wants to read at a login form. */
export const AuthError = ({ error, mode }: { error: unknown; mode: 'sign-in' | 'sign-up' }) => {
  if (!error) return null
  const e = asApiError(error)
  let message: string
  if (mode === 'sign-in' && (e.code === 'UNAUTHENTICATED' || e.code === 'FORBIDDEN' || e.code === 'NOT_FOUND')) {
    message = 'That email and password don’t match.'
  } else if (mode === 'sign-up' && e.code === 'CONFLICT') {
    message = 'That email already has a desk — sign in instead.'
  } else if (e.code === 'VALIDATION_FAILED') {
    message = e.violations.length ? e.violations.map((v) => v.message).join(' · ') : e.message
  } else if (e.code === 'UPSTREAM_ERROR' || e.code === 'INTERNAL') {
    message = 'The desk is unreachable right now. Try again in a moment.'
  } else {
    message = e.message
  }
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded-xl border border-clay/25 bg-clay/10 px-3.5 py-2.5 text-xs leading-relaxed text-clay-soft">
      {message}
    </motion.p>
  )
}
