import { App, Notice, TFile, TFolder, normalizePath, requestUrl } from 'obsidian'
import renderError from './render-error'
import { galleryRuntimeSettings } from './runtime-settings'
import type { AudioMetadata, GallerySettings, GallerySettingsOverride, MediaCacheHost, MediaEntry, MediaKind } from './types'

const validImageExtensions = ['jpeg', 'jpg', 'gif', 'png', 'webp', 'tiff', 'tif', 'bmp', 'svg', 'avif']
const validVideoExtensions = ['mp4', 'webm', 'mov', 'm4v', 'ogv']
const validAudioExtensions = ['mp3', 'm4a', 'wav', 'ogg', 'oga', 'flac', 'aac', 'opus']

const audioArtworkCache = new Map<string, string | null>()
const audioMetadataCache = new Map<string, AudioMetadata | null>()
const audioWaveformCache = new Map<string, number[] | null>()
const audioSpectrogramCache = new Map<string, number[][] | null>()
const audioObjectUrls = new Set<string>()

export const clearAudioCaches = (): void => {
  audioArtworkCache.clear()
  audioMetadataCache.clear()
  audioWaveformCache.clear()
  audioSpectrogramCache.clear()
  audioObjectUrls.forEach((url) => URL.revokeObjectURL(url))
  audioObjectUrls.clear()
}

export const isImageExtension = (extension: string): boolean => validImageExtensions.includes(extension.toLowerCase())
export const isVideoExtension = (extension: string): boolean => validVideoExtensions.includes(extension.toLowerCase())
export const isAudioExtension = (extension: string): boolean => validAudioExtensions.includes(extension.toLowerCase())

export const getMediaKindFromPath = (path: string): MediaKind => {
  const extension = path.split('.').pop() || ''
  if (isVideoExtension(extension)) return 'video'
  if (isAudioExtension(extension)) return 'audio'
  return 'image'
}

export const getVideoMimeType = (path: string): string => {
  const extension = (path.split('.').pop() || '').toLowerCase()
  switch (extension) {
    case 'mp4':
    case 'm4v':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'mov':
      return 'video/quicktime'
    case 'ogv':
      return 'video/ogg'
    default:
      return 'video/mp4'
  }
}

export const getAudioMimeType = (path: string): string => {
  const extension = (path.split('.').pop() || '').toLowerCase()
  switch (extension) {
    case 'mp3':
      return 'audio/mpeg'
    case 'm4a':
    case 'aac':
      return 'audio/mp4'
    case 'wav':
      return 'audio/wav'
    case 'ogg':
    case 'oga':
      return 'audio/ogg'
    case 'flac':
      return 'audio/flac'
    case 'opus':
      return 'audio/opus'
    default:
      return 'audio/mpeg'
  }
}

export const isVaultMedia = (file: unknown): file is TFile => {
  return file instanceof TFile && (isImageExtension(file.extension) || isVideoExtension(file.extension) || isAudioExtension(file.extension))
}

const isRemoteMediaEntry = (file: MediaEntry): boolean => /^https?:\/\//i.test(file.path)

const readSynchsafeInteger = (bytes: Uint8Array, start: number): number => {
  return ((bytes[start] & 127) << 21) | ((bytes[start + 1] & 127) << 14) | ((bytes[start + 2] & 127) << 7) | (bytes[start + 3] & 127)
}

const readIsoString = (bytes: Uint8Array, start: number, end: number): string => {
  let out = ''
  for (let index = start; index < end; index += 1) {
    if (bytes[index] === 0) break
    out += String.fromCharCode(bytes[index])
  }
  return out
}

const skipEncodedText = (bytes: Uint8Array, start: number, encoding: number): number => {
  if (encoding === 1 || encoding === 2) {
    let index = start
    while (index + 1 < bytes.length) {
      if (bytes[index] === 0 && bytes[index + 1] === 0) return index + 2
      index += 2
    }
    return bytes.length
  }

  let index = start
  while (index < bytes.length) {
    if (bytes[index] === 0) return index + 1
    index += 1
  }
  return bytes.length
}

const decodeTextBytes = (bytes: Uint8Array, encoding: number): string => {
  try {
    if (encoding === 1 || encoding === 2) return new TextDecoder('utf-16').decode(bytes).split(String.fromCharCode(0)).join('').trim()
    if (encoding === 3) return new TextDecoder('utf-8').decode(bytes).split(String.fromCharCode(0)).join('').trim()
  } catch {
    return readIsoString(bytes, 0, bytes.length).trim()
  }

  return readIsoString(bytes, 0, bytes.length).trim()
}

