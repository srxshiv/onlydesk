'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSignUp } from '@/hooks/use-auth'

export default function SignUp() {
  const router = useRouter()
  const mut = useSignUp()
  const [form, setForm] = useState({ email: '', name: '', password: '' })
  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="mb-6 text-2xl font-semibold">Create your desk</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await mut.mutateAsync(form)
            router.push('/desk')
          } catch {
            /* surfaced via mut.error */
          }
        }}
        className="space-y-3"
      >
        <input className="w-full rounded border px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="w-full rounded bg-amber-700 py-2 text-amber-50 disabled:opacity-50" disabled={mut.isPending}>
          {mut.isPending ? 'Creating…' : 'Create desk'}
        </button>
        {mut.error ? <p className="text-sm text-red-600">Something went wrong. Try again.</p> : null}
      </form>
    </main>
  )
}
