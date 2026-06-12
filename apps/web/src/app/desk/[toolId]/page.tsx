'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAvailableTools } from '@/hooks/use-tools'
import { getToolComponents } from '@/lib/tool-registry'

/** Deep-linkable workspace page — same registry surfaces the desk modal uses. */
export default function ToolWorkspacePage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = use(params)
  const available = useAvailableTools()
  const manifest = (available.data ?? []).find((m) => m.id === toolId)
  const components = getToolComponents(toolId)

  return (
    <main className="mx-auto flex h-screen max-w-6xl flex-col px-6 py-6">
      <Link href="/desk" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-dim transition-colors hover:text-ink">
        <ArrowLeft size={13} /> Back to desk
      </Link>
      {!manifest ? (
        <p className="text-sm text-ink-dim">Tool not found.</p>
      ) : !components ? (
        <p className="text-sm text-ink-dim">No workspace registered for {toolId}.</p>
      ) : (
        <div className="pane-edge flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-line/10 bg-pane/[0.04] backdrop-blur-xl">
          <header className="border-b border-line/[0.08] px-6 py-4">
            <h1 className="font-display text-xl text-ink">{manifest.name}</h1>
            <p className="text-sm text-ink-dim">{manifest.description}</p>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden">
            <components.Workspace manifest={manifest} />
          </div>
        </div>
      )}
    </main>
  )
}
