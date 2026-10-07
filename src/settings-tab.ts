import { PluginSettingTab, Setting } from 'obsidian'
import type { Plugin, SettingDefinitionItem, ToggleComponent } from 'obsidian'
import { DEFAULT_PLUGIN_SETTINGS, galleryRuntimeSettings } from './runtime-settings'
import type { MediaGalleryPluginSettings } from './types'

export interface SettingsHost extends Plugin {
  settings: MediaGalleryPluginSettings
  invalidateImageCache: () => void
  saveSettings: () => Promise<void>
}

type SettingKey = keyof MediaGalleryPluginSettings

interface ToggleSpec {
  key: SettingKey
  name: string
  desc: string
  // A setting that changes which files a gallery lists drops the cached lists
  invalidatesCache: boolean
}

interface GroupSpec {
  heading: string
  toggles: ToggleSpec[]
}

const FLEXIBLE_PATTERNS: SettingKey = 'enableFlexiblePathPatterns'
const WILDCARD_FILE_NAMES: SettingKey = 'matchWildcardsAgainstFileNames'

// The one list of what the tab shows. Obsidian 1.13 and later render it from
// getSettingDefinitions(); older versions call display(), which renders the same list
const GROUPS: GroupSpec[] = [
  {
    heading: 'Performance',
    toggles: [
      {
        key: 'enableCache',
        name: 'Enable cache',
        desc: 'Caches the vault media list and per-folder lookups in memory. Disable this if the plugin uses too much RAM; galleries will rescan files on each render.',
        invalidatesCache: true,
      },
    ],
  },
  {
    heading: 'Paths',
    toggles: [
      {
        key: 'showPathErrors',
        name: 'Show path and empty-gallery errors',
        desc: 'When enabled, invalid paths and empty gallery lookups render an inline error. When disabled, the block stays empty instead.',
        invalidatesCache: false,
      },
      {
        key: FLEXIBLE_PATTERNS,
        name: 'Enable flexible path patterns',
        desc: 'Allows wildcard patterns like `media/**/concert*` and `media/2025-??`. Regular paths, `folder/*`, and `folder/**` stay on the fast path either way.',
        invalidatesCache: true,
      },
      {
        key: WILDCARD_FILE_NAMES,
        name: 'Match wildcards against file names',
        desc: 'When enabled, flexible wildcard patterns match file names while the directory part only narrows the search scope. This option is available only when flexible path patterns are enabled.',
        invalidatesCache: true,
      },
    ],
  },
  {
    heading: 'Audio',
    toggles: [
      {
        key: 'enableAudioVisualizations',
        name: 'Enable audio visualizations',
        desc: 'Enables audio waveform and spectrogram rendering inside gallery blocks. If disabled, audio cards show only metadata and cover art.',
        invalidatesCache: true,
      },
      {
        key: 'autoplayAudioOnOpen',
        name: 'Autoplay audio on open',
        desc: 'Starts audio playback automatically when you open an audio card.',
        invalidatesCache: false,
      },
    ],
  },
]

const TOGGLES = GROUPS.flatMap((group) => group.toggles)

const isSettingKey = (key: string): key is SettingKey =>
  Object.prototype.hasOwnProperty.call(DEFAULT_PLUGIN_SETTINGS, key)

export class ImgGallerySettingTab extends PluginSettingTab {
  plugin: SettingsHost

  constructor(plugin: SettingsHost) {
    super(plugin.app, plugin)
    this.plugin = plugin
  }

  // Matching wildcards against file names only has an effect with flexible patterns on
  private isWildcardFileNamesAvailable(): boolean {
    return this.plugin.settings[FLEXIBLE_PATTERNS]
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return GROUPS.map((group): SettingDefinitionItem => ({
      type: 'group',
      heading: group.heading,
      items: group.toggles.map((toggle) => ({
        name: toggle.name,
        desc: toggle.desc,
        control: {
          type: 'toggle',
          key: toggle.key,
          ...(toggle.key === WILDCARD_FILE_NAMES && {
            disabled: () => !this.isWildcardFileNamesAvailable(),
          }),
        },
      })),
    }))
  }

  getControlValue(key: string): unknown {
    if (!isSettingKey(key)) return undefined
    const value = this.plugin.settings[key]
    return key === WILDCARD_FILE_NAMES ? this.isWildcardFileNamesAvailable() && value : value
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    await this.applyToggle(key, value)
    if (key === FLEXIBLE_PATTERNS) {
      // The wildcard toggle's value and disabled state follow this one; update() draws
      // the tab again, which refreshDomState() alone does not do for a value
      this.update()
    }
  }

  private async applyToggle(key: string, value: unknown): Promise<void> {
    if (typeof value !== 'boolean' || !isSettingKey(key)) return
    if (key === WILDCARD_FILE_NAMES && !this.isWildcardFileNamesAvailable()) return

    const { plugin } = this
    plugin.settings[key] = value
    galleryRuntimeSettings[key] = value
    if (key === FLEXIBLE_PATTERNS && !value) {
      plugin.settings[WILDCARD_FILE_NAMES] = false
      galleryRuntimeSettings[WILDCARD_FILE_NAMES] = false
    }
    if (TOGGLES.some((toggle) => toggle.key === key && toggle.invalidatesCache)) {
      plugin.invalidateImageCache()
    }
    await plugin.saveSettings()
  }

  // Only Obsidian before 1.13 calls this; later versions render getSettingDefinitions()
  display(): void {
    const { containerEl } = this
    containerEl.empty()

    let wildcardFileNamesToggle: ToggleComponent | null = null
    const syncWildcardFileNamesToggle = (): void => {
      if (wildcardFileNamesToggle === null) return

      const available = this.isWildcardFileNamesAvailable()
      wildcardFileNamesToggle.setTooltip(available ? '' : 'Enable flexible path patterns first')
      wildcardFileNamesToggle.setDisabled(!available)
      wildcardFileNamesToggle.setValue(this.getControlValue(WILDCARD_FILE_NAMES) === true)
    }

    GROUPS.forEach((group) => {
      new Setting(containerEl)
        .setName(group.heading)
        .setHeading()

      group.toggles.forEach((spec) => {
        new Setting(containerEl)
          .setName(spec.name)
          .setDesc(spec.desc)
          .addToggle((toggle) => {
            toggle.setValue(this.getControlValue(spec.key) === true)
            if (spec.key === WILDCARD_FILE_NAMES) {
              wildcardFileNamesToggle = toggle
              syncWildcardFileNamesToggle()
            }
            return toggle.onChange(async (value) => {
              await this.applyToggle(spec.key, value)
              if (spec.key === FLEXIBLE_PATTERNS) syncWildcardFileNamesToggle()
            })
          })
      })
    })
  }
}
