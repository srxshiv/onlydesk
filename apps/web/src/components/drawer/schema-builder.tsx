'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { CustomFieldDef, CustomFieldType } from '@onlydesk/shared-types'
import { Field, GlassButton, GlassInput, GlassSelect } from '@/components/ui/glass'
import { useCreateSchema } from '@/hooks/use-context'
import { asApiError } from '@/lib/errors'

const FIELD_TYPES: { id: CustomFieldType; label: string }[] = [
  { id: 'string', label: 'Text' },
  { id: 'text', label: 'Long text' },
  { id: 'number', label: 'Number' },
  { id: 'boolean', label: 'Yes / No' },
  { id: 'date', label: 'Date' },
  { id: 'enum', label: 'Choice' },
]

type DraftField = { name: string; type: CustomFieldType; required: boolean; options: string }

/** One-tap starting points — the user renames/extends freely before creating. */
const TEMPLATES: { name: string; description: string; fields: DraftField[] }[] = [
  {
    name: 'Profile',
    description: 'The basics about me',
    fields: [
      { name: 'Name', type: 'string', required: true, options: '' },
      { name: 'Age', type: 'number', required: false, options: '' },
      { name: 'Weight kg', type: 'number', required: false, options: '' },
      { name: 'Height cm', type: 'number', required: false, options: '' },
    ],
  },
  {
    name: 'Book Log',
    description: 'What I read and what I thought',
    fields: [
      { name: 'Title', type: 'string', required: true, options: '' },
      { name: 'Author', type: 'string', required: false, options: '' },
      { name: 'Finished', type: 'date', required: false, options: '' },
      { name: 'Rating', type: 'enum', required: false, options: '1, 2, 3, 4, 5' },
      { name: 'Notes', type: 'text', required: false, options: '' },
    ],
  },
  {
    name: 'Crypto Holdings',
    description: 'Positions I am tracking',
    fields: [
      { name: 'Asset', type: 'string', required: true, options: '' },
      { name: 'Amount', type: 'number', required: true, options: '' },
      { name: 'Bought at', type: 'date', required: false, options: '' },
      { name: 'Cold storage', type: 'boolean', required: false, options: '' },
    ],
  },
]

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, '_$1')
    .slice(0, 63)

/**
 * Visual schema builder for a new Custom Context Store — name it, define
 * fields and types, and it exists in Postgres JSONB the moment you hit create.
 * Every later write is validated server-side against exactly this definition.
 */
export const SchemaBuilder = ({ onCreated }: { onCreated: (key: string) => void }) => {
  const create = useCreateSchema()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<DraftField[]>([{ name: '', type: 'string', required: false, options: '' }])
  const [error, setError] = useState<string | null>(null)

  const key = slugify(name)

  const updateField = (i: number, patch: Partial<DraftField>) => setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))

  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    setName(t.name)
    setDescription(t.description)
    setFields(t.fields.map((f) => ({ ...f })))
    setError(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const defs: CustomFieldDef[] = []
    for (const f of fields) {
      const fieldName = slugify(f.name)
      if (!fieldName) continue
      defs.push({
        name: fieldName,
        label: f.name.trim(),
        type: f.type,
        required: f.required,
        ...(f.type === 'enum' ? { options: f.options.split(',').map((o) => o.trim()).filter(Boolean) } : {}),
      })
    }

    if (!key) return setError('Give your store a name.')
    if (!defs.length) return setError('Define at least one field.')
    if (defs.some((d) => d.type === 'enum' && !(d.options ?? []).length)) return setError('Choice fields need at least one option (comma separated).')

    try {
      const created = await create.mutateAsync({ key, name: name.trim(), description: description.trim() || undefined, fields: defs })
      onCreated(created.key)
    } catch (err) {
      const apiErr = asApiError(err)
      setError(apiErr.violations.length ? apiErr.violations.map((v) => `${v.field}: ${v.message}`).join(' · ') : apiErr.message)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Starting points */}
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATES.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => applyTemplate(t)}
            className="rounded-full border border-line/[0.12] px-2.5 py-1 text-[11px] text-ink-dim transition-colors hover:border-accent/40 hover:text-ink"
          >
            {t.name}
          </button>
        ))}
      </div>

      <Field label="Store name" hint={key ? `Stored as “${key}”` : undefined}>
        <GlassInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Daily Mood" autoFocus />
      </Field>

      <Field label="Description">
        <GlassInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="How I felt each day" />
      </Field>

      <div className="space-y-2">
        <span className="engraved block">Fields</span>
        {fields.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 rounded-xl border border-line/[0.08] bg-pane/[0.03] p-2.5">
            <div className="flex items-center gap-2">
              <GlassInput value={f.name} onChange={(e) => updateField(i, { name: e.target.value })} placeholder={`Field ${i + 1} — e.g. mood`} className="flex-1" />
              <GlassSelect value={f.type} onChange={(e) => updateField(i, { type: e.target.value as CustomFieldType })} className="w-28 shrink-0">
                {FIELD_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </GlassSelect>
              <GlassButton variant="ghost" size="icon" onClick={() => setFields((prev) => prev.filter((_, idx) => idx !== i))} disabled={fields.length === 1} aria-label="Remove field">
                <Trash2 size={14} />
              </GlassButton>
            </div>
            <div className="flex items-center gap-3 px-1">
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-ink-dim">
                <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} className="h-3.5 w-3.5 accent-[#cca35e]" />
                Required
              </label>
              {f.type === 'enum' && (
                <GlassInput value={f.options} onChange={(e) => updateField(i, { options: e.target.value })} placeholder="Options: great, fine, rough" className="h-7 flex-1 px-2 py-1 text-xs" />
              )}
            </div>
          </motion.div>
        ))}
        <GlassButton variant="ghost" size="sm" onClick={() => setFields((prev) => [...prev, { name: '', type: 'string', required: false, options: '' }])}>
          <Plus size={13} /> Add field
        </GlassButton>
      </div>

      {error && <p className="rounded-lg border border-clay/25 bg-clay/10 px-3 py-2 text-xs text-clay-soft">{error}</p>}

      <GlassButton type="submit" variant="accent" disabled={create.isPending} className="w-full">
        {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        Create store
      </GlassButton>
    </form>
  )
}