const parseMp3Metadata = (arrayBuffer: ArrayBuffer): AudioMetadata => {
  const bytes = new Uint8Array(arrayBuffer)
  if (bytes.length < 10 || readIsoString(bytes, 0, 3) !== 'ID3') {
    return { artworkUrl: null, title: null, artist: null, album: null }
  }

  const version = bytes[3]
  const tagSize = readSynchsafeInteger(bytes, 6)
  let offset = 10
  const limit = Math.min(bytes.length, tagSize + 10)
  let artworkUrl: string | null = null
  let title: string | null = null
  let artist: string | null = null
  let album: string | null = null

  while (offset + 10 <= limit) {
    const frameId = readIsoString(bytes, offset, offset + 4)
    if (!frameId.trim()) break

    const frameSize = version === 4
      ? readSynchsafeInteger(bytes, offset + 4)
      : (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7]

    if (!frameSize) break

    const frameStart = offset + 10
    const frameEnd = Math.min(frameStart + frameSize, bytes.length)

    if (frameId === 'APIC') {
      const encoding = bytes[frameStart]
      let cursor = frameStart + 1
      let mimeEnd = cursor
      while (mimeEnd < frameEnd && bytes[mimeEnd] !== 0) mimeEnd += 1
      const mimeType = readIsoString(bytes, cursor, mimeEnd) || 'image/jpeg'
      cursor = mimeEnd + 1
      cursor += 1
      cursor = skipEncodedText(bytes, cursor, encoding)
      if (cursor < frameEnd && !artworkUrl) {
        const blob = new Blob([bytes.slice(cursor, frameEnd)], { type: mimeType })
        const objectUrl = URL.createObjectURL(blob)
        audioObjectUrls.add(objectUrl)
        artworkUrl = objectUrl
      }
    } else if (['TIT2', 'TPE1', 'TALB'].includes(frameId) && frameEnd > frameStart + 1) {
      const encoding = bytes[frameStart]
      const value = decodeTextBytes(bytes.slice(frameStart + 1, frameEnd), encoding)
      if (frameId === 'TIT2' && value) title = value
      if (frameId === 'TPE1' && value) artist = value
      if (frameId === 'TALB' && value) album = value
    }

    offset += 10 + frameSize
  }

  return { artworkUrl, title, artist, album }
}

const getAudioContextCtor = (): typeof AudioContext | undefined => {
  const maybeWindow = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
  return maybeWindow.AudioContext || maybeWindow.webkitAudioContext
}

const readMediaArrayBuffer = async (app: App, file: MediaEntry): Promise<ArrayBuffer> => {
  if (file.vaultFile) return app.vault.readBinary(file.vaultFile)
  if (isRemoteMediaEntry(file)) return (await requestUrl(file.uri)).arrayBuffer
  throw new Error(`Cannot read media bytes for ${file.path}`)
}

export const getAudioMetadata = async (app: App, file: MediaEntry): Promise<AudioMetadata | null> => {
  if (file.kind !== 'audio') return null
  if (audioMetadataCache.has(file.path)) return audioMetadataCache.get(file.path) ?? null

  let metadata: AudioMetadata = { artworkUrl: null, title: null, artist: null, album: null }
  if ((file.path.split('.').pop() || '').toLowerCase() === 'mp3') {
    try {
      const buffer = await readMediaArrayBuffer(app, file)
      metadata = parseMp3Metadata(buffer)
    } catch {
      metadata = { artworkUrl: null, title: null, artist: null, album: null }
    }
  }

  audioMetadataCache.set(file.path, metadata)
  return metadata
}

export const getAudioArtworkUrl = async (app: App, file: MediaEntry): Promise<string | null> => {
  if (file.kind !== 'audio') return null
  if (audioArtworkCache.has(file.path)) return audioArtworkCache.get(file.path) ?? null

  const metadata = await getAudioMetadata(app, file)
  const artworkUrl = metadata?.artworkUrl || null
  audioArtworkCache.set(file.path, artworkUrl)
  return artworkUrl
}

