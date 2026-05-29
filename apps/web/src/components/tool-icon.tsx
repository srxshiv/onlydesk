'use client'

import Link from 'next/link'
import type { ToolManifest } from '@onlydesk/shared-types'

export const ToolIcon = ({ manifest }: { manifest: ToolManifest }) => (
  <Link href={`/desk/${manifest.id}`} className="group flex flex-col items-center gap-2">
    <div className={`h-20 w-16 rounded-sm bg-amber-700 shadow-lg ring-1 ring-amber-900/60 transition-transform group-hover:-translate-y-1`} />
    <span className="text-xs text-amber-100/80">{manifest.name}</span>
  </Link>
)
