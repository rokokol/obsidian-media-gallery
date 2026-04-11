import { App, Platform, TFile } from 'obsidian'
import lightGallery from 'lightgallery'
import lgThumbnail from 'lightgallery/plugins/thumbnail'
import { getAudioArtworkUrl, getAudioMetadata, getAudioMimeType, getAudioSubtitle, getMediaDisplayName } from './get-imgs-list'
import { galleryRuntimeSettings } from './runtime-settings'
import setCssProps from './set-css-props'
import type { LightGalleryInitEvent, LightGalleryInstance, MediaEntry, MediaModalController } from './types'

let videoModalSingleton: MediaModalController | null = null
let audioModalSingleton: MediaModalController | null = null

const createVideoModal = (): MediaModalController => {
  let escHandler: ((event: KeyboardEvent) => void) | null = null
  const modal = document.body.createEl('div', { cls: 'img-gallery-video-modal img-gallery-video-modal-hidden' })
  const content = modal.createEl('div', { cls: 'img-gallery-video-modal-content' })
  const title = content.createEl('div', { cls: 'img-gallery-video-modal-title' })
  const close = content.createEl('button', { cls: 'img-gallery-video-modal-close', text: '×' })
  const video = content.createEl('video', { cls: 'img-gallery-video-modal-player' })
  video.controls = true
  video.playsInline = true
  video.preload = 'metadata'

  const closeModal = (): void => {
    video.pause()
    video.removeAttribute('src')
    video.load()
    modal.addClass('img-gallery-video-modal-hidden')
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal()
  })
  close.addEventListener('click', closeModal)
  escHandler = (event) => {
    if (event.key === 'Escape' && !modal.hasClass('img-gallery-video-modal-hidden')) {
      closeModal()
    }
  }
  document.addEventListener('keydown', escHandler)

  return {
    open: (file) => {
      title.setText(file.name)
      video.src = file.uri
      modal.removeClass('img-gallery-video-modal-hidden')
      void video.play().catch(() => {})
    },
    destroy: () => {
      if (escHandler) {
        document.removeEventListener('keydown', escHandler)
      }
      closeModal()
      modal.remove()
    },
  }
}

const getVideoModal = (): MediaModalController => {
  if (!videoModalSingleton) {
    videoModalSingleton = createVideoModal()
  }
  return videoModalSingleton
}

const createAudioModal = (app: App): MediaModalController => {
  let escHandler: ((event: KeyboardEvent) => void) | null = null
  let currentPath: string | null = null

  const modal = document.body.createEl('div', { cls: 'img-gallery-audio-modal img-gallery-audio-modal-hidden' })
  const content = modal.createEl('div', { cls: 'img-gallery-audio-modal-content' })
  const title = content.createEl('div', { cls: 'img-gallery-audio-modal-title' })
  const subtitle = content.createEl('div', { cls: 'img-gallery-audio-modal-subtitle is-empty' })
  const close = content.createEl('button', { cls: 'img-gallery-audio-modal-close', text: '×' })
  const cover = content.createEl('div', { cls: 'img-gallery-audio-modal-cover img-gallery-audio-modal-cover-empty' })
  const audio = content.createEl('audio', { cls: 'img-gallery-audio-modal-player' })
  audio.controls = true
  audio.preload = 'metadata'

  const closeModal = (): void => {
    currentPath = null
    audio.pause()
    audio.removeAttribute('src')
    audio.removeAttribute('type')
    audio.load()
    modal.addClass('img-gallery-audio-modal-hidden')
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal()
  })
  close.addEventListener('click', closeModal)
  escHandler = (event) => {
    if (event.key === 'Escape' && !modal.hasClass('img-gallery-audio-modal-hidden')) {
      closeModal()
    }
  }
  document.addEventListener('keydown', escHandler)

  return {
    open: (file) => {
      currentPath = file.path
      title.setText(getMediaDisplayName(file))
      subtitle.setText('')
      subtitle.addClass('is-empty')
      audio.src = file.uri
      audio.setAttribute('type', getAudioMimeType(file.path))
      audio.currentTime = 0
      cover.empty()
      cover.addClass('img-gallery-audio-modal-cover-empty')

      const activePath = file.path

      void getAudioMetadata(app, file).then((metadata) => {
        if (currentPath !== activePath) return
        title.setText(metadata?.title || getMediaDisplayName(file))
        subtitle.setText(getAudioSubtitle(metadata))
        subtitle.toggleClass('is-empty', !subtitle.getText())
      })

      void getAudioArtworkUrl(app, file).then((artworkUrl) => {
        if (currentPath !== activePath || !artworkUrl) return
        cover.removeClass('img-gallery-audio-modal-cover-empty')
        const img = cover.createEl('img', { cls: 'img-gallery-audio-modal-cover-image' })
        img.src = artworkUrl
        img.alt = file.name
      })

      modal.removeClass('img-gallery-audio-modal-hidden')
      if (galleryRuntimeSettings.autoplayAudioOnOpen) {
        void audio.play().catch(() => {})
      }
    },
    destroy: () => {
      if (escHandler) {
        document.removeEventListener('keydown', escHandler)
      }
      closeModal()
      modal.remove()
    },
  }
}