const buildWaveformBars = async (arrayBuffer: ArrayBuffer): Promise<number[] | null> => {
  const AudioContextCtor = getAudioContextCtor()
  if (!AudioContextCtor) return null

  const ctx = new AudioContextCtor()
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0))
    const channel = audioBuffer.getChannelData(0)
    const bars = 40
    const blockSize = Math.max(1, Math.floor(channel.length / bars))
    const values: number[] = []
    let maxValue = 0

    for (let bar = 0; bar < bars; bar += 1) {
      let peak = 0
      const start = bar * blockSize
      const end = Math.min(channel.length, start + blockSize)
      for (let index = start; index < end; index += 1) {
        const amplitude = Math.abs(channel[index])
        if (amplitude > peak) peak = amplitude
      }
      maxValue = Math.max(maxValue, peak)
      values.push(peak)
    }

    if (maxValue <= 0) return values
    return values.map((value) => Math.pow(value / maxValue, 0.75))
  } catch {
    return null
  } finally {
    await ctx.close()
  }
}

export const getAudioWaveform = async (app: App, file: MediaEntry, enabled: boolean): Promise<number[] | null> => {
  if (!enabled || file.kind !== 'audio') return null
  if (audioWaveformCache.has(file.path)) return audioWaveformCache.get(file.path) ?? null

  let waveform: number[] | null = null
  try {
    const buffer = await readMediaArrayBuffer(app, file)
    waveform = await buildWaveformBars(buffer)
  } catch {
    waveform = null
  }

  audioWaveformCache.set(file.path, waveform)
  return waveform
}

const getSpectrogramBandMagnitude = (channel: Float32Array, start: number, windowSize: number, bin: number): number => {
  const omega = (2 * Math.PI * bin) / windowSize
  const coeff = 2 * Math.cos(omega)
  let prev = 0
  let prev2 = 0

  for (let index = 0; index < windowSize; index += 1) {
    const sample = channel[start + index] || 0
    const value = sample + coeff * prev - prev2
    prev2 = prev
    prev = value
  }

  const power = prev * prev + prev2 * prev2 - coeff * prev * prev2
  return Math.sqrt(Math.max(0, power)) / windowSize
}

const buildSpectrogramData = async (arrayBuffer: ArrayBuffer): Promise<number[][] | null> => {
  const AudioContextCtor = getAudioContextCtor()
  if (!AudioContextCtor) return null

  const ctx = new AudioContextCtor()
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0))
    const channel = audioBuffer.getChannelData(0)
    const slices = 32
    const bands = 14
    const windowSize = 384
    const maxBin = 88
    const sliceSize = Math.max(windowSize, Math.floor(channel.length / slices))
    const data: number[][] = []
    const centerBins = Array.from({ length: bands }, (_, band) => {
      const ratio = band / Math.max(1, bands - 1)
      return Math.max(1, Math.round(Math.exp(Math.log(1) + ratio * (Math.log(maxBin) - Math.log(1)))))
    })
    let maxEnergy = 0

    for (let slice = 0; slice < slices; slice += 1) {
      const start = Math.min(Math.max(0, channel.length - windowSize), slice * sliceSize)
      const row: number[] = []
      for (let band = 0; band < centerBins.length; band += 1) {
        const normalizedBandEnergy = getSpectrogramBandMagnitude(channel, start, windowSize, centerBins[band])
        row.push(normalizedBandEnergy)
        if (normalizedBandEnergy > maxEnergy) maxEnergy = normalizedBandEnergy
      }
      data.push(row)
    }

    if (maxEnergy <= 0) return data

    return data.map((row, rowIndex) => row.map((value, bandIndex) => {
      const normalized = value / maxEnergy
      const lifted = Math.pow(normalized, 0.36)
      const bandBias = 0.86 + (bandIndex / Math.max(1, bands - 1)) * 0.44
      const timeBias = 0.92 + 0.08 * Math.sin((rowIndex / Math.max(1, slices - 1)) * Math.PI)
      return Math.max(0.06, Math.min(1, lifted * bandBias * timeBias))
    }))
  } catch {
    return null
  } finally {
    await ctx.close()
  }
}

export const getAudioSpectrogram = async (app: App, file: MediaEntry, enabled: boolean): Promise<number[][] | null> => {
  if (!enabled || !galleryRuntimeSettings.enableAudioVisualizations || file.kind !== 'audio') return null
  if (audioSpectrogramCache.has(file.path)) return audioSpectrogramCache.get(file.path) ?? null

  let spectrogram: number[][] | null = null
  try {
    const buffer = await readMediaArrayBuffer(app, file)
    spectrogram = await buildSpectrogramData(buffer)
  } catch {
    spectrogram = null
  }

  audioSpectrogramCache.set(file.path, spectrogram)
  return spectrogram
}

