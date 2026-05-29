'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SignInInput, SignUpInput } from '@onlydesk/shared-types'

export const useSession = () =>
  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const r = await api.auth.me()
      return r.ok ? r.data : null
    },
    retry: false,
  })

export const useSignIn = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SignInInput) => {
      const r = await api.auth.signIn(input)
      if (!r.ok) throw new Error(r.error.message)
      return r.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'me'] }),
  })
}

export const useSignUp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SignUpInput) => {
      const r = await api.auth.signUp(input)
      if (!r.ok) throw new Error(r.error.message)
      return r.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'me'] }),
  })
}

export const useSignOut = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.auth.signOut(),
    onSuccess: () => qc.clear(),
  })
}
