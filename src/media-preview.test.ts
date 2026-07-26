import { afterEach, describe, expect, it, vi } from 'vitest'
import { capturePoster } from './media-preview'

// Build a jsdom <video> with the media properties capturePoster reads. jsdom does
// not implement decoding, so readyState/dimensions/duration are stubbed and the
// `seeked` event is dispatched by hand to stand in for the seek completing.
const makeVideo = (readyState: number): HTMLVideoElement => {
  const video = document.createElement('video')
  Object.defineProperty(video, 'readyState', { value: readyState, configurable: true })
  Object.defineProperty(video, 'videoWidth', { value: 320, configurable: true })
  Object.defineProperty(video, 'videoHeight', { value: 180, configurable: true })
  Object.defineProperty(video, 'duration', { value: 12, configurable: true })
  return video
}

// Route the internal `document.createElement('canvas')` to a stub: jsdom has no
// 2D context, so we fake one and let toDataURL return a sentinel to assert on.
// `getContext` returns null when `context` is false, exercising the failure path.
const stubCanvas = (context: unknown = { drawImage: vi.fn() }, dataUrl = 'data:image/jpeg;base64,STUB'): void => {
  const canvas = { getContext: vi.fn(() => context), toDataURL: vi.fn(() => dataUrl) }
  vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('capturePoster', () => {
  it('snapshots the seeked frame into video.poster', () => {
    const video = makeVideo(HTMLMediaElement.HAVE_METADATA)
    stubCanvas()

    capturePoster(video)
    expect(video.dataset.posterState).toBe('pending')

    video.dispatchEvent(new Event('seeked'))
    expect(video.poster).toContain('data:image/jpeg')
    expect(video.dataset.posterState).toBe('done')
  })

  it('waits for metadata before seeking', () => {
    const video = makeVideo(HTMLMediaElement.HAVE_NOTHING)
    stubCanvas()

    capturePoster(video)
    // No seek armed yet: firing seeked now must not produce a poster.
    video.dispatchEvent(new Event('seeked'))
    expect(video.poster).toBe('')

    video.dispatchEvent(new Event('loadedmetadata'))
    video.dispatchEvent(new Event('seeked'))
    expect(video.dataset.posterState).toBe('done')
  })

  it('is idempotent: a second call is a no-op', () => {
    const video = makeVideo(HTMLMediaElement.HAVE_METADATA)
    stubCanvas()

    capturePoster(video)
    capturePoster(video)
    video.dispatchEvent(new Event('seeked'))
    expect(video.dataset.posterState).toBe('done')
  })

  it('marks failure when no 2D context is available', () => {
    const video = makeVideo(HTMLMediaElement.HAVE_METADATA)
    stubCanvas(null)

    capturePoster(video)
    video.dispatchEvent(new Event('seeked'))
    expect(video.poster).toBe('')
    expect(video.dataset.posterState).toBe('failed')
  })
})
