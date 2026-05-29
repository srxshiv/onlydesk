import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { QueryProvider } from '@/providers/query-provider'
import { DeskLampProvider } from '@/providers/desk-lamp-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'onlydesk',
  description: 'Your personal productivity desk.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DeskLampProvider>
          <QueryProvider>{children}</QueryProvider>
        </DeskLampProvider>
      </body>
    </html>
  )
}
