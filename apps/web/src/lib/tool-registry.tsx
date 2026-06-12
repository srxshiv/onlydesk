'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { Loader2 } from 'lucide-react'
import type { ToolDeskIconProps, ToolWorkspaceProps } from '@onlydesk/tool-ui-kit'

/**
 * ToolComponentRegistry — the ONLY place in apps/web that knows tool ids.
 * Each entry lazy-loads the tool package's `./ui` module (code-split per tool;
 * nothing loads until a widget or workspace actually renders). The desk engine
 * iterates installed tools and asks this registry for their surfaces.
 *
 * Adding a tool = one entry here + the package. Phase 3 replaces this map with
 * a loader fed from the DB manifest registry.
 */

export type ToolComponents = {
  DeskIcon: ComponentType<ToolDeskIconProps>
  Workspace: ComponentType<ToolWorkspaceProps>
}

const WorkspaceLoading = () => (
  <div className="flex h-full items-center justify-center text-ink-dim">
    <Loader2 size={18} className="animate-spin" />
  </div>
)

const REGISTRY: Record<string, ToolComponents> = {
  'resume-editor': {
    DeskIcon: dynamic(() => import('@onlydesk/tool-resume-editor/ui').then((m) => m.ToolDeskIcon), { ssr: false }),
    Workspace: dynamic(() => import('@onlydesk/tool-resume-editor/ui').then((m) => m.ToolWorkspace), { ssr: false, loading: WorkspaceLoading }),
  },
  'smart-todo': {
    DeskIcon: dynamic(() => import('@onlydesk/tool-smart-todo/ui').then((m) => m.ToolDeskIcon), { ssr: false }),
    Workspace: dynamic(() => import('@onlydesk/tool-smart-todo/ui').then((m) => m.ToolWorkspace), { ssr: false, loading: WorkspaceLoading }),
  },
}

export const getToolComponents = (toolId: string): ToolComponents | null => REGISTRY[toolId] ?? null
