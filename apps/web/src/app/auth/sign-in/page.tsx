'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { useSignIn } from '@/hooks/use-auth'
import { AuthError, AuthInput, AuthNotice, AuthShell, AuthSubmit } from '@/components/auth/auth-shell'

export default function SignIn() {
  const router = useRouter()
  const mut = useSignIn()
  const [form, setForm] = useState({ email: '', password: '' })
  const [notice, setNotice] = useState<string | null>(null)

  // Validate on submit, not by disabling the button — autofill and password
  // managers don't always fire onChange, so a gated button can lock users out.
  const validate = (): string | null => {
    if (!form.email.includes('@')) return 'That email doesn’t look right.'
    if (form.password.length < 8) return 'Passwords are at least 8 characters.'
    return null
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Your desk is exactly how you left it."
      footer={
        <>
          New here?{' '}
          <Link href="/auth/sign-up" className="font-medium text-accent/90 transition-colors hover:text-accent">
            Get a desk
          </Link>
        </>
      }
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const problem = validate()
          setNotice(problem)
          if (problem) return
          try {
            await mut.mutateAsync(form)
            router.push('/desk')
          } catch {
            /* surfaced via mut.error below */
          }
        }}
        className="space-y-4"
        noValidate
      >
        <AuthInput label="Email" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoFocus />
        <AuthInput label="Password" icon={Lock} reveal autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <AuthNotice message={notice} />
        <AuthError error={mut.error} mode="sign-in" />
        <AuthSubmit pending={mut.isPending}>{mut.isPending ? 'Lighting the lamps…' : 'Sign in'}</AuthSubmit>
      </form>
    </AuthShell>
  )
}
