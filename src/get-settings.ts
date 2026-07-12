import { normalizePath, parseYaml, Platform } from 'obsidian'
import renderError from './render-error'
import { isRecord, normalizeListSetting, normalizeSeedSetting } from './utils'
import type { GalleryFit, GalleryLayout, GallerySettings, GallerySettingsInput, GallerySortBy, GallerySortDirection } from './types'

const normalizeSettingsSrc = (src: string): string => {
  return src.replace(/^(\s*path\s*:\s*)(\*{1,2})(\s*)$/gm, '$1"$2"$3')
}

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

const toLayout = (value: unknown, fallback: GalleryLayout): GalleryLayout => {
  if (value === 'horizontal' || value === 'vertical' || value === 'mosaic' || value === 'collage') {
    return value
  }

  return fallback
}

const toSortBy = (value: unknown, fallback: GallerySortBy): GallerySortBy => {
  if (value === 'name' || value === 'mtime' || value === 'ctime' || value === 'rand' || value === 'random') {
    return value
  }

  return fallback
}

const toSortDirection = (value: unknown, fallback: GallerySortDirection): GallerySortDirection => {
  if (value === 'asc' || value === 'desc') {
    return value
  }

  return fallback
}

const toFit = (value: unknown, fallback: GalleryFit): GalleryFit => {
  if (value === 'cover' || value === 'contain') {
    return value
  }

  return fallback
}

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (/^(true|1|yes|on)$/i.test(value)) return true
    if (/^(false|0|no|off)$/i.test(value)) return false
  }

  return fallback
}

export const getSettings = (src: string, container: HTMLElement): GallerySettings => {
  const parsedYaml: unknown = parseYaml(normalizeSettingsSrc(src))

  if (!isRecord(parsedYaml)) {
    const error = 'Cannot parse YAML!'
    renderError(container, error)
    throw new Error(error)
  }

  const settingsSrc = parsedYaml as GallerySettingsInput
  const normalizedPath = typeof settingsSrc.path === 'string' && settingsSrc.path.trim()
    ? normalizePath(settingsSrc.path)
    : undefined

  return {
    path: normalizedPath,
    type: toLayout(settingsSrc.type, 'vertical'),
    radius: toNumber(settingsSrc.radius, 0),
    gutter: toNumber(settingsSrc.gutter, 8),
    sortby: toSortBy(settingsSrc.sortby, 'ctime'),
    sort: toSortDirection(settingsSrc.sort, 'desc'),
    fit: toFit(settingsSrc.fit, 'cover'),
    waveform: toBoolean(settingsSrc.waveform, true),
    spectrogram: toBoolean(settingsSrc.spectrogram, false),
    extensions: normalizeListSetting(settingsSrc.extensions),
    exclude: normalizeListSetting(settingsSrc.exclude),
    limit: toNumber(settingsSrc.limit, 0),
    seed: normalizeSeedSetting(settingsSrc.seed),
    mobile: toNumber(settingsSrc.mobile, 1),
    columns: Platform.isDesktop ? toNumber(settingsSrc.columns, 3) : toNumber(settingsSrc.mobile, 1),
    height: toNumber(settingsSrc.height, 260),
  }
}

export const getDefaultGallerySettings = (type: GalleryLayout = 'vertical'): GallerySettings => {
  return {
    path: undefined,
    type,
    radius: 0,
    gutter: 8,
    sortby: 'ctime',
    sort: 'desc',
    fit: type === 'mosaic' ? 'contain' : 'cover',
    waveform: true,
    spectrogram: false,
    extensions: [],
    exclude: [],
    limit: 0,
    seed: undefined,
    mobile: 1,
    columns: Platform.isDesktop ? 3 : 1,
    height: 260,
  }
}
