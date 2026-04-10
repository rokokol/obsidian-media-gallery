# Media Gallery

Media Gallery is an Obsidian community plugin for rendering image, GIF, video, and audio galleries directly inside notes.

<img width="1920" height="1080" alt="preview" src="https://github.com/user-attachments/assets/7cfa63d7-8648-4dbd-8e48-eb82dc22ebf7" />

It started as a fork and extensive rework of Luca Orio's **Image Gallery** plugin and keeps compatibility with the original `img-gallery` syntax while adding a broader mixed-media workflow.

> **Flexible and convenient gallery for images, GIFs, videos, and music.**

## Attribution

This plugin is based on `obsidian-image-gallery` by Luca Orio and was substantially extended for mixed-media use cases by `rokokol`.

- Original project: `https://github.com/lucaorio/obsidian-image-gallery`
- Original license: `MIT`

## Version Lineage

- `1.0.0`–`1.1.1` — original `obsidian-image-gallery` releases by Luca Orio
- `2.0.0` — first `Media Gallery` release by `rokokol`

## Highlights

- Renders galleries from a folder path or an explicit list of embedded files
- Supports images, GIFs, videos, and audio files in the same block
- Provides image lightbox with zoom, pan, double-click zoom toggle, and open-in-note action
- Opens videos and audio in focused modals with native playback controls
- Displays audio metadata, optional embedded cover art, waveform, and spectrogram previews
- Supports cache control from plugin settings for better memory/performance tradeoffs
- Keeps backward compatibility with `img-gallery` and `img-gal`

## Supported Media

- Images: `jpg`, `jpeg`, `png`, `gif`, `webp`, `tif`, `tiff`, `bmp`, `svg`, `avif`
- Video: `mp4`, `webm`, `mov`, `m4v`, `ogv`
- Audio: `mp3`, `m4a`, `wav`, `ogg`, `oga`, `flac`, `aac`, `opus`

## Block Aliases

The preferred code block name is:

````markdown
```media-gallery
...
```
````

The following legacy aliases are also supported:

- `img-gallery`
- `img-gal`

## Usage Modes


https://github.com/user-attachments/assets/0a2131d3-a016-41b0-acf1-e8b5dbfa66a8


### 1. Folder-Based Gallery

Use a vault-relative folder path to build a gallery dynamically.

````markdown
```media-gallery
path: media/Trip to Kazan
type: vertical
columns: 2
sortby: mtime
sort: desc
```
````

This mode scans the folder recursively. If `path` is omitted or set to `*`, `**`, `.`, or `/`, the plugin searches the whole vault.

You can also use path patterns:

- `path: media/**` — recursive search under `media/`
- `path: media/*` — only direct children of `media/`
- By default, flexible wildcard patterns match **file names**, while the directory part only narrows the search scope.
- Example: `cats/cat?` matches `cats/cat1.png` and `cats/cat2.jpg`.
- This behavior can be disabled in plugin settings if you want wildcards to match the full path instead.

### 2. Explicit Media List

Use embedded wiki-links, markdown image links, or direct paths/URLs.

````markdown
```media-gallery
columns: 2
type: vertical

![[photo.jpg]]
![[clip.mp4]]
![[track.mp3]]
```
````

This mode is ideal for `Media Dump` sections in daily, weekly, yearly, and hub notes.

### 3. Combined Folder + Explicit Media

You can combine `path` with explicit embeds in the same block. The plugin loads media from the folder first, then appends explicitly listed items, while deduplicating identical entries by path.

````markdown
```media-gallery
path: media/Trip to Kazan
columns: 2
type: vertical

![[special-video-outside-folder.mp4]]
![[favorite-track.mp3]]
```
````

## Settings Inside the Block

The plugin accepts YAML-like modifiers at the top of the block.

| Option | Default | Values | Notes |
| --- | --- | --- | --- |
| `path` | `*` | vault-relative path, `*`, `.`, `/` | Folder mode only |
| `type` | `vertical` | `vertical`, `horizontal`, `mosaic`, `collage` | `collage` is treated as `mosaic` |
| `fit` | `cover` or `contain` | `cover`, `contain` | `mosaic` defaults to `contain`; others default to `cover` |
| `columns` | `3` desktop / `1` mobile | number | Most relevant for `vertical` |
| `mobile` | `1` | number | Mobile column count |
| `height` | `260` | number | Base tile height |
| `gutter` | `8` | number | Gap in pixels |
| `radius` | `0` in folder mode, `10` in explicit mode | number | Border radius in pixels |
| `sortby` | `ctime` | `ctime`, `mtime`, `name`, `rand`, `random` | `rand` and `random` act as aliases for random ordering |
| `sort` | `desc` | `asc`, `desc` | Folder mode only |
| `extensions` | none | comma-separated list or YAML array | Keeps only matching file extensions |
| `exclude` | none | comma-separated list or YAML array | Excludes matching paths or patterns |
| `limit` | `0` | number | Limits how many media items are rendered after filtering and ordering; `0` disables the limit |
| `seed` | random | string or number | Makes `sortby: rand` or `sortby: random` deterministic when set |
| `waveform` | `true` | `true`, `false` | Audio preview visualization |
| `spectrogram` | `false` | `true`, `false` | Uses spectrogram instead of waveform |

