'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Briefcase, Cable, ChevronRight, Heart, Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react'
import type { CustomScopeDefinition } from '@onlydesk/shared-types'
import { Chip, GlassButton } from '@/components/ui/glass'
import { DynamicForm } from './dynamic-form'
import { SchemaBuilder } from './schema-builder'
import { DailyCheckin } from './daily-checkin'
import { ToolBindings } from './tool-bindings'
import { BUILTIN_SCOPES_META, getBuiltinMeta, type ScopePillar } from '@/lib/builtin-scopes'
import { useContextSchemas, useCreateRecord, useDeleteRecord, useDeleteSchema, useScopeRecords, type AnyRecordRow } from '@/hooks/use-context'
import { asApiError } from '@/lib/errors'

type DrawerView = { kind: 'index' } | { kind: 'scope'; scope: string } | { kind: 'new' } | { kind: 'bindings' }

/**
 * The Context Store — a full-height frosted drawer off the desk's right edge,
 * opened only from the dock. Three pillars (Personal / Professional / Custom),
 * a daily check-in up top, and the patch bay that wires stores into tools.
 */
export const ContextDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [view, setView] = useState<DrawerView>({ kind: 'index' })

  const headerCopy: Record<string, { title: string; sub: string }> = {
    index: { title: 'Context Store', sub: 'The memory your tools draw from' },
    new: { title: 'New custom store', sub: 'Define fields, get a store — no migrations' },
    bindings: { title: 'Tool access', sub: 'Wire stores into tools, explicitly' },
  }
  const head =
    view.kind === 'scope'
      ? { title: getBuiltinMeta(view.scope)?.name ?? view.scope, sub: 'Hydrate this store with your data' }
      : headerCopy[view.kind]!

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose} className="fixed inset-0 z-40 bg-[#0c0602]/55 backdrop-blur-[2px]" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="pane-edge fixed inset-y-0 right-0 z-50 flex w-[min(440px,100vw)] flex-col border-l border-line/[0.14] bg-[#1c1109]/85 shadow-[0_0_90px_rgba(8,4,0,0.7)] backdrop-blur-xl"
            role="dialog"
            aria-label="Context Store"
          >
            <header className="flex items-center gap-2.5 border-b border-line/[0.08] px-5 py-4">
              {view.kind !== 'index' ? (
                <GlassButton variant="ghost" size="icon" onClick={() => setView({ kind: 'index' })} aria-label="Back">
                  <ArrowLeft size={16} />
                </GlassButton>
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line/10 bg-pane/[0.07] text-accent">
                  <BookOpen size={16} strokeWidth={1.7} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-base text-ink">{head.title}</h2>
                <p className="text-[11px] italic text-ink-dim">{head.sub}</p>
              </div>
              <GlassButton variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
                <X size={16} />
              </GlassButton>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view.kind === 'scope' ? `scope:${view.scope}` : view.kind}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                >
                  {view.kind === 'index' && <IndexView onOpenScope={(scope) => setView({ kind: 'scope', scope })} onNew={() => setView({ kind: 'new' })} onBindings={() => setView({ kind: 'bindings' })} />}
                  {view.kind === 'new' && <SchemaBuilder onCreated={(key) => setView({ kind: 'scope', scope: key })} />}
                  {view.kind === 'bindings' && <ToolBindings />}
                  {view.kind === 'scope' && <ScopeView scope={view.scope} onDeleted={() => setView({ kind: 'index' })} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/* ===== Index: check-in, three pillars, patch bay ===== */

const PILLARS: { id: ScopePillar; name: string; icon: typeof Heart }[] = [
  { id: 'personal', name: 'Core Personal', icon: Heart },
  { id: 'professional', name: 'Core Professional', icon: Briefcase },
]

const IndexView = ({ onOpenScope, onNew, onBindings }: { onOpenScope: (scope: string) => void; onNew: () => void; onBindings: () => void }) => {
  const schemas = useContextSchemas()

  return (
    <div className="space-y-6">
      <DailyCheckin />

      {PILLARS.map((pillar) => (
        <section key={pillar.id} className="space-y-1">
          <p className="engraved flex items-center gap-1.5 px-1 pb-1">
            <pillar.icon size={11} /> {pillar.name}
          </p>
          {BUILTIN_SCOPES_META.filter((s) => s.pillar === pillar.id).map((s) => (
            <ScopeRow key={s.id} name={s.name} description={s.description} onClick={() => onOpenScope(s.id)} />
          ))}
        </section>
      ))}

      <section className="space-y-1">
        <div className="flex items-center justify-between px-1 pb-1">
          <p className="engraved flex items-center gap-1.5">
            <Sparkles size={11} /> Custom Stores
          </p>
          <button onClick={onNew} className="flex items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:brightness-125">
            <Plus size={12} /> Create custom store
          </button>
        </div>

        {schemas.isLoading && (
          <div className="flex justify-center py-5 text-ink-dim">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        {schemas.isError && <ErrorNote error={schemas.error} />}
        {schemas.data?.length === 0 && (
          <button onClick={onNew} className="w-full rounded-xl border border-dashed border-line/20 px-4 py-5 text-center text-xs text-ink-dim transition-colors hover:border-accent/40 hover:text-ink">
            Nothing custom yet. Book log, crypto holdings, daily mood — define it and it exists.
          </button>
        )}
        {(schemas.data ?? []).map((s: CustomScopeDefinition) => (
          <ScopeRow key={s.id} name={s.name} description={s.description ?? `${s.fields.length} field${s.fields.length === 1 ? '' : 's'}`} custom onClick={() => onOpenScope(s.key)} />
        ))}
      </section>

      <section>
        <button onClick={onBindings} className="pane-edge group flex w-full items-center gap-3 rounded-2xl border border-line/10 bg-pane/[0.05] px-4 py-3.5 text-left transition-colors hover:bg-pane/[0.08]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line/10 bg-accent/15 text-accent">
            <Cable size={15} />
          </span>
          <span className="flex-1">
            <span className="block font-display text-sm text-ink">Tool access</span>
            <span className="block text-[11px] text-ink-dim">Wire stores into your installed tools</span>
          </span>
          <ChevronRight size={14} className="text-ink-dim/60 transition-transform group-hover:translate-x-0.5" />
        </button>
      </section>
    </div>
  )
}

const ScopeRow = ({ name, description, custom, onClick }: { name: string; description: string; custom?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-line/10 hover:bg-pane/[0.06]">
    <div className="min-w-0 flex-1">
      <p className="flex items-center gap-2 text-sm text-ink">
        {name}
        {custom && <Chip>custom</Chip>}
      </p>
      <p className="truncate text-[11px] text-ink-dim">{description}</p>
    </div>
    <ChevronRight size={14} className="text-ink-dim/50 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-dim" />
  </button>
)

/* ===== Scope detail: hydration form + entries ===== */

const ScopeView = ({ scope, onDeleted }: { scope: string; onDeleted: () => void }) => {
  const builtin = getBuiltinMeta(scope)
  const schemas = useContextSchemas()
  const custom = schemas.data?.find((s) => s.key === scope)
  const records = useScopeRecords(scope)
  const createRecord = useCreateRecord(scope)
  const deleteRecord = useDeleteRecord(scope)
  const deleteSchema = useDeleteSchema()

  const fields = builtin?.fields ?? custom?.fields ?? []

  return (
    <div className="space-y-5">
      <section className="pane-edge rounded-2xl border border-line/10 bg-pane/[0.04] p-4">
        <p className="engraved mb-3">Add entry</p>
        {fields.length > 0 ? (
          <DynamicForm fields={fields} arrayFields={builtin?.arrayFields} jsonFields={builtin?.jsonFields} pending={createRecord.isPending} onSubmit={(data) => createRecord.mutateAsync(data)} />
        ) : (
          <p className="text-xs text-ink-dim">Loading schema…</p>
        )}
      </section>

      <section className="space-y-2">
        <p className="engraved px-1">Entries</p>
        {records.isLoading && (
          <div className="flex justify-center py-6 text-ink-dim">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        {records.isError && <ErrorNote error={records.error} />}
        {records.data?.length === 0 && <p className="px-1 py-3 text-center text-xs text-ink-dim/70">Nothing here yet.</p>}
        <AnimatePresence initial={false}>
          {(records.data ?? []).map((row) => (
            <RecordCard key={row.id} row={row} onDelete={() => deleteRecord.mutate(row.id)} />
          ))}
        </AnimatePresence>
      </section>

      {custom && (
        <GlassButton variant="danger" size="sm" className="w-full" disabled={deleteSchema.isPending} onClick={() => deleteSchema.mutateAsync(scope).then(onDeleted)}>
          <Trash2 size={13} /> Delete this store and its entries
        </GlassButton>
      )}
    </div>
  )
}

const HIDDEN_KEYS = new Set(['id', 'userId', 'createdAt', 'updatedAt', 'scopeKey'])

const RecordCard = ({ row, onDelete }: { row: AnyRecordRow; onDelete: () => void }) => {
  const payload = typeof row.data === 'object' && row.data !== null && !Array.isArray(row.data) ? (row.data as Record<string, unknown>) : row
  const entries = Object.entries(payload).filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== '')

  return (
    <motion.div layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="group rounded-xl border border-line/[0.08] bg-pane/[0.04] px-3.5 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <dl className="min-w-0 flex-1 space-y-0.5">
          {entries.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-xs">
              <dt className="shrink-0 font-medium text-ink-dim">{k}</dt>
              <dd className="truncate text-ink/90">{Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
            </div>
          ))}
        </dl>
        <button onClick={onDelete} aria-label="Delete entry" className="rounded-md p-1 text-ink-dim/50 opacity-0 transition-all hover:bg-clay/15 hover:text-clay-soft group-hover:opacity-100">
          <Trash2 size={13} />
        </button>
      </div>
      {typeof row.createdAt === 'string' && <p className="mt-1.5 text-[10px] text-ink-dim/60">{new Date(row.createdAt).toLocaleString()}</p>}
    </motion.div>
  )
}

const ErrorNote = ({ error }: { error: unknown }) => {
  const e = asApiError(error)
  return (
    <p className="rounded-lg border border-clay/25 bg-clay/10 px-3 py-2 text-xs text-clay-soft">
      {e.message} <span className="opacity-70">({e.code})</span>
    </p>
  )
}