const getAudioModal = (app: App): MediaModalController => {
  if (!audioModalSingleton) {
    audioModalSingleton = createAudioModal(app)
  }
  return audioModalSingleton
}

export const cleanupMediaModals = (): void => {
  videoModalSingleton?.destroy()
  audioModalSingleton?.destroy()
  videoModalSingleton = null
  audioModalSingleton = null
}

const clampZoomValue = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const installCustomZoom = (galleryLightbox: LightGalleryInstance): (() => void) => {
  const zoomState = {
    scale: 1,
    x: 0,
    y: 0,
    dragging: false,
    startX: 0,
    startY: 0,
    moved: false,
  }

  const getCurrentImage = (): HTMLElement | null => {
    return galleryLightbox.outer.get().querySelector<HTMLElement>('.lg-current .lg-image')
  }

  const getCurrentWrap = (): HTMLElement | null => {
    return getCurrentImage()?.closest<HTMLElement>('.lg-img-wrap') ?? null
  }

  const updateCursor = (image: HTMLElement | null): void => {
    if (!image) return
    const cursor = zoomState.scale > 1 ? (zoomState.dragging ? 'grabbing' : 'grab') : 'zoom-in'
    setCssProps(image, { cursor })
  }

  const clampOffsets = (image: HTMLElement | null): void => {
    const wrap = getCurrentWrap()
    if (!image || !wrap) return

    const maxX = Math.max(0, (image.clientWidth * (zoomState.scale - 1)) / 2)
    const maxY = Math.max(0, (image.clientHeight * (zoomState.scale - 1)) / 2)
    zoomState.x = clampZoomValue(zoomState.x, -maxX, maxX)
    zoomState.y = clampZoomValue(zoomState.y, -maxY, maxY)
  }

  const applyZoom = (): void => {
    const image = getCurrentImage()
    const wrap = getCurrentWrap()
    if (!image || !wrap) return

    clampOffsets(image)
    wrap.classList.toggle('img-gallery-zoomed', zoomState.scale > 1)
    setCssProps(image, {
      'transform-origin': 'center center',
      transform: zoomState.scale > 1
        ? `translate3d(${zoomState.x}px, ${zoomState.y}px, 0) scale(${zoomState.scale})`
        : 'translate3d(0, 0, 0) scale(1)',
      transition: zoomState.dragging ? 'none' : 'transform 120ms ease',
    })
    updateCursor(image)
  }

  const resetZoom = (): void => {
    zoomState.scale = 1
    zoomState.x = 0
    zoomState.y = 0
    zoomState.dragging = false
    zoomState.moved = false
    applyZoom()
  }

  const setZoom = (nextScale: number): void => {
    zoomState.scale = clampZoomValue(nextScale, 1, 6)
    if (zoomState.scale === 1) {
      zoomState.x = 0
      zoomState.y = 0
    }
    applyZoom()
  }

  const handleWheel = (event: WheelEvent): void => {
    const image = getCurrentImage()
    if (!image || !(event.target instanceof Node) || !image.contains(event.target)) return
    event.preventDefault()
    const delta = event.deltaY < 0 ? 0.35 : -0.35
    setZoom(zoomState.scale + delta)
  }

  const handlePointerDown = (event: PointerEvent): void => {
    if (zoomState.scale <= 1) return
    const image = getCurrentImage()
    if (!image || !(event.target instanceof Node) || !image.contains(event.target)) return

    zoomState.dragging = true
    zoomState.startX = event.clientX - zoomState.x
    zoomState.startY = event.clientY - zoomState.y
    zoomState.moved = false
    updateCursor(image)
    event.preventDefault()
    event.stopPropagation()
  }

  const handlePointerMove = (event: PointerEvent): void => {
    if (!zoomState.dragging) return
    zoomState.x = event.clientX - zoomState.startX
    zoomState.y = event.clientY - zoomState.startY
    zoomState.moved = true
    applyZoom()
    event.preventDefault()
  }

  const handlePointerUp = (event: PointerEvent): void => {
    if (!zoomState.dragging) return
    zoomState.dragging = false
    applyZoom()
    event.preventDefault()
  }

  const handleDblClick = (event: MouseEvent): void => {
    const image = getCurrentImage()
    if (!image || !(event.target instanceof Node) || !image.contains(event.target)) return
    event.preventDefault()
    setZoom(zoomState.scale > 1 ? 1 : 2.5)
  }

  const handleClick = (event: MouseEvent): void => {
    const image = getCurrentImage()
    if (!image || !(event.target instanceof Node) || !image.contains(event.target) || zoomState.moved) {
      zoomState.moved = false
      return
    }

    if (zoomState.scale > 1) {
      event.preventDefault()
      resetZoom()
    }
  }

  galleryLightbox.LGel.on('lgAfterOpen.imgGalleryZoom', resetZoom)
  galleryLightbox.LGel.on('lgAfterSlide.imgGalleryZoom', resetZoom)
  galleryLightbox.LGel.on('lgBeforeClose.imgGalleryZoom', resetZoom)

  document.addEventListener('wheel', handleWheel, { passive: false })
  document.addEventListener('pointerdown', handlePointerDown, true)
  document.addEventListener('pointermove', handlePointerMove, true)
  document.addEventListener('pointerup', handlePointerUp, true)
  document.addEventListener('pointercancel', handlePointerUp, true)
  document.addEventListener('dblclick', handleDblClick, true)
  document.addEventListener('click', handleClick, true)

  return () => {
    document.removeEventListener('wheel', handleWheel)
    document.removeEventListener('pointerdown', handlePointerDown, true)
    document.removeEventListener('pointermove', handlePointerMove, true)
    document.removeEventListener('pointerup', handlePointerUp, true)
    document.removeEventListener('pointercancel', handlePointerUp, true)
    document.removeEventListener('dblclick', handleDblClick, true)
    document.removeEventListener('click', handleClick, true)
  }
}

