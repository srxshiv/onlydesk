'use client'

import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Store } from 'lucide-react'
import type { ToolManifest } from '@onlydesk/shared-types'
import { GlassButton, GlassPanel } from '@/components/ui/glass'
import { Widget } from './widget'
import { useDeskStore } from '@/lib/desk-store'
import { getSpace } from '@/lib/spaces'

/**
 * The desk surface. Two layout behaviors:
 *  - grid: a bento auto-layout; reordering happens by dragging one widget over
 *    another (slots swap, layout animates).
 *  - freeform: absolute X/Y, overlap allowed, grab-to-raise — a messy desk.
 * Switching Focus Spaces crossfades the whole canvas.
 */
export const DeskCanvas = ({ manifests }: { manifests: Map<string, ToolManifest> }) => {
  const { activeSpace, layoutMode, widgets, openOverlay } = useDeskStore()
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const space = getSpace(activeSpace)
  const list = widgets[activeSpace].filter((w) => manifests.has(w.toolId))

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeSpace}
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="flex min-h-[calc(100vh-180px)] flex-col"
      >
        <header className="mb-6 px-1">
          <h1 className="font-display text-2xl tracking-tight text-ink">{space.name}</h1>
          <p className="text-sm italic text-ink-dim">{space.tagline}</p>
        </header>

        {list.length === 0 ? (
          <EmptyDesk onOpenStore={() => openOverlay('store')} />
        ) : (
          <div
            ref={canvasRef}
            className={
              layoutMode === 'grid'
                ? 'grid flex-1 auto-rows-[10.5rem] grid-cols-1 content-start gap-4 sm:grid-cols-3 xl:grid-cols-4'
                : 'relative flex-1'
            }
          >
            <AnimatePresence>
              {list.map((w) => (
                <Widget key={w.id} widget={w} manifest={manifests.get(w.toolId)!} mode={layoutMode} space={activeSpace} canvasRef={canvasRef} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

const EmptyDesk = ({ onOpenStore }: { onOpenStore: () => void }) => (
  <div className="flex flex-1 items-center justify-center">
    <GlassPanel tone="base" radius="xl" className="pane-edge flex max-w-sm flex-col items-center gap-4 px-10 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line/10 bg-pane/[0.07] text-accent">
        <Store size={20} strokeWidth={1.6} />
      </span>
      <div className="space-y-1">
        <p className="font-display text-base text-ink">The wood is bare</p>
        <p className="text-xs leading-relaxed text-ink-dim">Pick a tool from the App Store and it will land right here, under this lamp.</p>
      </div>
      <GlassButton variant="accent" onClick={onOpenStore}>
        Browse the App Store
      </GlassButton>
    </GlassPanel>
  </div>
)