export const isSearchEverywherePath = (path?: string): boolean => {
  return !path || path === '.' || path === '/' || path === '*' || path === '**'
}

const hasWildcardPattern = (path?: string): boolean => typeof path === 'string' && /[*?]/.test(path)
export const isRecursiveGlobPath = (path?: string): boolean => typeof path === 'string' && /\/\*\*$/.test(path)
export const isShallowGlobPath = (path?: string): boolean => typeof path === 'string' && /\/\*$/.test(path) && !isRecursiveGlobPath(path)

export const normalizeMediaSearchPath = (path: string): string => {
  if (isRecursiveGlobPath(path)) return normalizePath(path.slice(0, -3))
  if (isShallowGlobPath(path)) return normalizePath(path.slice(0, -2))
  return normalizePath(path)
}

export const normalizeListSetting = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value !== 'string') return []
  const normalized = value.trim().replace(/^\[(.*)\]$/, '$1')
  return normalized.split(',').map((item) => item.trim()).filter(Boolean)
}

export const normalizeSeedSetting = (value: unknown): string | undefined => {
  if (value === null || typeof value === 'undefined') return undefined
  if (typeof value === 'string') return value.trim() || undefined
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim() || undefined
  return undefined
}

const hashSeed = (seed: string): number => {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const createSeededRandom = (seed: string): (() => number) => {
  let state = hashSeed(seed) || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const shuffleArray = <T>(items: T[], seed?: string): T[] => {
  const shuffled = [...items]
  const random = typeof seed === 'undefined' ? Math.random : createSeededRandom(seed)
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

const escapeRegex = (value: string): string => value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')

const createGlobRegex = (pattern: string, allowSlash: boolean): RegExp => {
  const placeholder = '::DOUBLE_STAR::'
  const starPattern = allowSlash ? '.*' : '[^/]*'
  const questionPattern = allowSlash ? '.' : '[^/]'
  const regexPattern = `^${escapeRegex(pattern).replace(/\*\*/g, placeholder).replace(/\*/g, starPattern).replace(/\\\?/g, questionPattern).replace(new RegExp(placeholder, 'g'), '.*')}$`
  return new RegExp(regexPattern)
}

const getPathWithoutExtension = (filePath: string): string => {
  const normalizedPath = `${filePath}`.split('?')[0].split('#')[0]
  const lastSlashIndex = normalizedPath.lastIndexOf('/')
  const lastDotIndex = normalizedPath.lastIndexOf('.')
  if (lastDotIndex <= lastSlashIndex) return normalizedPath
  return normalizedPath.slice(0, lastDotIndex)
}

const getFileName = (filePath: string): string => {
  const normalizedPath = `${filePath}`.split('?')[0].split('#')[0]
  return normalizedPath.split('/').pop() || normalizedPath
}

const getFileNameWithoutExtension = (filePath: string): string => getFileName(getPathWithoutExtension(filePath))

const getPatternScopePath = (pattern?: string): string | undefined => {
  if (!pattern) return undefined

  const normalizedPattern = pattern.trim().replace(/\\/g, '/').replace(/\/+/g, '/')
  if (!normalizedPattern || isSearchEverywherePath(normalizedPattern)) return undefined

  if (isRecursiveGlobPath(normalizedPattern) || isShallowGlobPath(normalizedPattern)) {
    return normalizeMediaSearchPath(normalizedPattern)
  }

  const wildcardIndex = normalizedPattern.search(/[*?]/)
  if (wildcardIndex < 0) return normalizePath(normalizedPattern)

  const staticPrefix = normalizedPattern.slice(0, wildcardIndex)
  const lastSlashIndex = staticPrefix.lastIndexOf('/')
  if (lastSlashIndex < 0) return undefined

  const scopePath = staticPrefix.slice(0, lastSlashIndex)
  return scopePath ? normalizePath(scopePath) : undefined
}

const createPathPatternMatcher = (pattern: string, allowFlexible: boolean): ((filePath: string) => boolean) => {
  if (!pattern) return () => false

  const normalizedPattern = `${pattern}`.trim().replace(/\\/g, '/').replace(/\/+/g, '/')
  if (isSearchEverywherePath(normalizedPattern)) return () => true

  if (isRecursiveGlobPath(normalizedPattern)) {
    const basePath = normalizeMediaSearchPath(normalizedPattern)
    return (filePath) => filePath === basePath || filePath.startsWith(`${basePath}/`)
  }

  if (isShallowGlobPath(normalizedPattern)) {
    const basePath = normalizeMediaSearchPath(normalizedPattern)
    return (filePath) => filePath.split('/').slice(0, -1).join('/') === basePath
  }

  if (allowFlexible && hasWildcardPattern(normalizedPattern)) {
    if (galleryRuntimeSettings.matchWildcardsAgainstFileNames) {
      const lastSlashIndex = normalizedPattern.lastIndexOf('/')
      const dirPattern = lastSlashIndex >= 0 ? normalizedPattern.slice(0, lastSlashIndex) : ''
      const filePattern = lastSlashIndex >= 0 ? normalizedPattern.slice(lastSlashIndex + 1) : normalizedPattern
      const dirRegex = dirPattern ? createGlobRegex(dirPattern, false) : null
      const fileRegex = createGlobRegex(filePattern, true)
      return (filePath) => {
        const normalizedFilePath = `${filePath}`.split('?')[0].split('#')[0]
        const dirPath = normalizedFilePath.split('/').slice(0, -1).join('/')
        if (dirRegex && !dirRegex.test(dirPath)) return false
        return fileRegex.test(getFileName(normalizedFilePath)) || fileRegex.test(getFileNameWithoutExtension(normalizedFilePath))
      }
    }

    const regex = createGlobRegex(normalizedPattern, true)
    return (filePath) => regex.test(filePath) || regex.test(getPathWithoutExtension(filePath))
  }

  const exactPath = normalizePath(normalizedPattern)
  return (filePath) => filePath === exactPath || filePath.startsWith(`${exactPath}/`)
}

const getMediaItemPath = (item: TFile | MediaEntry): string => {
  if (item instanceof TFile) return item.path
  return item.path || item.uri
}

const getMediaItemExtension = (item: TFile | MediaEntry): string => {
  if (item instanceof TFile) return item.extension.toLowerCase()
  const normalizedPath = getMediaItemPath(item).split('?')[0].split('#')[0]
  return (normalizedPath.split('.').pop() || '').toLowerCase()
}

const createMediaItemFilter = (settings: GallerySettings): ((item: TFile | MediaEntry) => boolean) => {
  const allowedExtensions = new Set(
    normalizeListSetting(settings.extensions)
      .map((extension) => extension.replace(/^\./, '').toLowerCase())
      .filter(Boolean),
  )
  const excludeMatchers = normalizeListSetting(settings.exclude)
    .map((pattern) => createPathPatternMatcher(pattern, galleryRuntimeSettings.enableFlexiblePathPatterns))

  return (item) => {
    const itemPath = getMediaItemPath(item)
    if (allowedExtensions.size && !allowedExtensions.has(getMediaItemExtension(item))) return false
    if (excludeMatchers.some((matcher) => matcher(itemPath))) return false
    return true
  }
}

export const createMediaEntry = (app: App, file: TFile): MediaEntry => ({
  name: file.name,
  folder: file.parent?.path ?? '',
  path: file.path,
  uri: app.vault.adapter.getResourcePath(file.path),
  kind: getMediaKindFromPath(file.path),
  vaultFile: file,
})

export const getMediaDisplayName = (file: MediaEntry): string => {
  const name = file.name || getFileName(file.path)
  const lastDotIndex = name.lastIndexOf('.')
  return lastDotIndex > 0 ? name.slice(0, lastDotIndex) : name
}

export const getAudioSubtitle = (metadata: AudioMetadata | null): string => {
  if (!metadata) return ''
  if (metadata.artist && metadata.album) return `${metadata.artist} • ${metadata.album}`
  return metadata.artist || metadata.album || ''
}

export const resolveMediaFromLink = (app: App, link: string, sourcePath: string): MediaEntry | null => {
  const normalizedLink = link.trim()
  if (!normalizedLink) return null

  if (/^https?:\/\//i.test(normalizedLink)) {
    const cleanUrl = normalizedLink
    return {
      name: cleanUrl.split('/').pop() || cleanUrl,
      folder: '',
      path: cleanUrl,
      uri: cleanUrl,
      kind: getMediaKindFromPath(cleanUrl),
    }
  }

  const cleanLink = normalizedLink.split('|')[0].split('#')[0].trim()
  const resolved = app.metadataCache.getFirstLinkpathDest(cleanLink, sourcePath)
    || app.vault.getAbstractFileByPath(normalizePath(cleanLink))

  if (isVaultMedia(resolved)) return createMediaEntry(app, resolved)
  return null
}

export const parseExplicitMediaList = (app: App, src: string, sourcePath: string): MediaEntry[] => {
  const lines = src.split('\n').map((line) => line.trim()).filter(Boolean)
  const images: MediaEntry[] = []

  lines.forEach((line) => {
    let candidate: MediaEntry | null = null
    const wikiMatch = line.match(/^!?\[\[(.+?)\]\]$/)
    const markdownMatch = line.match(/^!\[[^\]]*\]\((.+?)\)$/)

    if (wikiMatch) {
      candidate = resolveMediaFromLink(app, wikiMatch[1], sourcePath)
    } else if (markdownMatch) {
      candidate = resolveMediaFromLink(app, markdownMatch[1], sourcePath)
    } else if (/^(https?:\/\/|[^:]+\.(?:jpe?g|gif|png|webp|tiff?|bmp|svg|avif|mp4|webm|mov|m4v|ogv|mp3|m4a|wav|ogg|oga|flac|aac|opus))$/i.test(line)) {
      candidate = resolveMediaFromLink(app, line, sourcePath)
    }

    if (candidate) {
      images.push(candidate)
    } else if (wikiMatch || markdownMatch) {
      const unresolved = wikiMatch?.[1] ?? markdownMatch?.[1] ?? line
      new Notice(`Media Gallery: cannot resolve ${unresolved}`)
    }
  })

  return images
}

export const mergeMediaEntries = (baseEntries: MediaEntry[], extraEntries: MediaEntry[]): MediaEntry[] => {
  const merged: MediaEntry[] = []
  const seenPaths = new Set<string>()

  ;[...baseEntries, ...extraEntries].forEach((entry) => {
    const key = entry.path || entry.uri || entry.name
    if (seenPaths.has(key)) return
    seenPaths.add(key)
    merged.push(entry)
  })

  return merged
}

export const applyMediaLimit = <T>(items: T[], limit: number): T[] => {
  if (limit > 0) return items.slice(0, limit)
  return items
}

export const applyMediaOrderingAndLimit = <T>(items: T[], settings: GallerySettings): T[] => {
  const usesRandomSort = settings.sortby === 'rand' || settings.sortby === 'random'
  let orderedItems = items
  if (usesRandomSort) {
    const effectiveSeed = typeof settings.seed === 'undefined' ? `${Date.now()}-${Math.random()}` : settings.seed
    orderedItems = shuffleArray(items, effectiveSeed)
  }
  return applyMediaLimit(orderedItems, settings.limit)
}

export const parseExplicitBlock = (app: App, src: string, sourcePath: string): { images: MediaEntry[]; overrides: GallerySettingsOverride; hasMediaLines: boolean } => {
  const lines = src.split('\n').map((line) => line.trim()).filter(Boolean)
  const overrides: GallerySettingsOverride = {}
  const mediaLines: string[] = []
  const knownKeys = new Set(['type', 'radius', 'gutter', 'sortby', 'sort', 'mobile', 'columns', 'height', 'path', 'fit', 'waveform', 'spectrogram', 'extensions', 'exclude', 'limit', 'seed'])

  lines.forEach((line) => {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+)$/)
    if (!match) {
      mediaLines.push(line)
      return
    }

    const key = match[1].toLowerCase()
    const rawValue = match[2].trim()
    if (!knownKeys.has(key)) {
      mediaLines.push(line)
      return
    }

    if (key === 'radius' || key === 'gutter' || key === 'mobile' || key === 'columns' || key === 'height' || key === 'limit') {
      const numeric = Number(rawValue)
      if (!Number.isNaN(numeric)) {
        overrides[key] = numeric as never
      }
      return
    }

    if (key === 'waveform' || key === 'spectrogram') {
      overrides[key] = /^(true|1|yes|on)$/i.test(rawValue) as never
      return
    }

    if (key === 'extensions' || key === 'exclude') {
      overrides[key] = normalizeListSetting(rawValue) as never
      return
    }

    if (key === 'seed') {
      overrides[key] = normalizeSeedSetting(rawValue) as never
      return
    }

    overrides[key as keyof GallerySettingsOverride] = rawValue as never
  })

  return {
    images: parseExplicitMediaList(app, mediaLines.join('\n'), sourcePath),
    overrides,
    hasMediaLines: mediaLines.length > 0,
  }
}

