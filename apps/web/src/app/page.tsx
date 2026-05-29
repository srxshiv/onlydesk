import Link from 'next/link'

export default function Landing() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <div className="space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight">onlydesk</h1>
        <p className="text-lg text-neutral-600">
          A personal productivity home. Install AI-powered tools onto a virtual wooden desk — resume editor, post writer, gym tracker, todos — all grounded in the context of your real
          work and life.
        </p>
        <div className="flex gap-3">
          <Link href="/auth/sign-up" className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-800">
            Get a desk
          </Link>
          <Link href="/auth/sign-in" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-200">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
