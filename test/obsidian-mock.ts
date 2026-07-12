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
export class PluginSettingTab {}
export class Setting {}
