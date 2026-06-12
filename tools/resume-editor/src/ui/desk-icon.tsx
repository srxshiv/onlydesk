'use client'

import { GitCompareArrows, Sparkles } from 'lucide-react'
import { Chip, cn, type ToolDeskIconProps } from '@onlydesk/tool-ui-kit'

/**
 * The desk-widget surface for the Resume Editor — a quiet invitation: what it
 * does, what it runs, and a nudge to expand into the workspace.
 */
export const ToolDeskIcon = ({ manifest, size }: ToolDeskIconProps) => (
  <div className="flex h-full flex-col">
    {size !== 'sm' && <p className={cn('text-xs leading-relaxed text-ink-dim', size === 'md' ? 'line-clamp-2' : 'line-clamp-3')}>{manifest.description}</p>}
    {size === 'lg' && (
      <div className="mt-3 space-y-1.5">
        {manifest.actions.slice(0, 3).map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-line/[0.07] bg-pane/[0.04] px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 truncate text-xs text-ink/90">
              <Sparkles size={11} className="shrink-0 text-accent/80" />
              {a.name}
            </span>
            <Chip>{a.execution}</Chip>
          </div>
        ))}
        <p className="flex items-center gap-1.5 pt-1 text-[10px] italic text-ink-dim/70">
          <GitCompareArrows size={10} /> Double-click to open the tailor bench
        </p>
      </div>
    )}
  </div>
)
