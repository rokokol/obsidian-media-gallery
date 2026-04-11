import type { App, Plugin, TFile } from 'obsidian'

export type MediaKind = 'image' | 'video' | 'audio'
export type GalleryLayout = 'horizontal' | 'vertical' | 'mosaic' | 'collage'
export type GallerySortBy = 'name' | 'mtime' | 'ctime' | 'rand' | 'random'
export type GallerySortDirection = 'asc' | 'desc'
export type GalleryFit = 'cover' | 'contain'

export interface GallerySettings {
  path?: string
  type: GalleryLayout
  radius: number
  gutter: number
  sortby: GallerySortBy
  sort: GallerySortDirection
  fit: GalleryFit
  waveform: boolean
  spectrogram: boolean
  extensions: string[]
  exclude: string[]
  limit: number
  seed?: string
  mobile: number
  columns: number
  height: number
}

export interface GallerySettingsInput {
  path?: unknown
  type?: unknown
  radius?: unknown
  gutter?: unknown
  sortby?: unknown
  sort?: unknown
  fit?: unknown
  waveform?: unknown
  spectrogram?: unknown
  extensions?: unknown
  exclude?: unknown
  limit?: unknown
  seed?: unknown
  mobile?: unknown
  columns?: unknown
  height?: unknown
}

export type GallerySettingsOverride = Partial<GallerySettings>

export interface AudioMetadata {
  artworkUrl: string | null
  title: string | null
  artist: string | null
  album: string | null
}

export interface MediaEntry {
  name: string
  folder: string
  path: string
  uri: string
  kind: MediaKind
  vaultFile?: TFile
}

export interface MediaGalleryPluginSettings {
  enableCache: boolean
  enableAudioVisualizations: boolean
  autoplayAudioOnOpen: boolean
  enableFlexiblePathPatterns: boolean
  matchWildcardsAgainstFileNames: boolean
  showPathErrors: boolean
}

export type RuntimeSettings = MediaGalleryPluginSettings

export interface MediaCacheHost extends Plugin {
  app: App
  settings: MediaGalleryPluginSettings
  _cachedMediaFiles: TFile[] | null
  _cachedMediaFolders: Map<string, TFile[]>
  invalidateImageCache: () => void
  getCachedMediaFiles: (path?: string) => TFile[]
}

export interface LightGalleryCollection {
  append: (html: string) => void
  on: (eventName: string, listener: () => void) => void
  first?: () => LightGalleryCollection
  get?: () => HTMLElement
}

export interface LightGalleryOuter {
  addClass: (className: string) => void
  find: (selector: string) => LightGalleryCollection
  get: () => HTMLElement
}

export interface LightGalleryEventHub {
  on: (eventName: string, listener: () => void) => void
}

export interface LightGalleryInstance {
  destroy: () => void
  closeGallery: () => void
  index: number
  outer: LightGalleryOuter
  LGel: LightGalleryEventHub
  __imgGalleryDestroyZoom?: (() => void) | null
}

export interface LightGalleryInitEvent extends CustomEvent {
  detail: {
    instance: LightGalleryInstance
  }
}

export interface MediaModalController {
  open: (file: MediaEntry) => void
  destroy: () => void
}
