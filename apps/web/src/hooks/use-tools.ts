'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

const unwrap = async <T>(p: Promise<{ ok: true; data: T } | { ok: false; error: { message: string } }>): Promise<T> => {
  const r = await p
  if (!r.ok) throw new Error(r.error.message)
  return r.data
}

export const useAvailableTools = () => useQuery({ queryKey: ['tools', 'available'], queryFn: () => unwrap(api.tools.listAvailable()) })

export const useInstalledTools = () => useQuery({ queryKey: ['tools', 'installed'], queryFn: () => unwrap(api.tools.listInstalled()) })

export const useInstallTool = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (toolId: string) => unwrap(api.tools.install(toolId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tools', 'installed'] }),
  })
}

export const useUninstallTool = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (toolId: string) => unwrap(api.tools.uninstall(toolId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tools', 'installed'] }),
  })
}
