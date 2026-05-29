'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'
import { useAvailableTools } from '@/hooks/use-tools'

const Workspaces = {
  'resume-editor': dynamic(() => import('@onlydesk/tool-resume-editor/surfaces/workspace').then((m) => m.default), { ssr: false }),
} as const

export default function ToolWorkspace({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = use(params)
  const available = useAvailableTools()
  const manifest = (available.data ?? []).find((m) => m.id === toolId)
  if (!manifest) return <main className="p-10 text-sm">Tool not found.</main>
  const Surface = Workspaces[toolId as keyof typeof Workspaces]
  if (!Surface) return <main className="p-10 text-sm">No workspace registered for {toolId}.</main>
  return <Surface />
}
