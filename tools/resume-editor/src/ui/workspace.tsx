'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Download, FileCode2, FileText, GitCompareArrows, Loader2, Lock, Sparkles } from 'lucide-react'
import type { TailorResumeOutput } from '../handlers/tailor-resume'
import { asApiError, cn, Chip, Field, GlassButton, GlassInput, GlassTextarea, useInvocation, useInvokeAction, tokenizeLatex, parseLatexPreview, type ToolWorkspaceProps } from '@onlydesk/tool-ui-kit'

type RightTab = 'diff' | 'latex' | 'preview'

const FILENAME_KEY = 'onlydesk:resume:filename'

/**
 * Resume Editor workspace (tool-owned, loaded dynamically by the harness) —
 * split pane. Left: the JD and the Output Profile.
 * Right: JD Delta diff / syntax-highlighted LaTeX / paper preview. Progress
 * streams in live while the queued Gemini job runs.
 */
export const ToolWorkspace = (_props: ToolWorkspaceProps) => {
  const invoke = useInvokeAction()
  const [jd, setJd] = useState('')
  const [filename, setFilename] = useState('resume.pdf')
  const [invocationId, setInvocationId] = useState<string | null>(null)
  const [tab, setTab] = useState<RightTab>('diff')
  const invocation = useInvocation(invocationId)

  // Output Profile — the locked filename survives sessions.
  useEffect(() => {
    const saved = localStorage.getItem(FILENAME_KEY)
    if (saved) setFilename(saved)
  }, [])
  const lockFilename = (v: string) => {
    setFilename(v)
    localStorage.setItem(FILENAME_KEY, v)
  }

  const running = invocation.data?.status === 'pending' || invocation.data?.status === 'running'
  const output = invocation.data?.status === 'succeeded' ? (invocation.data.output as TailorResumeOutput | null) : null

  const tailor = async () => {
    if (!jd.trim()) return
    const inv = await invoke.mutateAsync({ toolId: 'resume-editor', actionId: 'tailor-resume', input: { jobDescription: jd, filename } })
    setInvocationId(inv.id)
    setTab('diff')
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5 sm:p-6 lg:flex-row lg:overflow-hidden">
      {/* ===== Left: JD + Output Profile ===== */}
      <div className="flex shrink-0 flex-col gap-4 lg:w-[38%] lg:overflow-y-auto lg:pr-1">
        <Field label="Job description">
          <GlassTextarea value={jd} onChange={(e) => setJd(e.target.value)} rows={12} placeholder="Paste the full job description here…" className="min-h-[220px] font-mono text-xs leading-relaxed" />
        </Field>

        <section className="pane-edge rounded-2xl border border-line/10 bg-pane/[0.04] p-4">
          <p className="engraved mb-2 flex items-center gap-1.5">
            <Lock size={11} /> Output Profile
          </p>
          <GlassInput value={filename} onChange={(e) => lockFilename(e.target.value)} placeholder="resume.pdf" />
          <p className="mt-1.5 text-[11px] text-ink-dim/70">Every export reuses exactly this name — your downloads folder stays clean.</p>
        </section>

        <GlassButton variant="accent" size="lg" onClick={tailor} disabled={running || invoke.isPending || !jd.trim()}>
          {running || invoke.isPending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {running ? 'Tailoring…' : 'Tailor resume to this JD'}
        </GlassButton>
        {invoke.isError && <p className="rounded-lg border border-clay/25 bg-clay/10 px-3 py-2 text-xs text-clay-soft">{asApiError(invoke.error).message}</p>}

        {/* Live progress timeline */}
        {invocation.data && (
          <section className="rounded-2xl border border-line/[0.08] bg-pane/[0.03] p-4">
            <p className="engraved mb-2">Run log</p>
            <ol className="space-y-1.5">
              {invocation.data.progress.map((p, i) => (
                <motion.li key={`${p.at}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 text-xs text-ink-dim">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                  {p.message}
                </motion.li>
              ))}
              {running && (
                <li className="flex items-center gap-2 text-xs text-ink-dim/70">
                  <Loader2 size={11} className="animate-spin" /> working…
                </li>
              )}
              {invocation.data.status === 'failed' && <li className="text-xs text-clay-soft">Failed: {invocation.data.error}</li>}
              {output && (
                <li className="flex items-center gap-2 text-xs text-moss-soft">
                  <Check size={12} /> Done via {output.engine}
                </li>
              )}
            </ol>
          </section>
        )}
      </div>

      {/* ===== Right: Diff / LaTeX / Preview ===== */}
      <div className="flex min-h-[420px] flex-1 flex-col rounded-2xl border border-line/10 bg-pane/[0.03]">
        <div className="flex items-center gap-1 border-b border-line/[0.08] px-3 py-2">
          <TabButton active={tab === 'diff'} onClick={() => setTab('diff')} icon={<GitCompareArrows size={13} />} label="JD Delta" />
          <TabButton active={tab === 'latex'} onClick={() => setTab('latex')} icon={<FileCode2 size={13} />} label="LaTeX" />
          <TabButton active={tab === 'preview'} onClick={() => setTab('preview')} icon={<FileText size={13} />} label="Preview" />
          {output && <span className="ml-auto"><Chip>{output.engine}</Chip></span>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!output ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="max-w-xs text-sm italic text-ink-dim/70">{running ? 'The lamp is on — your resume is being tailored…' : 'Paste a JD and tailor. The diff, LaTeX, and preview land here.'}</p>
            </div>
          ) : tab === 'diff' ? (
            <DiffView output={output} />
          ) : tab === 'latex' ? (
            <LatexView latex={output.latex} filename={output.filename} />
          ) : (
            <PaperPreview latex={output.latex} />
          )}
        </div>
      </div>
    </div>
  )
}

const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button onClick={onClick} className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors', active ? 'bg-accent/20 text-ink' : 'text-ink-dim hover:bg-pane/[0.07] hover:text-ink')}>
    {icon}
    {label}
  </button>
)

/* ===== JD Delta — what was rewritten and why ===== */

const DiffView = ({ output }: { output: TailorResumeOutput }) => (
  <div className="space-y-4">
    {output.missingKeywords.length > 0 && (
      <section className="rounded-xl border border-line/[0.08] bg-pane/[0.04] p-3.5">
        <p className="engraved mb-2">Missing from your profile</p>
        <div className="flex flex-wrap gap-1.5">
          {output.missingKeywords.map((k) => (
            <Chip key={k} className="border-clay/30 text-clay-soft">{k}</Chip>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-dim/70">The JD asks for these; your context can't honestly claim them, so they were not invented.</p>
      </section>
    )}

    {output.changes.length === 0 ? (
      <p className="py-8 text-center text-sm italic text-ink-dim/70">No bullets needed rewriting — your context already speaks this JD's language.</p>
    ) : (
      <AnimatePresence>
        {output.changes.map((c, i) => (
          <motion.section key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-line/[0.08] bg-pane/[0.04] p-3.5">
            <p className="engraved mb-2">{c.section}</p>
            <p className="text-xs leading-relaxed text-clay-soft/90 line-through decoration-clay/60">{c.before}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-moss-soft">{c.after}</p>
            <p className="mt-2 border-t border-line/[0.06] pt-2 text-[11px] italic text-ink-dim">{c.reason}</p>
          </motion.section>
        ))}
      </AnimatePresence>
    )}
  </div>
)

/* ===== LaTeX with highlight, copy, locked-name download ===== */

const TOKEN_CLASS: Record<string, string> = {
  command: 'text-accent',
  brace: 'text-ink-dim/60',
  comment: 'italic text-ink-dim/50',
  math: 'text-moss-soft',
  text: 'text-ink/85',
}

const LatexView = ({ latex, filename }: { latex: string; filename: string }) => {
  const [copied, setCopied] = useState(false)
  const tokens = useMemo(() => tokenizeLatex(latex), [latex])
  const texName = filename.replace(/\.(pdf|tex)$/i, '') + '.tex'

  const copy = async () => {
    await navigator.clipboard.writeText(latex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const download = () => {
    const blob = new Blob([latex], { type: 'text/x-tex' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = texName
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <GlassButton size="sm" onClick={copy}>
          {copied ? <Check size={13} className="text-moss-soft" /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </GlassButton>
        <GlassButton size="sm" onClick={download}>
          <Download size={13} /> {texName}
        </GlassButton>
      </div>
      <pre className="min-h-0 flex-1 overflow-auto rounded-xl border border-line/[0.08] bg-[#140c06]/80 p-4 text-[11.5px] leading-relaxed">
        <code>
          {tokens.map((t, i) => (
            <span key={i} className={TOKEN_CLASS[t.type]}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

/* ===== Paper preview — a typeset approximation on cream stock ===== */

const PaperPreview = ({ latex }: { latex: string }) => {
  const doc = useMemo(() => parseLatexPreview(latex), [latex])
  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-2 text-center text-[10px] uppercase tracking-wider text-ink-dim/60">Typeset approximation — compile in Overleaf for the true PDF</p>
      <div className="rounded-md bg-[#f3ead9] px-10 py-12 text-[#2a1c10] shadow-[0_18px_60px_rgba(8,4,0,0.6)]">
        {doc.title && <h1 className="mb-6 text-center font-display text-2xl font-bold">{doc.title}</h1>}
        {doc.sections.map((s, i) => (
          <section key={i} className="mb-5">
            <h2 className="mb-1.5 border-b border-[#2a1c10]/25 pb-0.5 font-display text-sm font-bold uppercase tracking-wide">{s.heading}</h2>
            {s.paragraphs.map((p, j) => (
              <p key={j} className="mb-1.5 text-[12.5px] leading-relaxed">{p}</p>
            ))}
            {s.items.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-[12.5px] leading-relaxed">
                {s.items.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
