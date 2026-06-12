'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AmbientBackground } from '@/components/ambient/ambient-background'
import { DeskCanvas } from '@/components/desk/desk-canvas'
import { Dock } from '@/components/dock/dock'
import { ContextDrawer } from '@/components/drawer/context-drawer'
import { AppStore } from '@/components/overlays/app-store'
import { CommandPalette } from '@/components/overlays/command-palette'
import { WorkspaceModal } from '@/components/workspaces/workspace-modal'
import { buildLayoutPayload, useDeskStore } from '@/lib/desk-store'
import { getSpace, spaceCssVars } from '@/lib/spaces'
import { useAvailableTools, useInstalledTools } from '@/hooks/use-tools'
import { api } from '@/lib/api'

/**
 * The desk — ambient lamp field, widget canvas, floating dock, and the three
 * overlays (App Store, Context Drawer, ⌘K palette). Client-only: layout state
 * is rehydrated from localStorage, so we gate the first paint on mount.
 */
export const DeskShell = () => {
  const { activeSpace, overlay, openOverlay, closeOverlay, syncWithInstalled, applyServerLayouts } = useDeskStore()
  const available = useAvailableTools()
  const installed = useInstalledTools()
  const [mounted, setMounted] = useState(false)
  const hydratedRef = useRef(false)
  const lastSavedRef = useRef('')

  useEffect(() => setMounted(true), [])

  // Keep the widget layer consistent with the backend install registry; on the
  // first load, cloud layouts win over whatever localStorage remembered.
  useEffect(() => {
    if (!installed.data) return
    if (!hydratedRef.current) {
      applyServerLayouts(installed.data.map((t) => ({ toolId: t.toolId, layout: t.layout })))
      hydratedRef.current = true
    }
    syncWithInstalled(installed.data.map((i) => i.toolId))
    // Baseline the save-skip cache so hydration itself doesn't echo a PATCH.
    lastSavedRef.current = JSON.stringify(buildLayoutPayload(useDeskStore.getState().widgets))
  }, [installed.data, syncWithInstalled, applyServerLayouts])

  // Debounced cloud sync: any drag/resize/swap/add settles into PATCH /tools/layouts.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const unsubscribe = useDeskStore.subscribe((state, prev) => {
      if (!hydratedRef.current || state.widgets === prev.widgets) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const payload = buildLayoutPayload(useDeskStore.getState().widgets)
        const json = JSON.stringify(payload)
        if (json === lastSavedRef.current || !Object.keys(payload).length) return
        lastSavedRef.current = json
        void api.tools.updateLayouts(payload)
      }, 1200)
    })
    return () => {
      unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [])

  // Global ⌘K / Ctrl+K, and Escape to dismiss whatever overlay is up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        useDeskStore.getState().overlay === 'palette' ? closeOverlay() : openOverlay('palette')
      } else if (e.key === 'Escape') {
        closeOverlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openOverlay, closeOverlay])

  const manifests = useMemo(() => new Map((available.data ?? []).map((m) => [m.id, m])), [available.data])

  if (!mounted) return <div className="min-h-screen" />

  // The active space's palette cascades through CSS vars — wood, accent,
  // hairlines, buttons, everything re-tints together.
  return (
    <div style={spaceCssVars(getSpace(activeSpace)) as React.CSSProperties}>
      <AmbientBackground activeSpace={activeSpace} />
      <main className="mx-auto max-w-7xl px-5 pb-36 pt-10 sm:px-8">
        <DeskCanvas manifests={manifests} />
      </main>
      <Dock />
      <WorkspaceModal manifests={manifests} />
      <ContextDrawer open={overlay === 'drawer'} onClose={closeOverlay} />
      <AppStore open={overlay === 'store'} onClose={closeOverlay} />
      <CommandPalette open={overlay === 'palette'} onClose={closeOverlay} />
    </div>
  )
}
