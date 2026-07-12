import type { App, Component } from 'obsidian'
import { appendPreviewMedia, applyMediaFigureAttrs, createVideoAutoplayObserver } from './media-preview'
import setCssProps from './set-css-props'
import type { GallerySettings, MediaEntry } from './types'

const buildVertical = (app: App, container: HTMLElement, imagesList: MediaEntry[], settings: GallerySettings, component: Component): HTMLElement => {
  const videoObserver = createVideoAutoplayObserver(component)
  const gallery = container.createEl('div')
  gallery.addClass('grid-wrapper')
  gallery.addClass('media-gallery-grid-wrapper')
  gallery.addClass('media-gallery-grid-wrapper--vertical')
  setCssProps(gallery, {
    '--media-gallery-columns': settings.columns,
    '--media-gallery-gutter': `${settings.gutter}px`,
  })

  imagesList.forEach((file) => {
    const figure = gallery.createEl('div')
    figure.addClass('grid-item')
    figure.addClass('media-gallery-grid-item')
    figure.addClass('media-gallery-grid-item--vertical')
    setCssProps(figure, {
      '--media-gallery-gutter': `${settings.gutter}px`,
      display: 'inline-block',
      'break-inside': 'avoid',
      '-webkit-column-break-inside': 'avoid',
      'box-sizing': 'border-box',
    })
    applyMediaFigureAttrs(figure, file)
    const media = appendPreviewMedia(app, figure, file, settings, component, videoObserver)
    setCssProps(media, { 'border-radius': `${settings.radius}px` })
  })

  return gallery
}

export default buildVertical
