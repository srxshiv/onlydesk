'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cable, Loader2 } from 'lucide-react'
import type { InstalledTool, ToolManifest } from '@onlydesk/shared-types'
import { cn } from '@/lib/cn'
import { useAvailableTools, useInstalledTools, useUpdateGrants } from '@/hooks/use-tools'
import { useContextSchemas } from '@/hooks/use-context'
import { BUILTIN_SCOPES_META } from '@/lib/builtin-scopes'
import { asApiError } from '@/lib/errors'

/**
 * Tool access — the patch bay. Every installed tool exposes a row of sockets,
 * one per context store (built-in and custom). Click to plug or unplug a store
 * from a tool; the grant list persists to the backend, and the runtime refuses
 * any read the user hasn't wired up here.
 */
export const ToolBindings = () => {
  const installed = useInstalledTools()
  const available = useAvailableTools()
  const schemas = useContextSchemas()

  const manifests = new Map((available.data ?? []).map((m) => [m.id, m]))
  const tools = (installed.data ?? []).filter((t) => manifests.has(t.toolId))

  const scopes: { key: string; name: string; custom: boolean }[] = [
    ...BUILTIN_SCOPES_META.map((s) => ({ key: s.id, name: s.name, custom: false })),
    ...(schemas.data ?? []).map((s) => ({ key: s.key, name: s.name, custom: true })),
  ]

  if (installed.isLoading) {
    return (
      <div className="flex justify-center py-8 text-ink-dim">
        <Loader2 size={16} className="animate-spin" />
      </div>
    )
  }

  if (!tools.length) {
    return <p className="rounded-xl border border-dashed border-line/20 px-4 py-6 text-center text-xs text-ink-dim">Nothing to wire yet — install a tool from the App Store first.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-relaxed text-ink-dim">
        Plug context stores into tools. A tool can only read what you have wired to it here — even if its manifest asks for more.
      </p>
      {tools.map((tool) => (
        <ToolRow key={tool.toolId} tool={tool} manifest={manifests.get(tool.toolId)!} scopes={scopes} />
      ))}
    </div>
  )
}

const ToolRow = ({ tool, manifest, scopes }: { tool: InstalledTool; manifest: ToolManifest; scopes: { key: string; name: string; custom: boolean }[] }) => {
  const update = useUpdateGrants()
  const [error, setError] = useState<string | null>(null)
  const granted = new Set(tool.contextGrants ?? [])
  // The manifest's declared scopes — shown as "requested" so the user knows
  // what the tool was built to use.
  const requested = new Set<string>(manifest.contextScopes)

  const toggle = async (key: string) => {
    setError(null)
    const next = granted.has(key) ? (tool.contextGrants ?? []).filter((g) => g !== key) : [...(tool.contextGrants ?? []), key]
    try {
      await update.mutateAsync({ toolId: tool.toolId, grants: next })
    } catch (e) {
      setError(asApiError(e).message)
    }
  }

  return (
    <motion.section layout className="pane-edge rounded-2xl border border-line/10 bg-pane/[0.04] p-3.5">
      <header className="mb-2.5 flex items-center gap-2">
        <Cable size={13} className="text-accent" />
        <h4 className="font-display text-sm text-ink">{manifest.name}</h4>
        <span className="ml-auto text-[10px] text-ink-dim">
          {granted.size} of {scopes.length} wired
        </span>
      </header>
      <div className="flex flex-wrap gap-1.5">
        {scopes.map((s) => {
          const on = granted.has(s.key)
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              disabled={update.isPending}
              title={requested.has(s.key) ? `${s.name} — requested by this tool's manifest` : s.name}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] transition-all disabled:opacity-50',
                on
                  ? 'border-accent/50 bg-accent/20 text-ink shadow-[0_0_12px_hsl(var(--accent)/0.2)]'
                  : 'border-line/[0.12] bg-transparent text-ink-dim/80 hover:border-line/25 hover:text-ink-dim',
                s.custom && 'italic',
              )}
            >
              {on ? '● ' : '○ '}
              {s.name}
              {requested.has(s.key) && !on && <span className="ml-1 text-accent/70">*</span>}
            </button>
          )
        })}
      </div>
      {error && <p className="mt-2 text-[11px] text-clay-soft">{error}</p>}
    </motion.section>
  )
}
