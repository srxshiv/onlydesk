'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Command, Database, Download, LayoutGrid, Move, Search, Store } from 'lucide-react'
import type { ToolManifest } from '@onlydesk/shared-types'
import { cn } from '@/lib/cn'
import { useDeskStore } from '@/lib/desk-store'
import { FOCUS_SPACES } from '@/lib/spaces'
import { useAvailableTools, useInstallTool, useInstalledTools } from '@/hooks/use-tools'

type PaletteAction = {
  id: string
  group: 'Navigate' | 'Spaces' | 'Desk' | 'Tools' | 'Install'
  label: string
  hint?: string
  icon: React.ReactNode
  run: () => void
}

/**
 * ⌘K omni-bar — fuzzy-ish filtering over navigation, space switching, desk
 * actions, installed tool workspaces, and one-keystroke installs.
 */
export const CommandPalette = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const router = useRouter()
  const { activeSpace, layoutMode, setSpace, toggleLayoutMode, openOverlay, addWidget } = useDeskStore()
  const available = useAvailableTools()
  const installed = useInstalledTools()
  const install = useInstallTool()

  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const installedIds = useMemo(() => new Set((installed.data ?? []).map((i) => i.toolId)), [installed.data])

  const actions = useMemo<PaletteAction[]>(() => {
    const list: PaletteAction[] = [
      { id: 'open-store', group: 'Navigate', label: 'Open App Store', icon: <Store size={15} />, run: () => openOverlay('store') },
      { id: 'open-context', group: 'Navigate', label: 'Open Context Store', icon: <Database size={15} />, run: () => openOverlay('drawer') },
      {
        id: 'toggle-layout',
        group: 'Desk',
        label: layoutMode === 'grid' ? 'Switch to freeform layout' : 'Snap to grid layout',
        icon: layoutMode === 'grid' ? <Move size={15} /> : <LayoutGrid size={15} />,
        run: () => {
          toggleLayoutMode()
          onClose()
        },
      },
    ]
    for (const s of FOCUS_SPACES) {
      if (s.id === activeSpace) continue
      list.push({
        id: `space-${s.id}`,
        group: 'Spaces',
        label: `Go to ${s.name}`,
        hint: s.tagline,
        icon: <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.accent }} />,
        run: () => {
          setSpace(s.id)
          onClose()
        },
      })
    }
    for (const m of (available.data ?? []) as ToolManifest[]) {
      if (installedIds.has(m.id)) {
        list.push({
          id: `open-${m.id}`,
          group: 'Tools',
          label: `Open ${m.name}`,
          hint: m.description,
          icon: <ArrowUpRight size={15} />,
          run: () => {
            router.push(`/desk/${m.id}`)
            onClose()
          },
        })
      } else {
        list.push({
          id: `install-${m.id}`,
          group: 'Install',
          label: `Install ${m.name}`,
          hint: m.category,
          icon: <Download size={15} />,
          run: () => {
            void install.mutateAsync(m.id).then(() => addWidget(activeSpace, m.id))
            onClose()
          },
        })
      }
    }
    return list
  }, [activeSpace, layoutMode, available.data, installedIds, openOverlay, setSpace, toggleLayoutMode, router, install, addWidget, onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter((a) => a.label.toLowerCase().includes(q) || a.hint?.toLowerCase().includes(q) || a.group.toLowerCase().includes(q))
  }, [actions, query])

  // Reset + focus on open.
  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setCursor(0), [query])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[cursor]?.run()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  let lastGroup: string | null = null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[18vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={onClose} className="absolute inset-0 bg-[#0c0602]/55 backdrop-blur-[3px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pane-edge relative w-full max-w-lg overflow-hidden rounded-2xl border border-line/[0.14] bg-[#1c1109]/90 shadow-[0_28px_110px_rgba(8,4,0,0.7)] backdrop-blur-xl"
            role="dialog"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-line/[0.08] px-4 py-3">
              <Search size={16} className="shrink-0 text-accent" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search actions, tools, spaces…"
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-dim/50 outline-none"
                aria-label="Command search"
              />
              <kbd className="flex items-center gap-0.5 rounded-md border border-line/10 bg-pane/[0.06] px-1.5 py-0.5 text-[10px] text-ink-dim">
                <Command size={9} /> K
              </kbd>
            </div>

            <div className="max-h-[46vh] overflow-y-auto p-1.5">
              {filtered.length === 0 && <p className="px-3 py-8 text-center text-sm text-ink-dim/70">Nothing matches “{query}”.</p>}
              {filtered.map((a, i) => {
                const showGroup = a.group !== lastGroup
                lastGroup = a.group
                return (
                  <div key={a.id}>
                    {showGroup && <p className="px-3 pb-1 pt-2.5 engraved !text-[10px]">{a.group}</p>}
                    <button
                      onClick={a.run}
                      onMouseEnter={() => setCursor(i)}
                      className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors', i === cursor ? 'bg-accent/20 text-ink' : 'text-ink/85')}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-ink-dim">{a.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{a.label}</span>
                        {a.hint && <span className="block truncate text-[11px] text-ink-dim/80">{a.hint}</span>}
                      </span>
                      {i === cursor && <kbd className="text-[10px] text-ink-dim/70">↵</kbd>}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
