'use client'

import { motion } from 'framer-motion'
import { FOCUS_SPACES, type SpaceId } from '@/lib/spaces'

/**
 * The desk itself — layered wood with plank striations and grain, a soft
 * vignette, and three pools of lamplight per Focus Space. Wood tones come from
 * CSS vars (set by DeskShell per space) so they crossfade with everything else;
 * lamp layers crossfade by opacity and drift on transform keyframes — GPU-only,
 * steady 60fps.
 */
export const AmbientBackground = ({ activeSpace }: { activeSpace: SpaceId }) => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    {/* Wood plane (colors transition via CSS vars) */}
    <div
      className="absolute inset-0 transition-[background] duration-1000"
      style={{ background: 'linear-gradient(178deg, var(--wood-hi) 0%, var(--wood-mid) 34%, var(--wood-deep) 100%)' }}
    />

    {/* Plank striations — two interleaved frequencies read as grain, not stripes */}
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          'repeating-linear-gradient(91deg, rgba(0,0,0,0.20) 0 1px, transparent 1px 9px), repeating-linear-gradient(89.5deg, rgba(255,202,130,0.045) 0 2px, transparent 2px 14px), repeating-linear-gradient(90.5deg, rgba(0,0,0,0.10) 0 3px, transparent 3px 41px)',
      }}
    />

    {/* Lamp pools, per space, crossfaded */}
    {FOCUS_SPACES.map((space) => (
      <motion.div
        key={space.id}
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: space.id === activeSpace ? 1 : 0 }}
        transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.div
          className="absolute -left-[20%] -top-[30%] h-[80vmax] w-[80vmax] rounded-full will-change-transform"
          style={{ background: `radial-gradient(circle, ${space.glows[0]} 0%, transparent 60%)` }}
          animate={{ x: [0, 60, -30, 0], y: [0, 40, 80, 0] }}
          transition={{ duration: 38, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-[35%] -right-[15%] h-[70vmax] w-[70vmax] rounded-full will-change-transform"
          style={{ background: `radial-gradient(circle, ${space.glows[1]} 0%, transparent 62%)` }}
          animate={{ x: [0, -80, 40, 0], y: [0, -50, -20, 0] }}
          transition={{ duration: 46, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-[30%] top-[20%] h-[50vmax] w-[50vmax] rounded-full will-change-transform"
          style={{ background: `radial-gradient(circle, ${space.glows[2]} 0%, transparent 65%)` }}
          animate={{ x: [0, 120, -60, 0], y: [0, -80, 60, 0] }}
          transition={{ duration: 54, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    ))}

    {/* Grain — keeps the panes from feeling synthetic */}
    <div
      className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
      style={{
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")',
      }}
    />

    {/* Vignette — the room is dark beyond the lamplight */}
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 32%, transparent 42%, rgba(6,3,0,0.6) 100%)' }} />
  </div>
)
