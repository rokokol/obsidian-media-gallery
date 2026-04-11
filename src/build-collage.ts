import type { App } from 'obsidian'
import { appendPreviewMedia, applyMediaFigureAttrs } from './media-preview'
import setCssProps from './set-css-props'
import type { GallerySettings, MediaEntry } from './types'

const applyCollageFigureLayout = (figure: HTMLElement, imagesCount: number, index: number): void => {
  if (imagesCount === 1) {
    setCssProps(figure, { 'aspect-ratio': '16 / 10' })
    return
  }

  if (imagesCount === 2) {
    setCssProps(figure, { 'aspect-ratio': '4 / 3' })
    return
  }

  if (imagesCount === 3) {
    if (index === 0) {
      setCssProps(figure, {
        'grid-row': 'span 2',
        'aspect-ratio': '4 / 5',
      })
    } else {
      setCssProps(figure, { 'aspect-ratio': '4 / 3' })
    }
    return
  }

  if (imagesCount === 5) {
    if (index === 0) {
      setCssProps(figure, {
        'grid-column': 'span 2',
        'grid-row': 'span 2',
        'aspect-ratio': '16 / 10',
      })
    } else {
      setCssProps(figure, { 'aspect-ratio': '4 / 3' })
    }
    return
  }

  if (imagesCount >= 6 && index === 0) {
    setCssProps(figure, {
      'grid-column': 'span 2',
      'grid-row': 'span 2',
      'aspect-ratio': '16 / 10',
    })
    return
  }

  setCssProps(figure, { 'aspect-ratio': '4 / 3' })
}

const buildCollage = (app: App, container: HTMLElement, imagesList: MediaEntry[], settings: GallerySettings): HTMLElement => {
  const gallery = container.createEl('div')
  const imagesCount = imagesList.length
  gallery.addClass('grid-wrapper')

  let gridTemplateColumns = 'repeat(3, minmax(0, 1fr))'
  if (imagesCount === 1) gridTemplateColumns = 'minmax(0, 1fr)'
  else if (imagesCount === 2) gridTemplateColumns = 'repeat(2, minmax(0, 1fr))'
  else if (imagesCount === 3) gridTemplateColumns = '1.35fr 1fr'
  else if (imagesCount === 4) gridTemplateColumns = 'repeat(2, minmax(0, 1fr))'

  setCssProps(gallery, {
    display: 'grid',
    'grid-template-columns': gridTemplateColumns,
    'grid-auto-rows': `${Math.max(150, Math.round(settings.height * 0.72))}px`,
    gap: `${settings.gutter}px`,
  })

  imagesList.forEach((file, index) => {
    const figure = gallery.createEl('figure')
    figure.addClass('grid-item')
    setCssProps(figure, {
      margin: '0',
      'border-radius': `${settings.radius}px`,
      overflow: 'hidden',
      'background-color': 'var(--background-secondary)',
      cursor: 'pointer',
    })
    applyCollageFigureLayout(figure, imagesCount, index)
    applyMediaFigureAttrs(figure, file)
    void appendPreviewMedia(app, figure, file, settings)
  })

  return gallery
}

export default buildCollage
