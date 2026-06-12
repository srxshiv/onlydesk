'use client'

import { memo, useRef } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { ArrowUpRight, Dumbbell, Frame, Lamp, NotebookPen, Package, PenLine } from 'lucide-react'
import type { ToolManifest } from '@onlydesk/shared-types'
import { cn } from '@/lib/cn'
import { Chip } from '@/components/ui/glass'
import { useDeskStore, type DeskWidget, type LayoutMode, type WidgetSize } from '@/lib/desk-store'
import type { SpaceId } from '@/lib/spaces'
import { getToolComponents } from '@/lib/tool-registry'

/** Freeform pixel dimensions per size. */
export const SIZE_DIMS: Record<WidgetSize, { w: number; h: number }> = {
  sm: { w: 240, h: 170 },
  md: { w: 360, h: 220 },
  lg: { w: 480, h: 320 },
}

/** Bento spans per size (grid mode). */
const SIZE_SPANS: Record<WidgetSize, string> = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-1 row-span-1 sm:col-span-2',
  lg: 'col-span-1 row-span-2 sm:col-span-2',
}

const DESK_OBJECT_ICONS: Record<string, typeof Package> = {
  notebook: NotebookPen,
  lamp: Lamp,
  frame: Frame,
  pen: PenLine,
  dumbbell: Dumbbell,
}

/** Manifest icon colors are palette names; resolve to warm, desk-friendly hexes. */
const ACCENT_HEX: Record<string, string> = {
  amber: '#cca35e',
  violet: '#b08fc9',
  rose: '#d98a73',
  teal: '#8fb5a0',
  sky: '#8aa8bd',
  emerald: '#9cb578',
  orange: '#d6885c',
}

type WidgetProps = {
  widget: DeskWidget
  manifest: ToolManifest
  mode: LayoutMode
  space: SpaceId
  /** Freeform drag bounds. */
  canvasRef: React.RefObject<HTMLDivElement | null>
}

