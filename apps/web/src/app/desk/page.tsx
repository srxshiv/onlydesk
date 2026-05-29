'use client'

import { useAvailableTools, useInstalledTools } from '@/hooks/use-tools'
import { DeskSurface } from '@/components/desk-surface'
import { ToolIcon } from '@/components/tool-icon'
import { InstallDrawer } from '@/components/install-drawer'

export default function DeskPage() {
  const available = useAvailableTools()
  const installed = useInstalledTools()

  const manifestById = new Map((available.data ?? []).map((m) => [m.id, m]))
  const items = (installed.data ?? []).map((i) => manifestById.get(i.toolId)).filter((m): m is NonNullable<typeof m> => Boolean(m))

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <DeskSurface>
        {items.length === 0 ? <p className="col-span-full text-center text-sm text-amber-100/70">Your desk is empty. Add a tool below to get started.</p> : items.map((m) => <ToolIcon key={m.id} manifest={m} />)}
      </DeskSurface>
      <InstallDrawer />
    </main>
  )
}
