import { describe, expect, it } from 'vitest'
import {
  applyMediaLimit,
  applyMediaOrderingAndLimit,
  getAudioMimeType,
  getAudioSubtitle,
  getMediaDisplayName,
  getMediaKindFromPath,
  getVideoMimeType,
  isAudioExtension,
  isImageExtension,
  isRecursiveGlobPath,
  isSearchEverywherePath,
  isShallowGlobPath,
  isVideoExtension,
  mergeMediaEntries,
  normalizeMediaSearchPath,
} from './get-imgs-list'
import { getDefaultGallerySettings } from './get-settings'
import type { MediaEntry } from './types'

const entry = (path: string): MediaEntry => ({
  name: path.split('/').pop() ?? path,
  folder: '',
  path,
  uri: path,
  kind: getMediaKindFromPath(path),
})

describe('extension detection', () => {
  it('classifies images, videos, and audio case-insensitively', () => {
    expect(isImageExtension('PNG')).toBe(true)
    expect(isVideoExtension('MP4')).toBe(true)
    expect(isAudioExtension('Mp3')).toBe(true)
    expect(isImageExtension('mp4')).toBe(false)
  })
})

describe('getMediaKindFromPath', () => {
  it('maps extensions to media kinds', () => {
    expect(getMediaKindFromPath('clip.mp4')).toBe('video')
    expect(getMediaKindFromPath('song.MP3')).toBe('audio')
    expect(getMediaKindFromPath('pic.png')).toBe('image')
    expect(getMediaKindFromPath('noextension')).toBe('image')
  })
})

describe('mime types', () => {
  it('resolves video mime types with a sensible default', () => {
    expect(getVideoMimeType('a.mp4')).toBe('video/mp4')
    expect(getVideoMimeType('a.m4v')).toBe('video/mp4')
    expect(getVideoMimeType('a.webm')).toBe('video/webm')
    expect(getVideoMimeType('a.mov')).toBe('video/quicktime')
    expect(getVideoMimeType('a.ogv')).toBe('video/ogg')
    expect(getVideoMimeType('a.xyz')).toBe('video/mp4')
  })

  it('resolves audio mime types with a sensible default', () => {
    expect(getAudioMimeType('a.mp3')).toBe('audio/mpeg')
    expect(getAudioMimeType('a.m4a')).toBe('audio/mp4')
    expect(getAudioMimeType('a.aac')).toBe('audio/mp4')
    expect(getAudioMimeType('a.flac')).toBe('audio/flac')
    expect(getAudioMimeType('a.xyz')).toBe('audio/mpeg')
  })
})

describe('glob path predicates', () => {
  it('detects the search-everywhere sentinels', () => {
    for (const path of [undefined, '', '.', '/', '*', '**']) {
      expect(isSearchEverywherePath(path)).toBe(true)
    }
    expect(isSearchEverywherePath('media')).toBe(false)
  })

  it('distinguishes recursive from shallow globs', () => {
    expect(isRecursiveGlobPath('media/**')).toBe(true)
    expect(isRecursiveGlobPath('media/*')).toBe(false)
    expect(isShallowGlobPath('media/*')).toBe(true)
    expect(isShallowGlobPath('media/**')).toBe(false)
  })

  it('strips glob suffixes when normalizing the search path', () => {
    expect(normalizeMediaSearchPath('media/**')).toBe('media')
    expect(normalizeMediaSearchPath('media/*')).toBe('media')
    expect(normalizeMediaSearchPath('media/sub')).toBe('media/sub')
  })
})

describe('display helpers', () => {
  it('strips the extension for display names', () => {
    expect(getMediaDisplayName(entry('folder/My Song.mp3'))).toBe('My Song')
    expect(getMediaDisplayName(entry('noext'))).toBe('noext')
  })

  it('formats audio subtitles from available metadata', () => {
    expect(getAudioSubtitle({ artist: 'A', album: 'B', title: null, artworkUrl: null })).toBe('A • B')
    expect(getAudioSubtitle({ artist: 'A', album: null, title: null, artworkUrl: null })).toBe('A')
    expect(getAudioSubtitle({ artist: null, album: 'B', title: null, artworkUrl: null })).toBe('B')
    expect(getAudioSubtitle(null)).toBe('')
  })
})

describe('ordering and limits', () => {
  it('slices only when a positive limit is set', () => {
    expect(applyMediaLimit([1, 2, 3, 4], 2)).toEqual([1, 2])
    expect(applyMediaLimit([1, 2, 3, 4], 0)).toEqual([1, 2, 3, 4])
  })

  it('produces a deterministic shuffle for a fixed seed', () => {
    const items = Array.from({ length: 20 }, (_, index) => entry(`file-${String(index)}.png`))
    const settings = getDefaultGallerySettings()
    settings.sortby = 'rand'
    settings.seed = 'fixed-seed'

    const first = applyMediaOrderingAndLimit(items, settings).map((item) => item.path)
    const second = applyMediaOrderingAndLimit(items, settings).map((item) => item.path)

    expect(first).toEqual(second)
    // A shuffle should not (for this seed) leave the list untouched.
    expect(first).not.toEqual(items.map((item) => item.path))
  })

  it('dedupes merged entries by path', () => {
    const merged = mergeMediaEntries([entry('a.png'), entry('b.png')], [entry('b.png'), entry('c.png')])
    expect(merged.map((item) => item.path)).toEqual(['a.png', 'b.png', 'c.png'])
  })
})
