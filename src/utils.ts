// Small shared helpers used across settings parsing and media discovery.

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Accepts an array, a comma-separated string, or a bracketed list and returns a
// clean list of non-empty trimmed strings.
export const normalizeListSetting = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  const normalized = value.trim().replace(/^\[(.*)\]$/, '$1')
  return normalized.split(',').map((item) => item.trim()).filter(Boolean)
}

// Normalizes a seed value (string, number, or boolean) to a trimmed string, or
// undefined when no usable seed was provided.
export const normalizeSeedSetting = (value: unknown): string | undefined => {
  if (value === null || typeof value === 'undefined') {
    return undefined
  }

  if (typeof value === 'string') {
    return value.trim() || undefined
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim() || undefined
  }

  return undefined
}
