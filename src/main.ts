import { App, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian'
import type { ToggleComponent } from 'obsidian'
import { cleanupMediaModals } from './build-lightbox'
import { clearAudioCaches, isSearchEverywherePath, isShallowGlobPath, isVaultMedia, normalizeMediaSearchPath } from './get-imgs-list'
import { ImgGalleryInit } from './init'
import { DEFAULT_PLUGIN_SETTINGS, galleryRuntimeSettings } from './runtime-settings'
import type { MediaCacheHost, MediaGalleryPluginSettings } from './types'

type LoadedSettings = Partial<MediaGalleryPluginSettings> & {
  enableSpectrogram?: boolean
}

class ImgGallerySettingTab extends PluginSettingTab {
  plugin: ImgGallery

  constructor(app: App, plugin: ImgGallery) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    new Setting(containerEl)
      .setName('Performance')
      .setHeading()

    new Setting(containerEl)
      .setName('Enable cache')
      .setDesc('Caches the vault media list and per-folder lookups in memory. Disable this if the plugin uses too much RAM; galleries will rescan files on each render.')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.enableCache)
        .onChange(async (value) => {
          this.plugin.settings.enableCache = value
          galleryRuntimeSettings.enableCache = value
          this.plugin.invalidateImageCache()
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('Paths')
      .setHeading()

    new Setting(containerEl)
      .setName('Show path and empty-gallery errors')
      .setDesc('When enabled, invalid paths and empty gallery lookups render an inline error. When disabled, the block stays empty instead.')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.showPathErrors)
        .onChange(async (value) => {
          this.plugin.settings.showPathErrors = value
          galleryRuntimeSettings.showPathErrors = value
          await this.plugin.saveSettings()
        }))

    let wildcardFileNameToggle: ToggleComponent | null = null
    const syncWildcardFileNameToggle = (): void => {
      if (wildcardFileNameToggle === null) {
        return
      }

      const enabled = this.plugin.settings.enableFlexiblePathPatterns
      wildcardFileNameToggle.setTooltip(enabled ? '' : 'Enable flexible path patterns first')
      wildcardFileNameToggle.setDisabled(!enabled)
      wildcardFileNameToggle.setValue(enabled && this.plugin.settings.matchWildcardsAgainstFileNames)
    }

    new Setting(containerEl)
      .setName('Enable flexible path patterns')
      .setDesc('Allows wildcard patterns like `media/**/concert*` and `media/2025-??`. Regular paths, `folder/*`, and `folder/**` stay on the fast path either way.')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.enableFlexiblePathPatterns)
        .onChange(async (value) => {
          this.plugin.settings.enableFlexiblePathPatterns = value
          galleryRuntimeSettings.enableFlexiblePathPatterns = value
          if (!value) {
            this.plugin.settings.matchWildcardsAgainstFileNames = false
            galleryRuntimeSettings.matchWildcardsAgainstFileNames = false
          }
          syncWildcardFileNameToggle()
          this.plugin.invalidateImageCache()
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('Match wildcards against file names')
      .setDesc('When enabled, flexible wildcard patterns match file names while the directory part only narrows the search scope. This option is available only when flexible path patterns are enabled.')
      .addToggle((toggle) => {
        wildcardFileNameToggle = toggle
        syncWildcardFileNameToggle()
        return toggle.onChange(async (value) => {
          if (!this.plugin.settings.enableFlexiblePathPatterns) {
            return
          }
          this.plugin.settings.matchWildcardsAgainstFileNames = value
          galleryRuntimeSettings.matchWildcardsAgainstFileNames = value
          this.plugin.invalidateImageCache()
          await this.plugin.saveSettings()
        })
      })

    new Setting(containerEl)
      .setName('Audio')
      .setHeading()

    new Setting(containerEl)
      .setName('Enable audio visualizations')
      .setDesc('Enables audio waveform and spectrogram rendering inside gallery blocks. If disabled, audio cards show only metadata and cover art.')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.enableAudioVisualizations)
        .onChange(async (value) => {
          this.plugin.settings.enableAudioVisualizations = value
          galleryRuntimeSettings.enableAudioVisualizations = value
          this.plugin.invalidateImageCache()
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('Autoplay audio on open')
      .setDesc('Starts audio playback automatically when you open an audio card.')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoplayAudioOnOpen)
        .onChange(async (value) => {
          this.plugin.settings.autoplayAudioOnOpen = value
          galleryRuntimeSettings.autoplayAudioOnOpen = value
          await this.plugin.saveSettings()
        }))
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export default class ImgGallery extends Plugin implements MediaCacheHost {
  settings: MediaGalleryPluginSettings = { ...DEFAULT_PLUGIN_SETTINGS }
  _cachedMediaFiles: TFile[] | null = null
  _cachedMediaFolders = new Map<string, TFile[]>()

  async loadSettings(): Promise<void> {
    const rawLoaded: unknown = await this.loadData()
    const loaded: LoadedSettings = isRecord(rawLoaded) ? rawLoaded as LoadedSettings : {}

    this.settings = {
      ...DEFAULT_PLUGIN_SETTINGS,
      ...loaded,
    }

    if (typeof loaded.enableAudioVisualizations === 'undefined' && typeof loaded.enableSpectrogram !== 'undefined') {
      this.settings.enableAudioVisualizations = loaded.enableSpectrogram
    }

    galleryRuntimeSettings.enableCache = this.settings.enableCache
    galleryRuntimeSettings.enableAudioVisualizations = this.settings.enableAudioVisualizations
    galleryRuntimeSettings.autoplayAudioOnOpen = this.settings.autoplayAudioOnOpen
    galleryRuntimeSettings.enableFlexiblePathPatterns = this.settings.enableFlexiblePathPatterns
    galleryRuntimeSettings.matchWildcardsAgainstFileNames = this.settings.enableFlexiblePathPatterns && this.settings.matchWildcardsAgainstFileNames
    galleryRuntimeSettings.showPathErrors = this.settings.showPathErrors
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings)
  }

  async onload(): Promise<void> {
    await this.loadSettings()
    this.invalidateImageCache()

    this.addSettingTab(new ImgGallerySettingTab(this.app, this))
    this.registerEvent(this.app.vault.on('create', () => this.invalidateImageCache()))
    this.registerEvent(this.app.vault.on('delete', () => this.invalidateImageCache()))
    this.registerEvent(this.app.vault.on('rename', () => this.invalidateImageCache()))

    const registerGalleryBlock = (blockType: string): void => {
      this.registerMarkdownCodeBlockProcessor(blockType, (src, el, ctx) => {
        const handler = new ImgGalleryInit(this, src, el, this.app, ctx.sourcePath)
        ctx.addChild(handler)
      })
    }

    registerGalleryBlock('img-gallery')
    registerGalleryBlock('img-gal')
    registerGalleryBlock('media-gallery')
  }

  invalidateImageCache(): void {
    this._cachedMediaFiles = null
    this._cachedMediaFolders = new Map<string, TFile[]>()
    clearAudioCaches()
  }

  getCachedMediaFiles(path?: string): TFile[] {
    if (!this.settings.enableCache) {
      const allMediaFiles = this.app.vault.getFiles().filter((file) => isVaultMedia(file))
      if (isSearchEverywherePath(path)) {
        return allMediaFiles
      }

      const normalizedPath = normalizeMediaSearchPath(path ?? '')
      if (isShallowGlobPath(path)) {
        return allMediaFiles.filter((file) => file.parent?.path === normalizedPath)
      }

      const prefix = `${normalizedPath}/`
      return allMediaFiles.filter((file) => file.path.startsWith(prefix))
    }

    if (!this._cachedMediaFiles) {
      this._cachedMediaFiles = this.app.vault.getFiles().filter((file) => isVaultMedia(file))
    }

    if (isSearchEverywherePath(path)) {
      return this._cachedMediaFiles
    }

    const normalizedPath = normalizeMediaSearchPath(path ?? '')
    const cacheKey = isShallowGlobPath(path) ? `${normalizedPath}/*` : normalizedPath
    const cached = this._cachedMediaFolders.get(cacheKey)
    if (cached) {
      return cached
    }

    if (isShallowGlobPath(path)) {
      const shallowFiltered = this._cachedMediaFiles.filter((file) => file.parent?.path === normalizedPath)
      this._cachedMediaFolders.set(cacheKey, shallowFiltered)
      return shallowFiltered
    }

    const prefix = `${normalizedPath}/`
    const filtered = this._cachedMediaFiles.filter((file) => file.path.startsWith(prefix))
    this._cachedMediaFolders.set(cacheKey, filtered)
    return filtered
  }

  getCachedImageFiles(path?: string): TFile[] {
    return this.getCachedMediaFiles(path)
  }

  onunload(): void {
    this.invalidateImageCache()
    cleanupMediaModals()
  }
}
