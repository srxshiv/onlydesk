'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Lock, Mail, User } from 'lucide-react'
import { useSignUp } from '@/hooks/use-auth'
import { AuthError, AuthInput, AuthNotice, AuthShell, AuthSubmit } from '@/components/auth/auth-shell'

export default function SignUp() {
  const router = useRouter()
  const mut = useSignUp()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [notice, setNotice] = useState<string | null>(null)

  // Validate on submit, not by disabling the button — autofill and password
  // managers don't always fire onChange, so a gated button can lock users out.
  const validate = (): string | null => {
    if (form.name.trim().length < 2) return 'Tell the desk your name (at least 2 characters).'
    if (!form.email.includes('@')) return 'That email doesn’t look right.'
    if (form.password.length < 8) return 'Password needs at least 8 characters.'
    return null
  }

  return (
    <AuthShell
      title="Get a desk"
      subtitle="A quiet, well-lit place where your tools know you."
      footer={
        <>
          Already have one?{' '}
          <Link href="/auth/sign-in" className="font-medium text-accent/90 transition-colors hover:text-accent">
            Sign in
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
            await mut.mutateAsync({ ...form, name: form.name.trim() })
            router.push('/desk')
          } catch {
            /* surfaced via mut.error below */
          }
        }}
        className="space-y-4"
        noValidate
      >
        <AuthInput label="Name" icon={User} autoComplete="name" placeholder="What should the desk call you?" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
        <AuthInput label="Email" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <AuthInput
          label="Password"
          icon={Lock}
          reveal
          autoComplete="new-password"
          placeholder="••••••••"
          hint="At least 8 characters."
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <AuthNotice message={notice} />
        <AuthError error={mut.error} mode="sign-up" />
        <AuthSubmit pending={mut.isPending}>{mut.isPending ? 'Building your desk…' : 'Create my desk'}</AuthSubmit>
      </form>
    </AuthShell>
  )
}
