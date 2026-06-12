'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Plus } from 'lucide-react'
import type { CustomFieldDef } from '@onlydesk/shared-types'
import { Field, GlassButton, GlassInput, GlassSelect, GlassTextarea } from '@/components/ui/glass'
import { asApiError } from '@/lib/errors'

type DynamicFormProps = {
  fields: CustomFieldDef[]
  /** Fields submitted as comma-separated text but stored as string[]. */
  arrayFields?: string[]
  /** Fields submitted as raw JSON text but stored as objects. */
  jsonFields?: string[]
  pending?: boolean
  submitLabel?: string
  onSubmit: (data: Record<string, unknown>) => Promise<unknown>
}

/**
 * Form generated from field definitions — the hydration UI for both custom
 * JSONB scopes and the built-in typed scopes. Coerces values by declared type
 * and surfaces the server's typed validation violations inline.
 */
export const DynamicForm = ({ fields, arrayFields = [], jsonFields = [], pending, submitLabel = 'Add entry', onSubmit }: DynamicFormProps) => {
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const setValue = (name: string, v: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: v }))
    setErrors((prev) => (prev[name] ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== name)) : prev))
  }

  const coerce = (field: CustomFieldDef, raw: string | boolean | undefined): unknown => {
    if (field.type === 'boolean') return Boolean(raw)
    const text = typeof raw === 'string' ? raw.trim() : ''
    if (text === '') return undefined
    if (arrayFields.includes(field.name)) return text.split(',').map((t) => t.trim()).filter(Boolean)
    if (jsonFields.includes(field.name)) {
      try {
        return JSON.parse(text)
      } catch {
        throw Object.assign(new Error(`"${field.label ?? field.name}" must be valid JSON`), { field: field.name })
      }
    }
    if (field.type === 'number') {
      const n = Number(text)
      if (Number.isNaN(n)) throw Object.assign(new Error(`"${field.label ?? field.name}" must be a number`), { field: field.name })
      return n
    }
    return text
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setErrors({})

    const data: Record<string, unknown> = {}
    try {
      for (const field of fields) {
        const v = coerce(field, values[field.name])
        if (v === undefined || v === '') {
          if (field.required) {
            setErrors((prev) => ({ ...prev, [field.name]: 'Required' }))
            return
          }
          continue
        }
        data[field.name] = v
      }
    } catch (err) {
      const fieldName = (err as { field?: string }).field
      if (fieldName) setErrors({ [fieldName]: (err as Error).message })
      else setFormError((err as Error).message)
      return
    }

    try {
      await onSubmit(data)
      setValues({})
    } catch (err) {
      const apiErr = asApiError(err)
      if (apiErr.violations.length) {
        setErrors(Object.fromEntries(apiErr.violations.map((v) => [v.field, v.message])))
      } else {
        setFormError(`${apiErr.message}${apiErr.code !== 'INTERNAL' ? ` (${apiErr.code})` : ''}`)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {fields.map((field) => (
        <div key={field.name}>
          <Field label={`${field.label ?? field.name}${field.required ? ' *' : ''}`}>
            <FieldInput field={field} value={values[field.name]} onChange={(v) => setValue(field.name, v)} />
          </Field>
          {errors[field.name] && <p className="mt-1 text-[11px] text-clay-soft">{errors[field.name]}</p>}
        </div>
      ))}

      {formError && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-clay/25 bg-clay/10 px-3 py-2 text-xs text-clay-soft">
          {formError}
        </motion.p>
      )}

      <GlassButton type="submit" variant="accent" disabled={pending} className="w-full">
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {submitLabel}
      </GlassButton>
    </form>
  )
}

const FieldInput = ({ field, value, onChange }: { field: CustomFieldDef; value: string | boolean | undefined; onChange: (v: string | boolean) => void }) => {
  switch (field.type) {
    case 'text':
      return <GlassTextarea value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} rows={3} />
    case 'number':
      return <GlassInput type="number" inputMode="decimal" value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
    case 'date':
      return <GlassInput type="date" value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
    case 'boolean':
      return (
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(value)}
          onClick={() => onChange(!value)}
          className={`relative h-6 w-11 rounded-full border transition-colors ${value ? 'border-accent/50 bg-accent/40' : 'border-line/10 bg-pane/[0.06]'}`}
        >
          <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-ink shadow ${value ? 'right-0.5' : 'left-0.5'}`} />
        </button>
      )
    case 'enum':
      return (
        <GlassSelect value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </GlassSelect>
      )
    default:
      return <GlassInput value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
  }
}