Examples:

- `extensions: jpg, png, mp4`
- `exclude: media/private/**, media/tmp/*, voice-note.mp3`
- `sortby: rand`
- `limit: 24`
- `seed: trip-2025`

## Layout Modes

https://github.com/user-attachments/assets/fd647f27-886d-4b86-a1f0-ab32d925f4a1


### `vertical`

- Default mode
- Masonry-style multi-column layout
- Good for mixed `Media Dump` blocks

### `horizontal`

- Row-based layout with fixed item height
- Better when order matters visually

### `mosaic`

- Smart tiled collage layout
- Better for small curated image sets
- Defaults to `fit: contain` to reduce aggressive cropping

### `collage`

- Alias for `mosaic`
- Preserved for convenience and compatibility

## Audio Features

- Audio cards show track name, file type, and optional subtitle from metadata
- MP3 metadata parsing supports `title`, `artist`, `album`, and embedded cover art when available
- Audio modal can autoplay when opened
- Waveform is used by default
- Spectrogram can be enabled per block with `spectrogram: true`
- Audio visualizations can be disabled globally in plugin settings

### Example: Audio-Heavy Block

````markdown
```media-gallery
type: vertical
columns: 2
spectrogram: true

![[track-01.mp3]]
![[track-02.flac]]
![[track-03.m4a]]
```
````

## Plugin Settings

### Performance

- `Enable cache` — caches the vault media list and folder lookups in memory

### Paths

- `Enable flexible path patterns` — enables advanced wildcard patterns such as `media/**/concert*` or `media/2025-??`
- Exact folder paths, `folder/*`, and `folder/**` stay on the fast path either way
- `Match wildcards against file names` — when enabled, wildcard parts match file names and the directory part only scopes the search; when disabled, flexible wildcards match against the full path

### Audio

- `Enable audio visualizations` — toggles waveform and spectrogram rendering
- `Autoplay audio on open` — starts playback automatically when opening an audio card

## Performance Notes

- Cache is invalidated when files are created, deleted, or renamed in the vault
- Turning cache off reduces memory usage but makes each gallery render rescan vault files
- Spectrograms are heavier than waveforms; use them selectively in large notes
- Audio spectrogram previews are rendered to `canvas` for better scroll performance than large DOM grids

## Default Behavior

### Folder galleries

- `type: vertical`
- `fit: cover`
- `height: 260`
- `gutter: 8`
- `limit: 0`

### Explicit media lists

- `type: vertical`
- `fit: cover`
- `height: 260`
- `gutter: 8`
- `radius: 10`
- `waveform: true`
- `spectrogram: false`
- `limit: 0`

## Examples

### Mixed Media Dump

````markdown
```media-gallery
columns: 2
type: vertical

![[photo-1.jpg]]
![[photo-2.jpg]]
![[clip.mp4]]
![[voice-note.mp3]]
```
````

### Search the Entire Vault

````markdown
```media-gallery
path: "*"
type: vertical
columns: 2
```
````

`path: "**"` works the same way as `path: "*"`.

### Path Patterns

````markdown
```media-gallery
path: media/**
type: vertical
columns: 2
```
````

````markdown
```media-gallery
path: media/*
type: vertical
columns: 2
```
````

### Filters

````markdown
```media-gallery
path: media/**
extensions: jpg, png, mp4
exclude: media/private/**, media/tmp/*
sortby: rand
limit: 24
seed: trip-2025
type: vertical
columns: 2
```
````

### Horizontal Strip

````markdown
```media-gallery
type: horizontal
height: 280
gutter: 12

![[photo-1.jpg]]
![[photo-2.jpg]]
![[photo-3.jpg]]
```
````

### Gentle Mosaic

````markdown
```media-gallery
type: mosaic
fit: contain
height: 280

![[photo-1.jpg]]
![[photo-2.jpg]]
![[photo-3.jpg]]
```
````

## Installing from Source

1. Build or copy `main.js`, `manifest.json`, and `styles.css`.
2. Place them in your vault under `.obsidian/plugins/media-gallery/`.
3. Reload Obsidian.
4. Enable **Media Gallery** in Community Plugins.

## Development Notes

- The plugin in this repository was prepared from a working vault plugin and exported into release-ready root files.
- The release id is `media-gallery`.
- The current release version is `2.0.0`.

## License

This project is released under the MIT License. See `LICENSE`.
