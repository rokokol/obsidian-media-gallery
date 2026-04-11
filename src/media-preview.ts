import type { App } from 'obsidian'
import { getAudioArtworkUrl, getAudioMetadata, getAudioMimeType, getAudioSpectrogram, getAudioSubtitle, getAudioWaveform, getMediaDisplayName, getVideoMimeType } from './get-imgs-list'
import { galleryRuntimeSettings } from './runtime-settings'
import setCssProps from './set-css-props'
import type { GallerySettings, MediaEntry } from './types'

export const applyMediaFigureAttrs = (figure: HTMLElement, file: MediaEntry): void => {
  figure.setAttribute('data-name', file.name)
  figure.setAttribute('data-folder', file.folder)
  figure.setAttribute('data-path', file.path)
  figure.setAttribute('data-media-kind', file.kind)
  if (file.kind === 'image') {
    figure.setAttribute('data-src', file.uri)
  }
}

const renderWaveform = (container: HTMLElement, values: number[] | null): void => {
  container.empty()
  if (!values || !values.length) return

  values.forEach((value) => {
    const bar = container.createEl('span', { cls: 'img-gallery-audio-waveform-bar' })
    setCssProps(bar, {
      height: `${Math.max(8, Math.round(value * 44))}px`,
    })
  })
}

const renderSpectrogram = (container: HTMLElement, values: number[][] | null): void => {
  container.empty()
  if (!values || !values.length) return

  const canvas = container.createEl('canvas', { cls: 'img-gallery-audio-spectrogram-canvas' })
  const columns = values.length
  const rows = Math.max(...values.map((column) => column.length), 1)
  const cssWidth = Math.max(180, columns * 5)
  const cssHeight = 56
  const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

  canvas.width = Math.round(cssWidth * pixelRatio)
  canvas.height = Math.round(cssHeight * pixelRatio)
  setCssProps(canvas, {
    width: `${cssWidth}px`,
    height: `${cssHeight}px`,
  })

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const accentColor = getComputedStyle(document.body).getPropertyValue('--interactive-accent').trim() || '#7c3aed'
  ctx.scale(pixelRatio, pixelRatio)
  ctx.clearRect(0, 0, cssWidth, cssHeight)
  ctx.fillStyle = accentColor

  const gap = 1
  const columnWidth = Math.max(2, (cssWidth - gap * Math.max(0, columns - 1)) / columns)
  const rowHeight = Math.max(2, (cssHeight - gap * Math.max(0, rows - 1)) / rows)

  values.forEach((column, columnIndex) => {
    column.forEach((level, rowIndex) => {
      const intensity = Math.max(0.06, Math.min(1, level))
      const alpha = 0.14 + intensity * 0.86
      const x = columnIndex * (columnWidth + gap)
      const y = cssHeight - rowHeight - rowIndex * (rowHeight + gap)
      const inset = intensity < 0.14 ? 0.6 : 0
      ctx.globalAlpha = alpha
      ctx.fillRect(x + inset, y + inset, Math.max(1, columnWidth - inset * 2), Math.max(1, rowHeight - inset * 2))
    })
  })

  ctx.globalAlpha = 1
}

const appendAudioVisualization = (app: App, meta: HTMLElement, file: MediaEntry, settings: GallerySettings): void => {
  if (!galleryRuntimeSettings.enableAudioVisualizations) return

  if (settings.spectrogram) {
    const spectrogram = meta.createEl('div', { cls: 'img-gallery-audio-spectrogram' })
    void getAudioSpectrogram(app, file, true).then((values) => {
      renderSpectrogram(spectrogram, values)
    })
    return
  }

  if (!settings.waveform) return

  const waveform = meta.createEl('div', { cls: 'img-gallery-audio-waveform' })
  void getAudioWaveform(app, file, true).then((values) => {
    renderWaveform(waveform, values)
  })
}

const fillAudioPreviewMetadata = (app: App, file: MediaEntry, nameEl: HTMLElement, subtitleEl: HTMLElement): void => {
  void getAudioMetadata(app, file).then((metadata) => {
    nameEl.setText(metadata?.title || getMediaDisplayName(file))
    subtitleEl.setText(getAudioSubtitle(metadata))
    subtitleEl.toggleClass('is-empty', !subtitleEl.getText())
  })
}

const fillAudioPreviewArtwork = (app: App, file: MediaEntry, cover: HTMLElement): void => {
  void getAudioArtworkUrl(app, file).then((artworkUrl) => {
    if (!artworkUrl) return
    cover.empty()
    const img = cover.createEl('img', { cls: 'img-gallery-audio-cover-image' })
    img.src = artworkUrl
    img.alt = file.name
  })
}

const appendAudioPreview = (app: App, figure: HTMLElement, file: MediaEntry, settings: GallerySettings): HTMLElement => {
  figure.addClass('img-gallery-audio-item')
  const audioCard = figure.createEl('div', { cls: 'img-gallery-audio-card' })
  const cover = audioCard.createEl('div', { cls: 'img-gallery-audio-cover' })
  cover.createEl('div', { cls: 'img-gallery-audio-icon', text: '♪' })
  const meta = audioCard.createEl('div', { cls: 'img-gallery-audio-meta' })
  const nameEl = meta.createEl('div', { cls: 'img-gallery-audio-name', text: getMediaDisplayName(file) })
  const subtitleEl = meta.createEl('div', { cls: 'img-gallery-audio-subtitle is-empty' })
  meta.createEl('div', { cls: 'img-gallery-audio-kind', text: (file.path.split('.').pop() || 'audio').toUpperCase() })

  appendAudioVisualization(app, meta, file, settings)
  fillAudioPreviewMetadata(app, file, nameEl, subtitleEl)
  fillAudioPreviewArtwork(app, file, cover)

  return audioCard
}

export const appendPreviewMedia = (app: App, figure: HTMLElement, file: MediaEntry, settings: GallerySettings): HTMLElement => {
  if (file.kind === 'video') {
    figure.addClass('img-gallery-video-item')
    const video = figure.createEl('video')
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = file.uri
    video.setAttribute('data-mime', getVideoMimeType(file.path))
    setCssProps(video, {
      width: '100%',
      height: '100%',
      'object-fit': settings.fit || 'cover',
      'object-position': 'center center',
      display: 'block',
    })
    video.addEventListener('mouseenter', () => {
      void video.play().catch(() => {})
    })
    video.addEventListener('mouseleave', () => {
      video.pause()
      video.currentTime = 0
    })
    return video
  }

  if (file.kind === 'audio') {
    return appendAudioPreview(app, figure, file, settings)
  }

  const img = figure.createEl('img')
  img.src = file.uri
  setCssProps(img, {
    width: '100%',
    height: '100%',
    'object-fit': settings.fit || 'cover',
    'object-position': 'center center',
    display: 'block',
  })
  return img
}

export const getResolvedAudioMimeType = getAudioMimeType
