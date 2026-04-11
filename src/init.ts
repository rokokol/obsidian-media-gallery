import { App, MarkdownRenderChild } from 'obsidian'
import buildCollage from './build-collage'
import buildHorizontal from './build-horizontal'
import buildLightbox from './build-lightbox'
import buildVertical from './build-vertical'
import { applyMediaOrderingAndLimit, createMediaEntry, getCandidateMediaFiles, getImagesList, mergeMediaEntries, parseExplicitBlock } from './get-imgs-list'
import { getDefaultGallerySettings, getSettings } from './get-settings'
import renderError from './render-error'
import { galleryRuntimeSettings } from './runtime-settings'
import type ImgGallery from './main'
import type { GallerySettings, LightGalleryInstance, MediaEntry } from './types'

export class ImgGalleryInit extends MarkdownRenderChild {
  private gallery: HTMLElement | null = null
  private lightbox: LightGalleryInstance | null = null
  private settings: GallerySettings | null = null
  private imagesList: MediaEntry[] = []

  constructor(
    public plugin: ImgGallery,
    public src: string,
    public container: HTMLElement,
    public app: App,
    public sourcePath: string,
  ) {
    super(container)
  }

  onload(): void {
    try {
      if (!this.src.trim()) {
        if (galleryRuntimeSettings.showPathErrors) {
          renderError(this.container, 'Nothing to show in this gallery block.')
        }
        return
      }

      const explicitBlock = parseExplicitBlock(this.app, this.src, this.sourcePath)
      const explicitImages = explicitBlock.images
      const hasExplicitPath = typeof explicitBlock.overrides.path !== 'undefined'

      if (explicitImages.length || hasExplicitPath) {
        this.settings = getDefaultGallerySettings('vertical')
        this.settings.radius = 10
        Object.assign(this.settings, explicitBlock.overrides)
        if (this.settings.type === 'collage') {
          this.settings.type = 'mosaic'
        }

        const pathImages = hasExplicitPath && this.settings.path
          ? getCandidateMediaFiles(this.plugin, this.container, this.settings).map((file) => createMediaEntry(this.app, file))
          : []

        this.imagesList = applyMediaOrderingAndLimit(mergeMediaEntries(pathImages, explicitImages), this.settings)
      } else {
        this.settings = getSettings(this.src, this.container)
        if (!this.settings.path) {
          if (galleryRuntimeSettings.showPathErrors) {
            renderError(this.container, 'Nothing to show in this gallery block.')
          }
          return
        }
        this.imagesList = getImagesList(this.plugin, this.container, this.settings)
      }

      if (!this.imagesList.length || !this.settings) {
        if (galleryRuntimeSettings.showPathErrors) {
          renderError(this.container, 'Nothing to show in this gallery block.')
        }
        return
      }

      if (this.settings.type === 'horizontal') {
        this.gallery = buildHorizontal(this.app, this.container, this.imagesList, this.settings)
      } else if (this.settings.type === 'mosaic' || this.settings.type === 'collage') {
        this.gallery = buildCollage(this.app, this.container, this.imagesList, this.settings)
      } else {
        this.gallery = buildVertical(this.app, this.container, this.imagesList, this.settings)
      }

      this.lightbox = buildLightbox(this.gallery, this.imagesList, this.app)
    } catch (error) {
      console.error('Media Gallery', error)
    }
  }

  onunload(): void {
    if (this.gallery) {
      this.gallery.remove()
      this.gallery = null
    }

    if (this.lightbox) {
      this.lightbox.__imgGalleryDestroyZoom?.()
      this.lightbox.destroy()
      this.lightbox = null
    }
  }
}
