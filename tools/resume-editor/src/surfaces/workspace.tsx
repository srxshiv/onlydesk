import type { FC } from 'react'

export const Workspace: FC = () => (
  <section className="flex h-full flex-col gap-4 p-8">
    <header>
      <h1 className="text-2xl font-semibold">Resume Editor</h1>
      <p className="text-sm text-muted-foreground">Pick a job target and tailor a LaTeX resume grounded in your context store.</p>
    </header>
    <div className="rounded border border-dashed p-6 text-sm text-muted-foreground">
      Phase-1 placeholder. Wire up the job-target picker, the tailor-resume invocation, and the Overleaf-bound output here.
    </div>
  </section>
)

export default Workspace
