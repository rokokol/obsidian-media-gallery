import { describe, expect, it } from 'vitest'
import { getDefaultGallerySettings, getSettings } from './get-settings'

const container = (): HTMLElement => document.createElement('div')

describe('getDefaultGallerySettings', () => {
  it('returns sane defaults', () => {
    const settings = getDefaultGallerySettings()
    expect(settings.type).toBe('vertical')
    expect(settings.radius).toBe(0)
    expect(settings.gutter).toBe(8)
    expect(settings.sortby).toBe('ctime')
    expect(settings.fit).toBe('cover')
    expect(settings.columns).toBe(3)
  })

  it('prefers contain fit for mosaic layouts', () => {
    expect(getDefaultGallerySettings('mosaic').fit).toBe('contain')
  })
})

describe('getSettings', () => {
  it('parses and coerces a YAML block', () => {
    const settings = getSettings(
      ['path: media/2024', 'type: horizontal', 'radius: 12', 'waveform: false', 'extensions: [jpg, png]', 'limit: 5'].join('\n'),
      container(),
    )

    expect(settings.path).toBe('media/2024')
    expect(settings.type).toBe('horizontal')
    expect(settings.radius).toBe(12)
    expect(settings.waveform).toBe(false)
    expect(settings.extensions).toEqual(['jpg', 'png'])
    expect(settings.limit).toBe(5)
  })

  it('falls back to defaults for invalid values', () => {
    const settings = getSettings(['type: nonsense', 'sortby: bogus', 'fit: weird'].join('\n'), container())
    expect(settings.type).toBe('vertical')
    expect(settings.sortby).toBe('ctime')
    expect(settings.fit).toBe('cover')
  })

  it('accepts a bare wildcard path', () => {
    const settings = getSettings('path: *', container())
    expect(settings.path).toBe('*')
  })

  it('throws when the block is not a YAML mapping', () => {
    expect(() => getSettings('just a string', container())).toThrow()
  })
})
