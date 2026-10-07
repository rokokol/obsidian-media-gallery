// Obsidian adds `createEl`, `createDiv` and `createSpan` to the global scope and to every
// DOM node. jsdom has none of them, so this setup file installs the part of that API the
// plugin and its tests use. It calls `document.createElement`, so a test can still stub
// element creation there

interface ElementInfo {
  cls?: string | string[]
  text?: string
}

const create = (tag: string, info?: string | ElementInfo): HTMLElement => {
  const options: ElementInfo = typeof info === 'string' ? { cls: info } : info ?? {}
  const el = document.createElement(tag)
  if (options.cls) el.className = Array.isArray(options.cls) ? options.cls.join(' ') : options.cls
  if (options.text) el.textContent = options.text
  return el
}

const append = (parent: Node, tag: string, info?: string | ElementInfo): HTMLElement =>
  parent.appendChild(create(tag, info))

const globals = globalThis as Record<string, unknown>
globals.createEl = create
globals.createDiv = (info?: string | ElementInfo) => create('div', info)
globals.createSpan = (info?: string | ElementInfo) => create('span', info)

const proto = Node.prototype as unknown as Record<string, unknown>
proto.createEl = function (this: Node, tag: string, info?: string | ElementInfo) { return append(this, tag, info) }
proto.createDiv = function (this: Node, info?: string | ElementInfo) { return append(this, 'div', info) }
proto.createSpan = function (this: Node, info?: string | ElementInfo) { return append(this, 'span', info) }
