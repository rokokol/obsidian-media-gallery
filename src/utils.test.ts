import { describe, expect, it } from 'vitest'
import { isRecord, normalizeListSetting, normalizeSeedSetting } from './utils'

describe('normalizeListSetting', () => {
  it('keeps arrays, trimming and dropping empties', () => {
    expect(normalizeListSetting(['a', ' b ', '', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('splits comma-separated strings', () => {
    expect(normalizeListSetting('jpg, png ,gif')).toEqual(['jpg', 'png', 'gif'])
  })

  it('unwraps a bracketed list string', () => {
    expect(normalizeListSetting('[jpg, png]')).toEqual(['jpg', 'png'])
  })

  it('coerces array items to strings', () => {
    expect(normalizeListSetting([1, 2])).toEqual(['1', '2'])
  })

  it('returns an empty array for non-list input', () => {
    expect(normalizeListSetting(undefined)).toEqual([])
    expect(normalizeListSetting(42)).toEqual([])
    expect(normalizeListSetting(null)).toEqual([])
  })
})

describe('normalizeSeedSetting', () => {
  it('trims non-empty strings', () => {
    expect(normalizeSeedSetting('  seed  ')).toBe('seed')
  })

  it('stringifies numbers and booleans', () => {
    expect(normalizeSeedSetting(7)).toBe('7')
    expect(normalizeSeedSetting(false)).toBe('false')
  })

  it('returns undefined for empty or missing values', () => {
    expect(normalizeSeedSetting('   ')).toBeUndefined()
    expect(normalizeSeedSetting(null)).toBeUndefined()
    expect(normalizeSeedSetting(undefined)).toBeUndefined()
    expect(normalizeSeedSetting({})).toBeUndefined()
  })
})

describe('isRecord', () => {
  it('accepts plain objects only', () => {
    expect(isRecord({ a: 1 })).toBe(true)
    expect(isRecord([])).toBe(false)
    expect(isRecord(null)).toBe(false)
    expect(isRecord('x')).toBe(false)
  })
})
