import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Setting } from 'obsidian'
import type { SettingDefinitionControl, SettingDefinitionGroup } from 'obsidian'
import { DEFAULT_PLUGIN_SETTINGS, galleryRuntimeSettings } from './runtime-settings'
import { ImgGallerySettingTab } from './settings-tab'
import type { SettingsHost } from './settings-tab'

// The mock Setting records its rows; see test/obsidian-mock.ts
type RecordedSetting = Setting & { name: string; heading: boolean; toggle: { value: boolean; disabled: boolean; tooltip: string; handler: (value: boolean) => unknown } | null }

const makeTab = (overrides: Partial<typeof DEFAULT_PLUGIN_SETTINGS> = {}) => {
  const plugin = {
    app: {},
    settings: { ...DEFAULT_PLUGIN_SETTINGS, ...overrides },
    invalidateImageCache: vi.fn(),
    saveSettings: vi.fn(() => Promise.resolve()),
  }
  Object.assign(galleryRuntimeSettings, plugin.settings)
  const tab = new ImgGallerySettingTab(plugin as unknown as SettingsHost)
  const update = vi.spyOn(tab, 'update')
  return { plugin, tab, update }
}

const controls = (tab: ImgGallerySettingTab): SettingDefinitionControl[] =>
  tab.getSettingDefinitions().flatMap((item) => (item as SettingDefinitionGroup).items ?? []) as SettingDefinitionControl[]

const mockSetting = Setting as unknown as { created: RecordedSetting[] }
const rows = (): RecordedSetting[] => mockSetting.created

// The tab keeps display() for Obsidian before 1.13, and these tests are what covers it. The
// typings mark display() deprecated, so the call goes through a type that only has display()
const draw = (tab: ImgGallerySettingTab): void => {
  const fallback: { display: () => void } = tab
  fallback.display()
}

beforeEach(() => {
  mockSetting.created = []
})

describe('getSettingDefinitions', () => {
  it('has one toggle for every plugin setting', () => {
    const keys = controls(makeTab().tab).map((def) => def.control.key).sort()
    expect(keys).toEqual(Object.keys(DEFAULT_PLUGIN_SETTINGS).sort())
  })

  it('disables the file-name toggle exactly while flexible patterns are off', () => {
    const { plugin, tab } = makeTab()
    const wildcard = controls(tab).find((def) => def.control.key === 'matchWildcardsAgainstFileNames')
    const disabled = wildcard?.control.disabled as () => boolean

    expect(disabled()).toBe(false)
    plugin.settings.enableFlexiblePathPatterns = false
    expect(disabled()).toBe(true)
  })
})

describe('setControlValue', () => {
  it('stores a change for the plugin and for the running galleries, drops the caches and saves', async () => {
    const { plugin, tab } = makeTab()
    await tab.setControlValue('enableCache', false)

    expect(plugin.settings.enableCache).toBe(false)
    expect(galleryRuntimeSettings.enableCache).toBe(false)
    expect(plugin.invalidateImageCache).toHaveBeenCalledTimes(1)
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1)
  })

  it('leaves the caches alone for a setting that does not change what a gallery lists', async () => {
    const { plugin, tab } = makeTab()
    await tab.setControlValue('showPathErrors', false)

    expect(galleryRuntimeSettings.showPathErrors).toBe(false)
    expect(plugin.invalidateImageCache).not.toHaveBeenCalled()
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1)
  })

  it('switches the file-name match off and redraws the tab when flexible patterns go off', async () => {
    const { plugin, tab, update } = makeTab()
    await tab.setControlValue('enableFlexiblePathPatterns', false)

    expect(plugin.settings.matchWildcardsAgainstFileNames).toBe(false)
    expect(galleryRuntimeSettings.matchWildcardsAgainstFileNames).toBe(false)
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('ignores the file-name match while flexible patterns are off', async () => {
    const { plugin, tab } = makeTab({ enableFlexiblePathPatterns: false, matchWildcardsAgainstFileNames: false })
    await tab.setControlValue('matchWildcardsAgainstFileNames', true)

    expect(plugin.settings.matchWildcardsAgainstFileNames).toBe(false)
    expect(plugin.saveSettings).not.toHaveBeenCalled()
  })

  it('ignores an unknown key and a value that is not a boolean', async () => {
    const { plugin, tab } = makeTab()
    await tab.setControlValue('nonsense', true)
    await tab.setControlValue('enableCache', 'no')

    expect(plugin.settings).toEqual(DEFAULT_PLUGIN_SETTINGS)
    expect(plugin.saveSettings).not.toHaveBeenCalled()
  })
})

describe('getControlValue', () => {
  it('shows the file-name match as off while flexible patterns are off, whatever is stored', () => {
    const { tab } = makeTab({ enableFlexiblePathPatterns: false, matchWildcardsAgainstFileNames: true })
    expect(tab.getControlValue('matchWildcardsAgainstFileNames')).toBe(false)
  })
})

describe('display (Obsidian before 1.13)', () => {
  it('draws a heading per group and a toggle per setting, in the order of the definitions', () => {
    const { tab } = makeTab()
    draw(tab)

    const headings = rows().filter((row) => row.heading).map((row) => row.name)
    expect(headings).toEqual(['Performance', 'Paths', 'Audio'])

    const names = rows().filter((row) => row.toggle).map((row) => row.name)
    expect(names).toEqual(controls(tab).map((def) => def.name))
  })

  it('shows the stored values', () => {
    const { tab } = makeTab({ autoplayAudioOnOpen: false })
    draw(tab)

    const autoplay = rows().find((row) => row.name === 'Autoplay audio on open')
    expect(autoplay?.toggle?.value).toBe(false)
  })

  it('disables the file-name toggle with a tooltip while flexible patterns are off', () => {
    const { tab } = makeTab({ enableFlexiblePathPatterns: false })
    draw(tab)

    const wildcard = rows().find((row) => row.name === 'Match wildcards against file names')
    expect(wildcard?.toggle?.disabled).toBe(true)
    expect(wildcard?.toggle?.tooltip).toBe('Enable flexible path patterns first')
  })

  it('turns the file-name toggle off and disables it when flexible patterns are switched off', async () => {
    const { plugin, tab } = makeTab()
    draw(tab)
    const flexible = rows().find((row) => row.name === 'Enable flexible path patterns')
    const wildcard = rows().find((row) => row.name === 'Match wildcards against file names')
    expect(wildcard?.toggle?.value).toBe(true)

    await flexible?.toggle?.handler(false)

    expect(plugin.settings.enableFlexiblePathPatterns).toBe(false)
    expect(wildcard?.toggle?.value).toBe(false)
    expect(wildcard?.toggle?.disabled).toBe(true)
  })
})
