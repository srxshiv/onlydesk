'use client'

import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn'

/**
 * Primitives of the "desk at night" material system: frosted panes on warm
 * wood, brass hairlines, paper ink. Every color is a semantic token
 * (ink/line/pane/accent), so Focus Spaces re-tint the whole set at once.
 */

const panelVariants = cva('border backdrop-blur-xl', {
  variants: {
    tone: {
      base: 'border-line/10 bg-pane/[0.055] shadow-[0_12px_44px_rgba(12,6,0,0.45)]',
      raised: 'border-line/[0.14] bg-pane/[0.085] shadow-[0_18px_56px_rgba(12,6,0,0.55)]',
      overlay: 'border-line/[0.14] bg-[#1c1109]/85 shadow-[0_28px_90px_rgba(8,4,0,0.7)]',
    },
    radius: {
      md: 'rounded-xl',
      lg: 'rounded-2xl',
      xl: 'rounded-3xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: { tone: 'base', radius: 'lg' },
})

export type GlassPanelProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof panelVariants>

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(({ className, tone, radius, ...props }, ref) => (
  <div ref={ref} className={cn(panelVariants({ tone, radius }), className)} {...props} />
))
GlassPanel.displayName = 'GlassPanel'

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        glass: 'border border-line/10 bg-pane/[0.07] text-ink backdrop-blur-md hover:bg-pane/[0.13]',
        ghost: 'text-ink-dim hover:bg-pane/[0.09] hover:text-ink',
        accent: 'border border-accent/40 bg-accent/20 text-ink shadow-[0_4px_24px_hsl(var(--accent)/0.18)] hover:bg-accent/30',
        danger: 'border border-clay/30 bg-clay/15 text-clay-soft hover:bg-clay/25',
      },
      size: {
        sm: 'h-7 rounded-lg px-2.5 text-xs',
        md: 'h-9 rounded-xl px-3.5 text-sm',
        lg: 'h-11 rounded-2xl px-5 text-sm',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: { variant: 'glass', size: 'md' },
  },
)

export type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(({ className, variant, size, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
))
GlassButton.displayName = 'GlassButton'

const fieldClasses =
  'w-full rounded-xl border border-line/10 bg-pane/[0.05] px-3 py-2 text-sm text-ink placeholder:text-ink-dim/50 outline-none backdrop-blur-md transition-colors focus:border-accent/50 focus:bg-pane/[0.08]'

export const GlassInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClasses, className)} {...props} />
))
GlassInput.displayName = 'GlassInput'

export const GlassTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClasses, 'min-h-[80px] resize-y', className)} {...props} />
))
GlassTextarea.displayName = 'GlassTextarea'

export const GlassSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClasses, 'appearance-none [&>option]:bg-[#241509] [&>option]:text-ink', className)} {...props}>
    {children}
  </select>
))
GlassSelect.displayName = 'GlassSelect'

/** Tiny stamped chip — permission scopes, categories, statuses. */
export const Chip = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('inline-flex items-center rounded-full border border-line/10 bg-pane/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-dim', className)} {...props} />
)

/** Form field wrapper with the engraved-label treatment. */
export const Field = ({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) => (
  <label className={cn('block space-y-1.5', className)}>
    <span className="engraved block">{label}</span>
    {children}
    {hint ? <span className="block text-[11px] text-ink-dim/70">{hint}</span> : null}
  </label>
)
