import { Platform } from 'obsidian'
import type { App, Component } from 'obsidian'
import { getAudioArtworkUrl, getAudioMetadata, getAudioSpectrogram, getAudioSubtitle, getAudioWaveform, getMediaDisplayName, getVideoMimeType } from './get-imgs-list'
import { galleryRuntimeSettings } from './runtime-settings'
import setCssProps from './set-css-props'
import type { GallerySettings, MediaEntry } from './types'

// Time (seconds) to seek to before grabbing the poster frame. A tiny non-zero
// offset dodges the occasional black frame some encoders put at exactly 0s.
const POSTER_SEEK_TIME = 0.1
// Any sliver of visibility is enough to warrant capturing the poster.
const POSTER_CAPTURE_VISIBILITY = 0.01
// Prefetch margin so the poster is captured just before a tile scrolls in.
const POSTER_PREFETCH_MARGIN = '200px'

const logMediaError = (error: unknown): void => {
  console.error('Media Gallery', error)
}

// Skeleton placeholder class kept on the figure until the media has painted.
const LOADING_CLASS = 'media-gallery-loading'

const trackMediaLoading = (figure: HTMLElement, media: HTMLElement, readyEvent: string): void => {
  figure.addClass(LOADING_CLASS)
  const clear = (): void => {
    figure.removeClass(LOADING_CLASS)
  }
  media.addEventListener(readyEvent, clear, { once: true })
  media.addEventListener('error', clear, { once: true })
}

// Paint a real poster for a mobile video preview. Mobile webviews only decode a
// frame once the video actually plays, so a `#t=` src fragment leaves a native
// placeholder (the "black triangle") until first playback. A programmatic seek
// forces the decode, and the decoded frame is snapshotted into `video.poster`
// so it survives pause/reset even when autoplay is blocked (low-power/data-saver).
export const capturePoster = (video: HTMLVideoElement): void => {
  // `posterState` doubles as a guard so the observer never re-captures a tile.
  if (video.dataset.posterState) return
  video.dataset.posterState = 'pending'

  const snapshot = (): void => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx || !canvas.width || !canvas.height) {
        video.dataset.posterState = 'failed'
        return
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      video.poster = canvas.toDataURL('image/jpeg', 0.7)
      video.dataset.posterState = 'done'
    } catch (error) {
      // Tainted canvas or an unsupported codec: leave the native preview as-is.
      video.dataset.posterState = 'failed'
      logMediaError(error)
    }
  }

  const seek = (): void => {
    video.addEventListener('seeked', snapshot, { once: true })
    // Nudge the pipeline; clamp so we never seek past a very short clip.
    video.currentTime = Math.min(POSTER_SEEK_TIME, Math.max(0, (video.duration || POSTER_SEEK_TIME) - 0.01))
  }

  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    seek()
  } else {
    video.addEventListener('loadedmetadata', seek, { once: true })
  }
}

// One IntersectionObserver per gallery. Mobile has no hover, so instead of
// autoplaying grid videos (distracting, battery-hungry) each tile lazily captures
// a static poster frame as it nears the viewport (see capturePoster); tapping a
// tile opens the full-screen player. Capturing on scroll — rather than all at
// once — keeps us under the platform's simultaneous-decode limit. Returns null on
// desktop, where hover-to-play is used instead.
export const createVideoPreviewObserver = (component: Component): IntersectionObserver | null => {
  if (!Platform.isMobile) return null

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const video = entry.target as HTMLVideoElement
        capturePoster(video)
        // Poster is a one-shot: stop observing once it is settled.
        observer.unobserve(video)
      })
    },
    { threshold: POSTER_CAPTURE_VISIBILITY, rootMargin: POSTER_PREFETCH_MARGIN },
  )

  component.register(() => { observer.disconnect(); })
  return observer
}

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
  if (!values?.length) return

  values.forEach((value) => {
    const bar = container.createEl('span', { cls: 'img-gallery-audio-waveform-bar' })
    setCssProps(bar, {
      height: `${Math.max(8, Math.round(value * 44))}px`,
    })
  })
}

const renderSpectrogram = (container: HTMLElement, values: number[][] | null): void => {
  container.empty()
  if (!values?.length) return

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
    void getAudioSpectrogram(app, file, true)
      .then((values) => { renderSpectrogram(spectrogram, values); })
      .catch(logMediaError)
    return
  }

  if (!settings.waveform) return

  const waveform = meta.createEl('div', { cls: 'img-gallery-audio-waveform' })
  void getAudioWaveform(app, file, true)
    .then((values) => { renderWaveform(waveform, values); })
    .catch(logMediaError)
}

const fillAudioPreviewMetadata = (app: App, file: MediaEntry, nameEl: HTMLElement, subtitleEl: HTMLElement): void => {
  void getAudioMetadata(app, file)
    .then((metadata) => {
      nameEl.setText(metadata?.title || getMediaDisplayName(file))
      subtitleEl.setText(getAudioSubtitle(metadata))
      subtitleEl.toggleClass('is-empty', !subtitleEl.getText())
    })
    .catch(logMediaError)
}

const fillAudioPreviewArtwork = (app: App, file: MediaEntry, cover: HTMLElement): void => {
  void getAudioArtworkUrl(app, file)
    .then((artworkUrl) => {
      if (!artworkUrl) return
      cover.empty()
      const img = cover.createEl('img', { cls: 'img-gallery-audio-cover-image' })
      img.src = artworkUrl
      img.alt = file.name
    })
    .catch(logMediaError)
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

export const appendPreviewMedia = (
  app: App,
  figure: HTMLElement,
  file: MediaEntry,
  settings: GallerySettings,
  component: Component,
  videoObserver: IntersectionObserver | null,
): HTMLElement => {
  if (file.kind === 'video') {
    figure.addClass('img-gallery-video-item')
    const video = figure.createEl('video')
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'metadata'
    // Metadata is enough for the poster capture to seek and snapshot the first
    // frame (see capturePoster); no #t= fragment needed.
    video.src = file.uri
    video.setAttribute('data-mime', getVideoMimeType(file.path))
    setCssProps(video, {
      width: '100%',
      height: '100%',
      'object-fit': settings.fit || 'cover',
      'object-position': 'center center',
      display: 'block',
    })

    trackMediaLoading(figure, video, 'loadeddata')

    if (Platform.isMobile) {
      // No hover on touch devices: show a static poster (captured via the shared
      // observer) and defer playback to the full-screen player opened on tap.
      videoObserver?.observe(video)
    } else {
      component.registerDomEvent(video, 'mouseenter', () => {
        void video.play().catch(() => {})
      })
      component.registerDomEvent(video, 'mouseleave', () => {
        video.pause()
        video.currentTime = 0
      })
    }
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
  trackMediaLoading(figure, img, 'load')
  return img
}
