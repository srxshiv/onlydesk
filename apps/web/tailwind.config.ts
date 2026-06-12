import type { Config } from 'tailwindcss'

const config: Config = {
  // Scan the app, every tool package's UI, and the shared kit — tool surfaces
  // live outside apps/web now, and unscanned class names would silently vanish.
  content: ['./src/**/*.{ts,tsx}', '../../tools/**/src/ui/**/*.{ts,tsx}', '../../packages/tool-ui-kit/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — all routed through CSS vars so Focus Spaces re-tint everything.
        ink: 'hsl(var(--ink) / <alpha-value>)',
        'ink-dim': 'hsl(var(--ink-dim) / <alpha-value>)',
        line: 'hsl(var(--line) / <alpha-value>)',
        pane: 'hsl(var(--pane) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        // Fixed warm status colors (clay / moss) — consistent across spaces.
        clay: { DEFAULT: '#d97a5f', soft: '#eda287' },
        moss: { DEFAULT: '#9bb167', soft: '#bdcd96' },
      },
      fontFamily: {
        // Bookish serif for display — ships with the OS, zero network cost.
        display: ['"Iowan Old Style"', '"Palatino Linotype"', 'Palatino', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
