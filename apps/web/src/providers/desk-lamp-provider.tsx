'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

/**
 * The "desk lamp" — light/dark theme reframed as a physical switch on the desk.
 * `bright` (warm-cool light), `dim` (warm dim), `off` (full dark with a soft moon-blue).
 */
export const DeskLampProvider = ({ children }: { children: ReactNode }) => (
  <ThemeProvider attribute="data-theme" defaultTheme="bright" themes={['bright', 'dim', 'off']} enableSystem={false} disableTransitionOnChange>
    {children}
  </ThemeProvider>
)
