'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ToolLayout } from '@onlydesk/shared-types'
import type { SpaceId } from './spaces'

export type WidgetSize = 'sm' | 'md' | 'lg'
export type LayoutMode = 'grid' | 'freeform'

export type DeskWidget = {
  /** Stable widget id (one widget per tool per space, so `${space}:${toolId}`). */
  id: string
  toolId: string
  size: WidgetSize
  /** Freeform-mode position, px relative to the canvas. */
  x: number
  y: number
  /** Freeform stacking order — bumped on grab so the held widget surfaces. */
  z: number
}

export type OverlayId = 'store' | 'drawer' | 'palette' | null

type DeskState = {
  activeSpace: SpaceId
  layoutMode: LayoutMode
  widgets: Record<SpaceId, DeskWidget[]>
  nextZ: number
  /** Transient overlay state — never persisted. */
  overlay: OverlayId
  /** Tool currently expanded into its Workspace View (layoutId morph). */
  expandedTool: string | null

  setSpace: (space: SpaceId) => void
  setLayoutMode: (mode: LayoutMode) => void
  toggleLayoutMode: () => void
  openOverlay: (overlay: Exclude<OverlayId, null>) => void
  closeOverlay: () => void
  expandTool: (toolId: string) => void
  collapseTool: () => void

  addWidget: (space: SpaceId, toolId: string) => void
  removeWidgetsForTool: (toolId: string) => void
  setWidgetSize: (space: SpaceId, id: string, size: WidgetSize) => void
  moveWidget: (space: SpaceId, id: string, x: number, y: number) => void
  bringToFront: (space: SpaceId, id: string) => void
  swapWidgets: (space: SpaceId, idA: string, idB: string) => void
  /** Ensure every installed tool has a widget somewhere; prune uninstalled. */
  syncWithInstalled: (toolIds: string[]) => void
  /** Hydrate placements from the server (cloud layout wins over localStorage). */
  applyServerLayouts: (entries: { toolId: string; layout: ToolLayout | null }[]) => void
}

const EMPTY: Record<SpaceId, DeskWidget[]> = { professional: [], personal: [], zen: [] }

/** Scatter freshly placed widgets so freeform mode doesn't stack them at 0,0. */
const spawnPosition = (index: number) => ({ x: 48 + (index % 4) * 360, y: 48 + Math.floor(index / 4) * 240 })