export const Widget = memo(function Widget({ widget, manifest, mode, space, canvasRef }: WidgetProps) {
  const { setWidgetSize, moveWidget, bringToFront, swapWidgets, expandTool, expandedTool } = useDeskStore()
  // Freeform drag deltas live in motion values; the committed position lives in
  // the store as left/top. On release we fold the delta into the store and zero
  // the motion values, so drags never compound.
  const dx = useMotionValue(0)
  const dy = useMotionValue(0)
  const selfRef = useRef<HTMLDivElement | null>(null)

  const accent = ACCENT_HEX[manifest.icon.color] ?? '#a1a1aa'
  const Icon = DESK_OBJECT_ICONS[manifest.icon.deskObject] ?? Package
  const isFreeform = mode === 'freeform'
  const dims = SIZE_DIMS[widget.size]

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number }; offset: { x: number; y: number } }) => {
    if (isFreeform) {
      const bounds = canvasRef.current?.getBoundingClientRect()
      const maxX = bounds ? Math.max(0, bounds.width - dims.w) : Infinity
      const maxY = bounds ? Math.max(0, bounds.height - dims.h) : Infinity
      const x = Math.min(Math.max(0, widget.x + info.offset.x), maxX)
      const y = Math.min(Math.max(0, widget.y + info.offset.y), maxY)
      moveWidget(space, widget.id, x, y)
      dx.set(0)
      dy.set(0)
      return
    }
    // Grid mode: hit-test the drop point for a sibling widget and swap slots.
    const clientX = info.point.x - window.scrollX
    const clientY = info.point.y - window.scrollY
    const target = document
      .elementsFromPoint(clientX, clientY)
      .map((el) => (el instanceof HTMLElement ? el.closest<HTMLElement>('[data-widget-id]') : null))
      .find((el): el is HTMLElement => Boolean(el && el.dataset.widgetId !== widget.id))
    if (target?.dataset.widgetId) swapWidgets(space, widget.id, target.dataset.widgetId)
  }

  // While expanded into the Workspace View the card cedes its layoutId to the
  // modal (the morph target) and leaves a same-size ghost so the grid holds.
  if (expandedTool === widget.toolId) {
    return isFreeform ? (
      <div style={{ position: 'absolute', left: widget.x, top: widget.y, width: dims.w, height: dims.h }} />
    ) : (
      <div className={SIZE_SPANS[widget.size]} />
    )
  }

  return (
    <motion.div
      ref={selfRef}
      data-widget-id={widget.id}
      layoutId={`widget-${widget.id}`}
      onDoubleClick={() => expandTool(widget.toolId)}
      layout={!isFreeform}
      drag
      dragMomentum={false}
      dragElastic={isFreeform ? 0 : 0.12}
      dragSnapToOrigin={!isFreeform}
      onDragStart={() => isFreeform && bringToFront(space, widget.id)}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.04, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', zIndex: 60 }}
      whileHover={{ scale: 1.005 }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={cn(
        'group pane-edge relative flex cursor-grab flex-col overflow-hidden rounded-2xl border border-line/10 bg-pane/[0.055] backdrop-blur-xl active:cursor-grabbing',
        !isFreeform && SIZE_SPANS[widget.size],
      )}
      style={
        isFreeform
          ? { position: 'absolute', left: widget.x, top: widget.y, width: dims.w, height: dims.h, zIndex: widget.z, x: dx, y: dy }
          : undefined
      }
    >
      {/* Accent spine — the tool's wax-seal color, visible at every size */}
      <span aria-hidden className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full" style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}66` }} />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/10" style={{ backgroundColor: `${accent}1f`, color: accent }}>
          <Icon size={15} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] text-ink">{manifest.name}</p>
          {widget.size !== 'sm' && <p className="truncate text-[11px] text-ink-dim/80">v{manifest.version}</p>}
        </div>
        <SizeSwitcher size={widget.size} onChange={(s) => setWidgetSize(space, widget.id, s)} />
        <button
          onClick={() => expandTool(widget.toolId)}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="rounded-lg p-1.5 text-ink-dim opacity-0 transition-opacity hover:bg-pane/[0.12] hover:text-ink group-hover:opacity-100"
          aria-label={`Open ${manifest.name} workspace`}
        >
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Body — the tool's own DeskIcon surface, dynamically loaded from its
          package via the registry; generic fallback for tools without UI. */}
      <div className="min-h-0 flex-1 px-3.5 py-2.5">
        {(() => {
          const components = getToolComponents(manifest.id)
          if (components && widget.size !== 'sm') return <components.DeskIcon manifest={manifest} size={widget.size} />
          return (
            <>
              {widget.size !== 'sm' && <p className={cn('text-xs leading-relaxed text-ink-dim', widget.size === 'md' ? 'line-clamp-2' : 'line-clamp-4')}>{manifest.description}</p>}
            </>
          )
        })()}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 px-3.5 pb-3">
        <Chip>{manifest.category}</Chip>
        {widget.size !== 'sm' && <Chip>{manifest.actions.length} action{manifest.actions.length === 1 ? '' : 's'}</Chip>}
      </div>
    </motion.div>
  )
})

const SIZE_LABELS: { id: WidgetSize; label: string }[] = [
  { id: 'sm', label: 'S' },
  { id: 'md', label: 'M' },
  { id: 'lg', label: 'L' },
]

const SizeSwitcher = ({ size, onChange }: { size: WidgetSize; onChange: (s: WidgetSize) => void }) => (
  <div
    className="flex items-center gap-0.5 rounded-lg border border-line/10 bg-[#1c1109]/70 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
    onPointerDownCapture={(e) => e.stopPropagation()}
  >
    {SIZE_LABELS.map((s) => (
      <button
        key={s.id}
        onClick={() => onChange(s.id)}
        className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors', size === s.id ? 'bg-accent/30 text-ink' : 'text-ink-dim/70 hover:text-ink-dim')}
        aria-label={`Resize to ${s.label}`}
      >
        {s.label}
      </button>
    ))}
  </div>
)
