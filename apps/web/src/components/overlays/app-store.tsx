'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Download, Eye, Loader2, Store, Trash2, X } from 'lucide-react'
import type { ToolManifest } from '@onlydesk/shared-types'
import { Chip, GlassButton } from '@/components/ui/glass'
import { useAvailableTools, useInstallTool, useInstalledTools, useUninstallTool } from '@/hooks/use-tools'
import { useDeskStore } from '@/lib/desk-store'
import { asApiError } from '@/lib/errors'

/**
 * App Store — browse the tool_manifests registry, install onto the active
 * Focus Space. Install writes to the backend then mounts the widget instantly.
 */
export const AppStore = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const available = useAvailableTools()
  const installed = useInstalledTools()
  const installedIds = new Set((installed.data ?? []).map((i) => i.toolId))

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} className="absolute inset-0 bg-[#0c0602]/55 backdrop-blur-[3px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="pane-edge relative flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-line/[0.14] bg-[#1c1109]/85 shadow-[0_28px_110px_rgba(8,4,0,0.7)] backdrop-blur-xl"
            role="dialog"
            aria-label="App Store"
          >
            <header className="flex items-center gap-3 border-b border-line/[0.08] px-6 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line/10 bg-pane/[0.07] text-accent">
                <Store size={16} strokeWidth={1.7} />
              </span>
              <div className="flex-1">
                <h2 className="font-display text-base text-ink">App Store</h2>
                <p className="text-[11px] italic text-ink-dim">Tools install onto your current Focus Space</p>
              </div>
              <GlassButton variant="ghost" size="icon" onClick={onClose} aria-label="Close App Store">
                <X size={16} />
              </GlassButton>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {available.isLoading && (
                <div className="flex justify-center py-16 text-ink-dim">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              )}
              {available.isError && (
                <p className="rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay-soft">
                  Couldn’t reach the registry — {asApiError(available.error).message}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {(available.data ?? []).map((m) => (
                  <ToolCard key={m.id} manifest={m} installed={installedIds.has(m.id)} />
                ))}
              </div>
              {available.data?.length === 0 && <p className="py-16 text-center text-sm text-ink-dim">The registry is empty.</p>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const ACCENT_HEX: Record<string, string> = { amber: '#cca35e', violet: '#b08fc9', rose: '#d98a73', teal: '#8fb5a0', sky: '#8aa8bd', emerald: '#9cb578', orange: '#d6885c' }

const ToolCard = ({ manifest, installed }: { manifest: ToolManifest; installed: boolean }) => {
  const install = useInstallTool()
  const uninstall = useUninstallTool()
  const { activeSpace, addWidget, removeWidgetsForTool } = useDeskStore()
  const accent = ACCENT_HEX[manifest.icon.color] ?? '#cca35e'

  const onInstall = async () => {
    await install.mutateAsync(manifest.id)
    // Mount instantly on the active Focus Space.
    addWidget(activeSpace, manifest.id)
  }

  const onUninstall = async () => {
    await uninstall.mutateAsync(manifest.id)
    removeWidgetsForTool(manifest.id)
  }

  return (
    <motion.article layout className="pane-edge flex flex-col gap-3 rounded-2xl border border-line/10 bg-pane/[0.05] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line/10 font-display text-base" style={{ backgroundColor: `${accent}22`, color: accent }}>
          {manifest.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[15px] text-ink">{manifest.name}</h3>
          <p className="text-[11px] text-ink-dim">
            v{manifest.version} · {manifest.category}
          </p>
        </div>
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-ink-dim">{manifest.description}</p>

      {/* Permission disclosure — which context scopes this tool reads */}
      {manifest.permissions.read.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <Eye size={11} className="text-ink-dim/60" />
          {manifest.permissions.read.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2">
        {installed ? (
          <>
            <span className="flex items-center gap-1.5 text-xs font-medium text-moss-soft">
              <Check size={13} /> On your desk
            </span>
            <GlassButton variant="ghost" size="sm" className="ml-auto text-ink-dim hover:text-clay-soft" onClick={onUninstall} disabled={uninstall.isPending} aria-label={`Uninstall ${manifest.name}`}>
              {uninstall.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </GlassButton>
          </>
        ) : (
          <GlassButton variant="accent" size="sm" className="w-full" onClick={onInstall} disabled={install.isPending}>
            {install.isPending ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Install
          </GlassButton>
        )}
      </div>
      {(install.isError || uninstall.isError) && <p className="text-[11px] text-clay-soft">{asApiError(install.error ?? uninstall.error).message}</p>}
    </motion.article>
  )
}
