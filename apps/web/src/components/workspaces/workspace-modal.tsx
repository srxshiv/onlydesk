'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Plug, X } from 'lucide-react'
import type { ToolManifest } from '@onlydesk/shared-types'
import { Chip, GlassButton } from '@/components/ui/glass'
import { useDeskStore } from '@/lib/desk-store'
import { getSpace } from '@/lib/spaces'
import { useInstalledTools } from '@/hooks/use-tools'
import { getToolComponents } from '@/lib/tool-registry'

/**
 * The Workspace View — a desk widget expanded into a large pane. The morph is
 * a Framer Motion layoutId handshake with the widget card (the widget hides
 * while expanded, this pane takes over its layoutId, and the card appears to
 * grow out of the desk).
 */
export const WorkspaceModal = ({ manifests }: { manifests: Map<string, ToolManifest> }) => {
  const { activeSpace, expandedTool, collapseTool } = useDeskStore()
  const installed = useInstalledTools()
  const manifest = expandedTool ? manifests.get(expandedTool) : undefined
  const space = getSpace(activeSpace)
  const grants = (installed.data ?? []).find((t) => t.toolId === expandedTool)?.contextGrants ?? []

  return (
    <AnimatePresence>
      {expandedTool && manifest && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={collapseTool} className="fixed inset-0 z-40 bg-[#0c0602]/60 backdrop-blur-[3px]" />
          <motion.div
            layoutId={`widget-${activeSpace}:${expandedTool}`}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="pane-edge fixed inset-x-3 inset-y-3 z-50 flex flex-col overflow-hidden rounded-3xl border border-line/[0.14] bg-[#1c1109]/92 shadow-[0_36px_140px_rgba(8,4,0,0.75)] backdrop-blur-xl sm:inset-x-[5%] sm:inset-y-[4%]"
            role="dialog"
            aria-label={`${manifest.name} workspace`}
          >
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line/[0.08] px-5 py-3.5 sm:px-6">
              <h2 className="font-display text-lg text-ink">{manifest.name}</h2>
              {/* Context Scope Lock — exactly what this tool is drinking from */}
              <span className="flex flex-wrap items-center gap-1.5 rounded-full border border-line/10 bg-pane/[0.05] px-2.5 py-1">
                <Plug size={11} className="text-accent" />
                <span className="text-[10px] uppercase tracking-wider text-ink-dim">Connected to: {space.name}</span>
                <span className="text-ink-dim/50">→</span>
                {grants.length ? grants.map((g) => <Chip key={g}>{g}</Chip>) : <span className="text-[10px] italic text-ink-dim/70">nothing wired</span>}
              </span>
              <GlassButton variant="ghost" size="icon" onClick={collapseTool} aria-label="Close workspace" className="ml-auto">
                <X size={16} />
              </GlassButton>
            </header>

            <div className="min-h-0 flex-1 overflow-hidden">
              {(() => {
                const components = getToolComponents(expandedTool)
                if (!components) return <p className="p-8 text-sm text-ink-dim">No workspace built for {manifest.name} yet.</p>
                return <components.Workspace manifest={manifest} />
              })()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