const failMediaLookup = (container: HTMLElement, error: string): TFile[] => {
  if (galleryRuntimeSettings.showPathErrors) {
    renderError(container, error)
    throw new Error(error)
  }
  return []
}

export const getCandidateMediaFiles = (plugin: MediaCacheHost, container: HTMLElement, settings: GallerySettings): TFile[] => {
  const requestedPath = settings.path
  const shouldSearchEverywhere = isSearchEverywherePath(requestedPath)
  const usesPathGlob = isRecursiveGlobPath(requestedPath) || isShallowGlobPath(requestedPath)
  const usesFlexiblePattern = Boolean(
    galleryRuntimeSettings.enableFlexiblePathPatterns
      && requestedPath
      && hasWildcardPattern(requestedPath)
      && !shouldSearchEverywhere
      && !usesPathGlob,
  )
  const scopePath = requestedPath ? getPatternScopePath(requestedPath) : undefined

  if (!shouldSearchEverywhere && scopePath) {
    const scopeFolder = plugin.app.vault.getAbstractFileByPath(scopePath)
    if (!(scopeFolder instanceof TFolder)) {
      const error = `Invalid path: ${scopePath}`
      return failMediaLookup(container, error)
    }
  }

  let files: TFile[] = []
  if (shouldSearchEverywhere) {
    files = plugin.getCachedMediaFiles()
  } else if (usesPathGlob && requestedPath) {
    files = plugin.getCachedMediaFiles(requestedPath)
  } else if (usesFlexiblePattern) {
    files = scopePath ? plugin.getCachedMediaFiles(scopePath) : plugin.getCachedMediaFiles()
  } else if (requestedPath) {
    const folder = plugin.app.vault.getAbstractFileByPath(requestedPath)
    if (!(folder instanceof TFolder)) {
      const error = `Invalid path: ${requestedPath}`
      return failMediaLookup(container, error)
    }
    files = plugin.getCachedMediaFiles(folder.path)
  }

  let mediaFiles = files.filter((file) => isVaultMedia(file))
  if (usesFlexiblePattern && requestedPath) {
    const pathMatcher = createPathPatternMatcher(requestedPath, true)
    mediaFiles = mediaFiles.filter((file) => pathMatcher(file.path))
  }

  mediaFiles = mediaFiles.filter(createMediaItemFilter(settings))

  if (!mediaFiles.length) {
    const error = shouldSearchEverywhere
      ? 'No media found in the vault!'
      : (usesPathGlob || usesFlexiblePattern) && requestedPath
        ? `No media matched path: ${requestedPath}`
        : requestedPath
          ? `No media found in folder: ${requestedPath}`
          : 'No media found in the current gallery.'
    return failMediaLookup(container, error)
  }

  return mediaFiles
}

export const getImagesList = (plugin: MediaCacheHost, container: HTMLElement, settings: GallerySettings): MediaEntry[] => {
  const mediaFiles = getCandidateMediaFiles(plugin, container, settings)
  let orderedImages = [...mediaFiles]

  if (settings.sortby === 'rand' || settings.sortby === 'random') {
    orderedImages = applyMediaOrderingAndLimit(orderedImages, settings)
  } else {
    orderedImages.sort((a, b) => {
      if (settings.sortby === 'name') {
        const refA = a.name.toUpperCase()
        const refB = b.name.toUpperCase()
        return refA < refB ? -1 : refA > refB ? 1 : 0
      }

      const statKey = settings.sortby === 'mtime' ? 'mtime' : 'ctime'
      const refA = a.stat[statKey]
      const refB = b.stat[statKey]
      return refA < refB ? -1 : refA > refB ? 1 : 0
    })

    if (settings.sort !== 'asc') orderedImages.reverse()
    orderedImages = applyMediaLimit(orderedImages, settings.limit)
  }

  return orderedImages.map((file) => createMediaEntry(plugin.app, file))
}

export default getImagesList
