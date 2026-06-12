import Link from 'next/link'

export default function Landing() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* Static lamp field over the default walnut finish. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-[15%] -top-[25%] h-[70vmax] w-[70vmax] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,176,84,0.24) 0%, transparent 60%)' }} />
        <div className="absolute -bottom-[30%] -right-[10%] h-[60vmax] w-[60vmax] rounded-full" style={{ background: 'radial-gradient(circle, rgba(214,108,44,0.16) 0%, transparent 62%)' }} />
        <div
          className="absolute inset-0 opacity-60"
          style={{ backgroundImage: 'repeating-linear-gradient(91deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 9px), repeating-linear-gradient(89.5deg, rgba(255,202,130,0.04) 0 2px, transparent 2px 14px)' }}
        />
      </div>

      <div className="pane-edge w-full max-w-xl rounded-3xl border border-line/10 bg-pane/[0.05] p-10 text-center shadow-[0_24px_90px_rgba(8,4,0,0.55)] backdrop-blur-xl sm:p-14">
        <p className="engraved mb-3 !tracking-[0.22em] text-accent/80">your personal productivity desk</p>
        <h1 className="font-display text-6xl tracking-tight text-ink">onlydesk</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-dim">
          A warm, well-lit desk where AI tools know you — resume editor, post writer, gym tracker — all grounded in the context of your real work and life.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/auth/sign-up"
            className="rounded-xl border border-accent/40 bg-accent/25 px-5 py-2.5 text-sm font-medium text-ink shadow-[0_4px_28px_hsl(var(--accent)/0.2)] transition-colors hover:bg-accent/35"
          >
            Get a desk
          </Link>
          <Link href="/auth/sign-in" className="rounded-xl border border-line/10 bg-pane/[0.05] px-5 py-2.5 text-sm font-medium text-ink-dim transition-colors hover:bg-pane/[0.1] hover:text-ink">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
