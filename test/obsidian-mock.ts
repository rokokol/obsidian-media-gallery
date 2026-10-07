// Minimal runtime stand-in for the `obsidian` module. The real implementation is
// injected by the Obsidian app at runtime; the npm package ships types only. In
// tests we alias `obsidian` to this file so the plugin's pure helpers can run.

export const normalizePath = (path: string): string => {
  const normalized = path
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '')
  return normalized || '/'
}

// Tiny YAML-subset parser covering what gallery blocks use: flat `key: value`
// mappings with optional quotes and inline `[a, b]` lists. Non-mapping input is
// returned as a raw scalar so callers can reject it like the real parser does.
const stripQuotes = (value: string): string => {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

export const parseYaml = (src: string): unknown => {
  const lines = src.split('\n').map((line) => line.trim()).filter(Boolean)
  const isMapping = lines.length > 0 && lines.every((line) => /^[^:\s][^:]*:/.test(line))
  if (!isMapping) return src.trim()

  const result: Record<string, unknown> = {}
  for (const line of lines) {
    const separator = line.indexOf(':')
    const key = line.slice(0, separator).trim()
    const raw = stripQuotes(line.slice(separator + 1).trim())
    result[key] = raw.startsWith('[') && raw.endsWith(']')
      ? raw.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean)
      : raw
  }
  return result
}

export const Platform = {
  isDesktop: true,
  isMobile: false,
  isIosApp: false,
  isAndroidApp: false,
}

export class TFile {}
export class TFolder {}
export class Notice {
  constructor(_message: string) {}
}
export const requestUrl = (): Promise<{ arrayBuffer: ArrayBuffer }> =>
  Promise.resolve({ arrayBuffer: new ArrayBuffer(0) })

export class Component {}
export class MarkdownRenderChild {}
export class Plugin {}
export class PluginSettingTab {
  containerEl = createDiv()
  constructor(public app: unknown, public plugin: unknown) {}
  update(): void {}
}

// Records what a settings tab builds, so a test can read the rows back
export class ToggleComponent {
  value = false
  disabled = false
  tooltip = ''
  handler: ((value: boolean) => unknown) | null = null
  setValue(value: boolean): this { this.value = value; return this }
  setDisabled(disabled: boolean): this { this.disabled = disabled; return this }
  setTooltip(tooltip: string): this { this.tooltip = tooltip; return this }
  onChange(handler: (value: boolean) => unknown): this { this.handler = handler; return this }
}

export class Setting {
  static created: Setting[] = []
  name = ''
  desc = ''
  heading = false
  toggle: ToggleComponent | null = null
  constructor(public containerEl: HTMLElement) { Setting.created.push(this) }
  setName(name: string): this { this.name = name; return this }
  setDesc(desc: string): this { this.desc = desc; return this }
  setHeading(): this { this.heading = true; return this }
  addToggle(cb: (toggle: ToggleComponent) => unknown): this {
    this.toggle = new ToggleComponent()
    cb(this.toggle)
    return this
  }
}
