import { UnprocessableEntityException } from '@nestjs/common'
import type { CustomFieldDef, CustomFieldType } from '@onlydesk/shared-types'

/**
 * Validation for user-defined scopes. Two layers:
 *  1. `validateFieldDefs` — checks a schema definition is well-formed at create/update.
 *  2. `validateRecord` — checks a record payload conforms to a stored schema at write.
 *
 * Failures throw `UnprocessableEntityException` (mapped to VALIDATION_FAILED by
 * the global error contract) carrying a structured `violations` list.
 */

const FIELD_TYPES: readonly CustomFieldType[] = ['string', 'text', 'number', 'boolean', 'date', 'enum']
const FIELD_NAME_RE = /^[a-z][a-z0-9_]{0,62}$/i
export const SCOPE_KEY_RE = /^[a-z][a-z0-9_-]{1,63}$/

type Violation = { field: string; message: string }

function fail(message: string, violations: Violation[]): never {
  throw new UnprocessableEntityException({ message, details: { violations } })
}

/** Validate a custom scope's field definitions. Returns the normalized fields. */
export function validateFieldDefs(fields: unknown): CustomFieldDef[] {
  if (!Array.isArray(fields) || fields.length === 0) {
    fail('A custom scope must declare at least one field', [{ field: 'fields', message: 'must be a non-empty array' }])
  }
  const violations: Violation[] = []
  const seen = new Set<string>()
  const normalized: CustomFieldDef[] = []

  for (const [i, raw] of (fields as unknown[]).entries()) {
    const f = raw as Partial<CustomFieldDef>
    const at = `fields[${i}]`
    if (typeof f.name !== 'string' || !FIELD_NAME_RE.test(f.name)) {
      violations.push({ field: `${at}.name`, message: 'must match /^[a-z][a-z0-9_]*$/i' })
      continue
    }
    if (seen.has(f.name)) {
      violations.push({ field: `${at}.name`, message: `duplicate field "${f.name}"` })
      continue
    }
    if (typeof f.type !== 'string' || !FIELD_TYPES.includes(f.type as CustomFieldType)) {
      violations.push({ field: `${at}.type`, message: `must be one of ${FIELD_TYPES.join(', ')}` })
      continue
    }
    if (f.type === 'enum' && (!Array.isArray(f.options) || f.options.length === 0 || !f.options.every((o) => typeof o === 'string'))) {
      violations.push({ field: `${at}.options`, message: 'enum fields require a non-empty string[] of options' })
      continue
    }
    seen.add(f.name)
    normalized.push({
      name: f.name,
      label: typeof f.label === 'string' ? f.label : undefined,
      type: f.type as CustomFieldType,
      required: Boolean(f.required),
      ...(f.type === 'enum' ? { options: f.options } : {}),
    })
  }

  if (violations.length) fail('Invalid field definitions', violations)
  return normalized
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}/

function checkType(field: CustomFieldDef, value: unknown): string | null {
  switch (field.type) {
    case 'string':
    case 'text':
      return typeof value === 'string' ? null : 'must be a string'
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? null : 'must be a finite number'
    case 'boolean':
      return typeof value === 'boolean' ? null : 'must be a boolean'
    case 'date':
      return typeof value === 'string' && ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value)) ? null : 'must be an ISO date string'
    case 'enum':
      return typeof value === 'string' && (field.options ?? []).includes(value) ? null : `must be one of ${(field.options ?? []).join(', ')}`
    default:
      return 'unknown field type'
  }
}

/** Validate a record payload against a schema's fields. Returns the cleaned data. */
export function validateRecord(fields: CustomFieldDef[], data: unknown): Record<string, unknown> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    fail('Record body must be an object', [{ field: 'data', message: 'must be an object' }])
  }
  const input = data as Record<string, unknown>
  const violations: Violation[] = []
  const allowed = new Set(fields.map((f) => f.name))
  const cleaned: Record<string, unknown> = {}

  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) violations.push({ field: key, message: 'unknown field not declared on this scope' })
  }

  for (const field of fields) {
    const value = input[field.name]
    const missing = value === undefined || value === null || value === ''
    if (missing) {
      if (field.required) violations.push({ field: field.name, message: 'is required' })
      continue
    }
    const typeError = checkType(field, value)
    if (typeError) violations.push({ field: field.name, message: typeError })
    else cleaned[field.name] = value
  }

  if (violations.length) fail('Record does not match scope schema', violations)
  return cleaned
}
