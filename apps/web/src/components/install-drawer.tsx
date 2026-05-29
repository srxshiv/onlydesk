'use client'

import { useAvailableTools, useInstallTool, useInstalledTools } from '@/hooks/use-tools'

export const InstallDrawer = () => {
  const available = useAvailableTools()
  const installed = useInstalledTools()
  const install = useInstallTool()

  const installedIds = new Set((installed.data ?? []).map((i) => i.toolId))
  const notInstalled = (available.data ?? []).filter((t) => !installedIds.has(t.id))

  if (!notInstalled.length) return null

  return (
    <aside className="mt-8 rounded-lg border border-amber-200/20 bg-amber-950/30 p-4">
      <h2 className="mb-3 text-sm font-medium text-amber-100">Add to your desk</h2>
      <ul className="flex flex-wrap gap-3">
        {notInstalled.map((t) => (
          <li key={t.id}>
            <button onClick={() => install.mutate(t.id)} disabled={install.isPending} className="rounded bg-amber-700 px-3 py-1.5 text-xs text-amber-50 hover:bg-amber-800 disabled:opacity-50">
              + {t.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