const globalSearchBtn = (gallery: HTMLElement, imagesList: MediaEntry[], app: App): void => {
  gallery.addEventListener('lgInit', (event: Event) => {
    const galleryEvent = event as LightGalleryInitEvent
    const galleryInstance = galleryEvent.detail.instance
    const btn = '<button type="button" id="btn-glob-search" class="lg-icon btn-glob-search"></button>'
    galleryInstance.outer.find('.lg-toolbar').append(btn)

    galleryInstance.outer.find('#btn-glob-search').on('click', () => {
      const selected = imagesList[galleryInstance.index]
      if (!selected) {
        galleryInstance.closeGallery()
        return
      }

      const selectedFile = /^https?:\/\//i.test(selected.path)
        ? null
        : (selected.vaultFile ?? app.vault.getAbstractFileByPath(selected.path))

      if (selectedFile instanceof TFile) {
        void app.workspace.getLeaf(true).openFile(selectedFile, { active: true })
      }

      galleryInstance.closeGallery()
    })
  })
}

const buildLightbox = (gallery: HTMLElement, imagesList: MediaEntry[], app: App): LightGalleryInstance => {
  const lightboxImages = imagesList.filter((file) => file.kind === 'image')
  if (Platform.isDesktop && lightboxImages.length) {
    globalSearchBtn(gallery, lightboxImages, app)
  }

  const galleryLightbox = lightGallery(gallery, {
    plugins: [lgThumbnail],
    selector: '.grid-item[data-media-kind="image"]',
    counter: false,
    download: false,
    thumbnail: true,
    loop: false,
    mode: 'lg-fade',
    licenseKey: '1234-1234-123-1234',
  }) as unknown as LightGalleryInstance

  let destroyZoom: (() => void) | null = null
  if (Platform.isDesktop) {
    destroyZoom = installCustomZoom(galleryLightbox)
  }
  if (Platform.isIosApp || Platform.isAndroidApp) {
    galleryLightbox.outer.addClass('media-gallery-hide-mobile-controls')
  }
  galleryLightbox.__imgGalleryDestroyZoom = destroyZoom

  gallery.querySelectorAll<HTMLElement>('.grid-item[data-media-kind="video"]').forEach((item) => {
    item.addEventListener('click', () => {
      const itemPath = item.getAttribute('data-path')
      const matched = imagesList.find((file) => file.kind === 'video' && file.path === itemPath)
      if (matched) {
        getVideoModal().open(matched)
      }
    })
  })

  gallery.querySelectorAll<HTMLElement>('.grid-item[data-media-kind="audio"]').forEach((item) => {
    item.addEventListener('click', () => {
      const itemPath = item.getAttribute('data-path')
      const matched = imagesList.find((file) => file.kind === 'audio' && file.path === itemPath)
      if (matched) {
        getAudioModal(app).open(matched)
      }
    })
  })

  return galleryLightbox
}

export default buildLightbox
