import type { MediaGalleryPluginSettings, RuntimeSettings } from './types'

export const DEFAULT_PLUGIN_SETTINGS: MediaGalleryPluginSettings = {
  enableCache: true,
  enableAudioVisualizations: true,
  autoplayAudioOnOpen: true,
  enableFlexiblePathPatterns: true,
  matchWildcardsAgainstFileNames: true,
  showPathErrors: true,
}

export const galleryRuntimeSettings: RuntimeSettings = {
  ...DEFAULT_PLUGIN_SETTINGS,
}