export const useDeskStore = create<DeskState>()(
  persist(
    (set) => ({
      activeSpace: 'professional',
      layoutMode: 'grid',
      widgets: EMPTY,
      nextZ: 1,
      overlay: null,
      expandedTool: null,

      setSpace: (space) => set({ activeSpace: space, expandedTool: null }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      toggleLayoutMode: () => set((s) => ({ layoutMode: s.layoutMode === 'grid' ? 'freeform' : 'grid' })),
      openOverlay: (overlay) => set({ overlay }),
      closeOverlay: () => set({ overlay: null, expandedTool: null }),
      expandTool: (toolId) => set({ expandedTool: toolId, overlay: null }),
      collapseTool: () => set({ expandedTool: null }),

      addWidget: (space, toolId) =>
        set((s) => {
          const list = s.widgets[space]
          if (list.some((w) => w.toolId === toolId)) return s
          const pos = spawnPosition(list.length)
          const widget: DeskWidget = { id: `${space}:${toolId}`, toolId, size: 'md', x: pos.x, y: pos.y, z: s.nextZ }
          return { widgets: { ...s.widgets, [space]: [...list, widget] }, nextZ: s.nextZ + 1 }
        }),

      removeWidgetsForTool: (toolId) =>
        set((s) => ({
          widgets: Object.fromEntries(Object.entries(s.widgets).map(([space, list]) => [space, list.filter((w) => w.toolId !== toolId)])) as Record<SpaceId, DeskWidget[]>,
        })),

      setWidgetSize: (space, id, size) =>
        set((s) => ({ widgets: { ...s.widgets, [space]: s.widgets[space].map((w) => (w.id === id ? { ...w, size } : w)) } })),

      moveWidget: (space, id, x, y) =>
        set((s) => ({ widgets: { ...s.widgets, [space]: s.widgets[space].map((w) => (w.id === id ? { ...w, x, y } : w)) } })),

      bringToFront: (space, id) =>
        set((s) => ({
          widgets: { ...s.widgets, [space]: s.widgets[space].map((w) => (w.id === id ? { ...w, z: s.nextZ } : w)) },
          nextZ: s.nextZ + 1,
        })),

      swapWidgets: (space, idA, idB) =>
        set((s) => {
          const list = [...s.widgets[space]]
          const a = list.findIndex((w) => w.id === idA)
          const b = list.findIndex((w) => w.id === idB)
          if (a < 0 || b < 0 || a === b) return s
          const wa = list[a]!
          list[a] = list[b]!
          list[b] = wa
          return { widgets: { ...s.widgets, [space]: list } }
        }),

      applyServerLayouts: (entries) =>
        set((s) => {
          const spaces = Object.keys(s.widgets) as SpaceId[]
          const bySpace: Record<SpaceId, DeskWidget[]> = { professional: [], personal: [], zen: [] }
          const placed = new Set<string>()
          const fromServer: { space: SpaceId; order: number; w: DeskWidget }[] = []
          for (const { toolId, layout } of entries) {
            if (!layout) continue
            const space = (spaces as string[]).includes(layout.space) ? (layout.space as SpaceId) : s.activeSpace
            placed.add(toolId)
            fromServer.push({ space, order: layout.order, w: { id: `${space}:${toolId}`, toolId, size: layout.size, x: layout.x, y: layout.y, z: layout.z } })
          }
          fromServer.sort((a, b) => a.order - b.order).forEach((p) => bySpace[p.space].push(p.w))
          // Tools the server hasn't seen arranged yet keep their local placement.
          for (const space of spaces) {
            for (const w of s.widgets[space]) {
              if (!placed.has(w.toolId)) bySpace[space].push(w)
            }
          }
          const nextZ = Math.max(s.nextZ, ...fromServer.map((p) => p.w.z + 1), 1)
          return { widgets: bySpace, nextZ }
        }),

      syncWithInstalled: (toolIds) =>
        set((s) => {
          const installed = new Set(toolIds)
          const placed = new Set(Object.values(s.widgets).flatMap((list) => list.map((w) => w.toolId)))
          let next = s.widgets
          let nextZ = s.nextZ
          // Prune widgets for tools that are no longer installed.
          if (Object.values(next).some((list) => list.some((w) => !installed.has(w.toolId)))) {
            next = Object.fromEntries(Object.entries(next).map(([space, list]) => [space, list.filter((w) => installed.has(w.toolId))])) as Record<SpaceId, DeskWidget[]>
          }
          // Adopt installed tools that have no widget anywhere onto the active space.
          const orphans = toolIds.filter((id) => !placed.has(id))
          if (orphans.length) {
            const list = [...next[s.activeSpace]]
            for (const toolId of orphans) {
              const pos = spawnPosition(list.length)
              list.push({ id: `${s.activeSpace}:${toolId}`, toolId, size: 'md', x: pos.x, y: pos.y, z: nextZ++ })
            }
            next = { ...next, [s.activeSpace]: list }
          }
          return next === s.widgets ? s : { widgets: next, nextZ }
        }),
    }),
    {
      name: 'onlydesk:desk',
      partialize: (s) => ({ activeSpace: s.activeSpace, layoutMode: s.layoutMode, widgets: s.widgets, nextZ: s.nextZ }),
    },
  ),
)

/** Serialize the current desk into the PATCH /tools/layouts payload. */
export const buildLayoutPayload = (widgets: Record<SpaceId, DeskWidget[]>): Record<string, ToolLayout> => {
  const out: Record<string, ToolLayout> = {}
  for (const [space, list] of Object.entries(widgets) as [SpaceId, DeskWidget[]][]) {
    list.forEach((w, order) => {
      out[w.toolId] = { space, size: w.size, x: w.x, y: w.y, z: w.z, order }
    })
  }
  return out
}
