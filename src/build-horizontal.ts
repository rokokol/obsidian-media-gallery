import type { App } from 'obsidian'
import { appendPreviewMedia, applyMediaFigureAttrs } from './media-preview'
import setCssProps from './set-css-props'
import type { GallerySettings, MediaEntry } from './types'

const buildHorizontal = (app: App, container: HTMLElement, imagesList: MediaEntry[], settings: GallerySettings): HTMLElement => {
  const gallery = container.createEl('div')
  gallery.addClass('grid-wrapper')
  gallery.addClass('media-gallery-grid-wrapper')
  gallery.addClass('media-gallery-grid-wrapper--horizontal')
  setCssProps(gallery, {
    '--media-gallery-gutter': `${settings.gutter}px`,
  })

  imagesList.forEach((file) => {
    const figure = gallery.createEl('figure')
    figure.addClass('grid-item')
    figure.addClass('media-gallery-grid-item')
    figure.addClass('media-gallery-grid-item--horizontal')
    setCssProps(figure, {
      '--media-gallery-gutter': `${settings.gutter}px`,
      '--media-gallery-height': `${settings.height}px`,
      '--media-gallery-radius': `${settings.radius}px`,
    })
    applyMediaFigureAttrs(figure, file)
    const media = appendPreviewMedia(app, figure, file, settings)
    setCssProps(media, { 'border-radius': '0px' })
  })

  return gallery
}

export default buildHorizontal
