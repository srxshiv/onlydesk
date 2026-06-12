/**
 * Focus Spaces — distinct desks with their own wood finish, accent metal, and
 * lamp glows. Each space writes its palette into CSS variables (see DeskShell),
 * so every pane, button, and hairline in the app re-tints together. That is the
 * customization system: one palette, total consistency.
 */

export type SpaceId = 'professional' | 'personal' | 'zen'

export type FocusSpace = {
  id: SpaceId
  name: string
  tagline: string
  /** Accent as an HSL triplet for the --accent CSS var (composable alpha). */
  accentHsl: string
  /** Accent as hex for inline glows, dots, shadows. */
  accent: string
  /** Wood finish, dark → light. */
  wood: { deep: string; mid: string; hi: string }
  /** Three lamp pools: [key light, counter glow, drift]. */
  glows: [string, string, string]
}

export const FOCUS_SPACES: readonly FocusSpace[] = [
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Walnut, brass, and deep work',
    accentHsl: '38 52% 58%',
    accent: '#cca35e',
    wood: { deep: '#170e07', mid: '#271709', hi: '#3d240e' },
    glows: ['rgba(255,176,84,0.30)', 'rgba(214,108,44,0.20)', 'rgba(255,214,150,0.10)'],
  },
  {
    id: 'personal',
    name: 'Personal',
    tagline: 'Rosewood, copper, slow evenings',
    accentHsl: '12 58% 62%',
    accent: '#d98a73',
    wood: { deep: '#190c0a', mid: '#2b1410', hi: '#421f16' },
    glows: ['rgba(255,138,108,0.26)', 'rgba(196,98,160,0.16)', 'rgba(255,190,160,0.10)'],
  },
  {
    id: 'zen',
    name: 'Zen',
    tagline: 'Smoked oak, moss, still air',
    accentHsl: '95 28% 58%',
    accent: '#9cb578',
    wood: { deep: '#100e08', mid: '#1d1a0e', hi: '#2e2914' },
    glows: ['rgba(186,214,128,0.20)', 'rgba(255,196,96,0.14)', 'rgba(214,232,180,0.08)'],
  },
] as const

export const getSpace = (id: SpaceId): FocusSpace => FOCUS_SPACES.find((s) => s.id === id) ?? FOCUS_SPACES[0]!

/** CSS variables a space contributes; spread onto a wrapper's style. */
export const spaceCssVars = (s: FocusSpace): Record<string, string> => ({
  '--accent': s.accentHsl,
  '--wood-deep': s.wood.deep,
  '--wood-mid': s.wood.mid,
  '--wood-hi': s.wood.hi,
})
