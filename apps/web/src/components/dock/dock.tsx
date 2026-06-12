'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Command, Database, LayoutGrid, Move, Store } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useDeskStore } from '@/lib/desk-store'
import { FOCUS_SPACES, getSpace } from '@/lib/spaces'

/**
 * The dock — a small wooden tray at the bottom edge of the desk holding brass
 * instruments: App Store, Context Store, the glowing Command seal, the Focus
 * Space switcher, and the layout toggle.
 */
export const Dock = () => {
  const { activeSpace, layoutMode, overlay, openOverlay, toggleLayoutMode, setSpace } = useDeskStore()
  const [spacesOpen, setSpacesOpen] = useState(false)
  const space = getSpace(activeSpace)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center">
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.15 }}
        className="pane-edge pointer-events-auto flex items-center gap-1 rounded-full border border-line/[0.14] px-2.5 py-2 shadow-[0_18px_60px_rgba(8,4,0,0.65)] backdrop-blur-xl"
        style={{ background: 'linear-gradient(180deg, rgba(61,36,14,0.82), rgba(23,14,7,0.92))' }}
      >
        <DockIcon label="App Store" active={overlay === 'store'} onClick={() => openOverlay('store')}>
          <Store size={18} strokeWidth={1.7} />
        </DockIcon>

        <DockIcon label="Context Store" active={overlay === 'drawer'} onClick={() => openOverlay('drawer')}>
          <Database size={18} strokeWidth={1.7} />
        </DockIcon>

        {/* Center: the Command seal */}
        <motion.button
          whileHover={{ scale: 1.12, y: -4 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => openOverlay('palette')}
          aria-label="Open command palette (⌘K)"
          className="pane-edge mx-1 flex h-12 w-12 items-center justify-center rounded-full border text-ink shadow-[0_8px_32px_rgba(8,4,0,0.5)]"
          style={{ borderColor: `${space.accent}66`, background: `radial-gradient(circle at 35% 30%, ${space.accent}55, ${space.accent}1a 70%)` }}
        >
          <Command size={19} strokeWidth={1.8} />
        </motion.button>

        {/* Focus Space switcher */}
        <div className="relative">
          <AnimatePresence>
            {spacesOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="pane-edge absolute bottom-full left-1/2 mb-3 w-52 -translate-x-1/2 rounded-2xl border border-line/[0.14] bg-[#1c1109]/90 p-1.5 shadow-[0_18px_60px_rgba(8,4,0,0.65)] backdrop-blur-xl"
              >
                {FOCUS_SPACES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSpace(s.id)
                      setSpacesOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors',
                      s.id === activeSpace ? 'bg-pane/[0.12] text-ink' : 'text-ink-dim hover:bg-pane/[0.07] hover:text-ink',
                    )}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.accent, boxShadow: `0 0 10px ${s.accent}88` }} />
                    <span className="flex-1">
                      <span className="block font-display text-sm leading-tight">{s.name}</span>
                      <span className="block text-[10px] italic text-ink-dim/80">{s.tagline}</span>
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <DockIcon label="Focus Spaces" active={spacesOpen} onClick={() => setSpacesOpen((v) => !v)}>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-line/30" style={{ backgroundColor: space.accent, boxShadow: `0 0 12px ${space.accent}99` }} />
          </DockIcon>
        </div>

        <DockIcon label={layoutMode === 'grid' ? 'Switch to freeform' : 'Snap to grid'} onClick={toggleLayoutMode}>
          {layoutMode === 'grid' ? <Move size={18} strokeWidth={1.7} /> : <LayoutGrid size={18} strokeWidth={1.7} />}
        </DockIcon>
      </motion.nav>
    </div>
  )
}

const DockIcon = ({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) => (
  <motion.button
    whileHover={{ scale: 1.15, y: -3 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    aria-label={label}
    title={label}
    className={cn(
      'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
      active ? 'bg-accent/25 text-ink' : 'text-ink-dim hover:bg-pane/[0.1] hover:text-ink',
    )}
  >
    {children}
  </motion.button>
)
