/* Media Gallery for Obsidian, based on https://github.com/lucaorio/obsidian-image-gallery */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/main.ts
__export(exports, {
  default: () => ImgGallery
});
var import_obsidian5 = __toModule(require("obsidian"));

// src/init.ts
var import_obsidian4 = __toModule(require("obsidian"));

// src/get-imgs-list.ts
var import_obsidian = __toModule(require("obsidian"));

// src/render-error.ts
var renderError = (container, error) => {
  const wrapper = container.createEl("div");
  wrapper.createEl("p", { text: `(Error) Media Gallery: ${error}` });
  wrapper.style.borderRadius = "4px";
  wrapper.style.padding = "2px 16px";
  wrapper.style.backgroundColor = "#e50914";
  wrapper.style.color = "#fff";
  wrapper.style.fontWeight = "bolder";
};
var render_error_default = renderError;

// src/get-imgs-list.ts
var validImageExtensions = ["jpeg", "jpg", "gif", "png", "webp", "tiff", "tif", "bmp", "svg", "avif"];
var validVideoExtensions = ["mp4", "webm", "mov", "m4v", "ogv"];
var validAudioExtensions = ["mp3", "m4a", "wav", "ogg", "oga", "flac", "aac", "opus"];
var isImageExtension = (extension) => validImageExtensions.includes(extension.toLowerCase());
var isVideoExtension = (extension) => validVideoExtensions.includes(extension.toLowerCase());
var isAudioExtension = (extension) => validAudioExtensions.includes(extension.toLowerCase());
var isVaultMedia = (file) => {
  return file instanceof import_obsidian.TFile && (isImageExtension(file.extension) || isVideoExtension(file.extension) || isAudioExtension(file.extension));
};
var isVaultImage = (file) => {
  return file instanceof import_obsidian.TFile && isImageExtension(file.extension);
};
var getMediaKindFromPath = (path) => {
  const extension = path.split(".").pop() || "";
  if (isVideoExtension(extension))
    return "video";
  if (isAudioExtension(extension))
    return "audio";
  return "image";
};
var getVideoMimeType = (path) => {
  const extension = (path.split(".").pop() || "").toLowerCase();
  switch (extension) {
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "ogv":
      return "video/ogg";
    default:
      return "video/mp4";
  }
};
var getAudioMimeType = (path) => {
  const extension = (path.split(".").pop() || "").toLowerCase();
  switch (extension) {
    case "mp3":
      return "audio/mpeg";
    case "m4a":
    case "aac":
      return "audio/mp4";
    case "wav":
      return "audio/wav";
    case "ogg":
    case "oga":
      return "audio/ogg";
    case "flac":
      return "audio/flac";
    case "opus":
      return "audio/opus";
    default:
      return "audio/mpeg";
  }
};
var audioArtworkCache = /* @__PURE__ */ new Map();
var audioMetadataCache = /* @__PURE__ */ new Map();
var audioWaveformCache = /* @__PURE__ */ new Map();
var audioSpectrogramCache = /* @__PURE__ */ new Map();
var audioObjectUrls = /* @__PURE__ */ new Set();
var clearAudioCaches = () => {
  audioArtworkCache.clear();
  audioMetadataCache.clear();
  audioWaveformCache.clear();
  audioSpectrogramCache.clear();
  audioObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  audioObjectUrls.clear();
};
var galleryRuntimeSettings = {
  enableCache: true,
  enableAudioVisualizations: true,
  autoplayAudioOnOpen: true,
  enableFlexiblePathPatterns: true
};
var readSynchsafeInteger = (bytes, start) => {
  return (bytes[start] & 127) << 21 | (bytes[start + 1] & 127) << 14 | (bytes[start + 2] & 127) << 7 | bytes[start + 3] & 127;
};
var readIsoString = (bytes, start, end) => {
  let out = "";
  for (let index = start; index < end; index++) {
    if (bytes[index] === 0)
      break;
    out += String.fromCharCode(bytes[index]);
  }
  return out;
};
var skipEncodedText = (bytes, start, encoding) => {
  if (encoding === 1 || encoding === 2) {
    let index = start;
    while (index + 1 < bytes.length) {
      if (bytes[index] === 0 && bytes[index + 1] === 0)
        return index + 2;
      index += 2;
    }
    return bytes.length;
  }
  let index = start;
  while (index < bytes.length) {
    if (bytes[index] === 0)
      return index + 1;
    index += 1;
  }
  return bytes.length;
};
var decodeTextBytes = (bytes, encoding) => {
  try {
    if (encoding === 1 || encoding === 2)
      return new TextDecoder("utf-16").decode(bytes).replace(/\u0000/g, "").trim();
    if (encoding === 3)
      return new TextDecoder("utf-8").decode(bytes).replace(/\u0000/g, "").trim();
  } catch (error) {
  }
  return readIsoString(bytes, 0, bytes.length).trim();
};
var parseMp3Metadata = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.length < 10 || readIsoString(bytes, 0, 3) !== "ID3")
    return {
      artworkUrl: null,
      title: null,
      artist: null,
      album: null
    };
  const version = bytes[3];
  const tagSize = readSynchsafeInteger(bytes, 6);
  let offset = 10;
  const limit = Math.min(bytes.length, tagSize + 10);
  let artworkUrl = null;
  let title = null;
  let artist = null;
  let album = null;
  while (offset + 10 <= limit) {
    const frameId = readIsoString(bytes, offset, offset + 4);
    if (!frameId.trim())
      break;
    const frameSize = version === 4 ? readSynchsafeInteger(bytes, offset + 4) : bytes[offset + 4] << 24 | bytes[offset + 5] << 16 | bytes[offset + 6] << 8 | bytes[offset + 7];
    if (!frameSize)
      break;
    const frameStart = offset + 10;
    const frameEnd = Math.min(frameStart + frameSize, bytes.length);
    if (frameId === "APIC") {
      const encoding = bytes[frameStart];
      let cursor = frameStart + 1;
      let mimeEnd = cursor;
      while (mimeEnd < frameEnd && bytes[mimeEnd] !== 0)
        mimeEnd += 1;
      const mimeType = readIsoString(bytes, cursor, mimeEnd) || "image/jpeg";
      cursor = mimeEnd + 1;
      cursor += 1;
      cursor = skipEncodedText(bytes, cursor, encoding);
      if (cursor < frameEnd && !artworkUrl) {
        const blob = new Blob([bytes.slice(cursor, frameEnd)], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        audioObjectUrls.add(objectUrl);
        artworkUrl = objectUrl;
      }
    } else if (["TIT2", "TPE1", "TALB"].includes(frameId) && frameEnd > frameStart + 1) {
      const encoding = bytes[frameStart];
      const value = decodeTextBytes(bytes.slice(frameStart + 1, frameEnd), encoding);
      if (frameId === "TIT2" && value)
        title = value;
      if (frameId === "TPE1" && value)
        artist = value;
      if (frameId === "TALB" && value)
        album = value;
    }
    offset += 10 + frameSize;
  }
  return {
    artworkUrl,
    title,
    artist,
    album
  };
};
var getAudioMetadata = (file) => __async(void 0, null, function* () {
  if ((file.kind || "") !== "audio")
    return null;
  if (audioMetadataCache.has(file.path))
    return audioMetadataCache.get(file.path);
  let metadata = {
    artworkUrl: null,
    title: null,
    artist: null,
    album: null
  };
  if ((file.path.split(".").pop() || "").toLowerCase() === "mp3") {
    try {
      const response = yield fetch(file.uri);
      const buffer = yield response.arrayBuffer();
      metadata = parseMp3Metadata(buffer);
    } catch (error) {
      metadata = {
        artworkUrl: null,
        title: null,
        artist: null,
        album: null
      };
    }
  }
  audioMetadataCache.set(file.path, metadata);
  return metadata;
});
var getAudioArtworkUrl = (file) => __async(void 0, null, function* () {
  if ((file.kind || "") !== "audio")
    return null;
  if (audioArtworkCache.has(file.path))
    return audioArtworkCache.get(file.path);
  const metadata = yield getAudioMetadata(file);
  const artworkUrl = (metadata == null ? void 0 : metadata.artworkUrl) || null;
  audioArtworkCache.set(file.path, artworkUrl);
  return artworkUrl;
});
var buildWaveformBars = (arrayBuffer) => __async(void 0, null, function* () {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor)
    return null;
  const ctx = new AudioContextCtor();
  try {
    const audioBuffer = yield ctx.decodeAudioData(arrayBuffer.slice(0));
    const channel = audioBuffer.getChannelData(0);
    const bars = 40;
    const blockSize = Math.max(1, Math.floor(channel.length / bars));
    const values = [];
    let maxValue = 0;
    for (let bar = 0; bar < bars; bar++) {
      let peak = 0;
      const start = bar * blockSize;
      const end = Math.min(channel.length, start + blockSize);
      for (let index = start; index < end; index++) {
        const amplitude = Math.abs(channel[index]);
        if (amplitude > peak)
          peak = amplitude;
      }
      maxValue = Math.max(maxValue, peak);
      values.push(peak);
    }
    if (maxValue <= 0)
      return values;
    return values.map((value) => Math.pow(value / maxValue, 0.75));
  } catch (error) {
    return null;
  } finally {
    yield ctx.close();
  }
});
var getAudioWaveform = (file, enabled) => __async(void 0, null, function* () {
  if (!enabled || (file.kind || "") !== "audio")
    return null;
  if (audioWaveformCache.has(file.path))
    return audioWaveformCache.get(file.path);
  let waveform = null;
  try {
    const response = yield fetch(file.uri);
    const buffer = yield response.arrayBuffer();
    waveform = yield buildWaveformBars(buffer);
  } catch (error) {
    waveform = null;
  }
  audioWaveformCache.set(file.path, waveform);
  return waveform;
});
var getSpectrogramBandMagnitude = (channel, start, windowSize, bin) => {
  const omega = 2 * Math.PI * bin / windowSize;
  const coeff = 2 * Math.cos(omega);
  let prev = 0;
  let prev2 = 0;
  for (let index = 0; index < windowSize; index++) {
    const sample = channel[start + index] || 0;
    const value = sample + coeff * prev - prev2;
    prev2 = prev;
    prev = value;
  }
  const power = prev * prev + prev2 * prev2 - coeff * prev * prev2;
  return Math.sqrt(Math.max(0, power)) / windowSize;
};
var buildSpectrogramData = (arrayBuffer) => __async(void 0, null, function* () {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor)
    return null;
  const ctx = new AudioContextCtor();
  try {
    const audioBuffer = yield ctx.decodeAudioData(arrayBuffer.slice(0));
    const channel = audioBuffer.getChannelData(0);
    const slices = 32;
    const bands = 14;
    const windowSize = 384;
    const maxBin = 88;
    const sliceSize = Math.max(windowSize, Math.floor(channel.length / slices));
    const data = [];
    const centerBins = Array.from({ length: bands }, (_, band) => {
      const ratio = band / Math.max(1, bands - 1);
      return Math.max(1, Math.round(Math.exp(Math.log(1) + ratio * (Math.log(maxBin) - Math.log(1)))));
    });
    let maxEnergy = 0;
    for (let slice = 0; slice < slices; slice++) {
      const start = Math.min(channel.length - windowSize, slice * sliceSize);
      const row = [];
      for (let band = 0; band < centerBins.length; band++) {
        const normalizedBandEnergy = getSpectrogramBandMagnitude(channel, start, windowSize, centerBins[band]);
        row.push(normalizedBandEnergy);
        if (normalizedBandEnergy > maxEnergy)
          maxEnergy = normalizedBandEnergy;
      }
      data.push(row);
    }
    if (maxEnergy <= 0)
      return data;
    return data.map((row, rowIndex) => row.map((value, bandIndex) => {
      const normalized = value / maxEnergy;
      const lifted = Math.pow(normalized, 0.36);
      const bandBias = 0.86 + bandIndex / Math.max(1, bands - 1) * 0.44;
      const timeBias = 0.92 + 0.08 * Math.sin(rowIndex / Math.max(1, slices - 1) * Math.PI);
      return Math.max(0.06, Math.min(1, lifted * bandBias * timeBias));
    }));
  } catch (error) {
    return null;
  } finally {
    yield ctx.close();
  }
});
var getAudioSpectrogram = (file, enabled) => __async(void 0, null, function* () {
  if (!enabled || !galleryRuntimeSettings.enableAudioVisualizations || (file.kind || "") !== "audio")
    return null;
  if (audioSpectrogramCache.has(file.path))
    return audioSpectrogramCache.get(file.path);
  let spectrogram = null;
  try {
    const response = yield fetch(file.uri);
    const buffer = yield response.arrayBuffer();
    spectrogram = yield buildSpectrogramData(buffer);
  } catch (error) {
    spectrogram = null;
  }
  audioSpectrogramCache.set(file.path, spectrogram);
  return spectrogram;
});
var renderWaveform = (container, values) => {
  container.empty();
  if (!values || !values.length)
    return;
  values.forEach((value) => {
    const bar = container.createEl("span", { cls: "img-gallery-audio-waveform-bar" });
    bar.style.height = `${Math.max(8, Math.round(value * 44))}px`;
  });
};
var renderSpectrogram = (container, values) => {
  container.empty();
  if (!values || !values.length)
    return;
  const canvas = container.createEl("canvas", { cls: "img-gallery-audio-spectrogram-canvas" });
  const columns = values.length;
  const rows = Math.max(...values.map((column) => column.length), 1);
  const cssWidth = Math.max(180, columns * 5);
  const cssHeight = 56;
  const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(cssWidth * pixelRatio);
  canvas.height = Math.round(cssHeight * pixelRatio);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    return;
  const accentColor = getComputedStyle(document.body).getPropertyValue("--interactive-accent").trim() || "#7c3aed";
  ctx.scale(pixelRatio, pixelRatio);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  ctx.fillStyle = accentColor;
  const gap = 1;
  const columnWidth = Math.max(2, (cssWidth - gap * Math.max(0, columns - 1)) / columns);
  const rowHeight = Math.max(2, (cssHeight - gap * Math.max(0, rows - 1)) / rows);
  values.forEach((column, columnIndex) => {
    column.forEach((level, rowIndex) => {
      const intensity = Math.max(0.06, Math.min(1, level));
      const alpha = 0.14 + intensity * 0.86;
      const x = columnIndex * (columnWidth + gap);
      const y = cssHeight - rowHeight - rowIndex * (rowHeight + gap);
      const inset = intensity < 0.14 ? 0.6 : 0;
      ctx.globalAlpha = alpha;
      ctx.fillRect(x + inset, y + inset, Math.max(1, columnWidth - inset * 2), Math.max(1, rowHeight - inset * 2));
    });
  });
  ctx.globalAlpha = 1;
};
var isSearchEverywherePath = (path) => {
  return !path || path === "." || path === "/" || path === "*" || path === "**";
};
var hasWildcardPattern = (path) => {
  return typeof path === "string" && /[*?]/.test(path);
};
var isRecursiveGlobPath = (path) => {
  return typeof path === "string" && /\/\*\*$/.test(path);
};
var isShallowGlobPath = (path) => {
  return typeof path === "string" && /\/\*$/.test(path) && !isRecursiveGlobPath(path);
};
var normalizeMediaSearchPath = (path) => {
  if (isRecursiveGlobPath(path))
    return (0, import_obsidian.normalizePath)(path.slice(0, -3));
  if (isShallowGlobPath(path))
    return (0, import_obsidian.normalizePath)(path.slice(0, -2));
  return (0, import_obsidian.normalizePath)(path);
};
var normalizeListSetting = (value) => {
  if (Array.isArray(value))
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  if (typeof value !== "string")
    return [];
  const normalized = value.trim().replace(/^\[(.*)\]$/, "$1");
  return normalized.split(",").map((item) => item.trim()).filter(Boolean);
};
var escapeRegex = (value) => value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
var createPathPatternMatcher = (pattern, allowFlexible) => {
  if (!pattern)
    return () => false;
  const normalizedPattern = `${pattern}`.trim().replace(/\\/g, "/").replace(/\/+/g, "/");
  if (isSearchEverywherePath(normalizedPattern))
    return () => true;
  if (isRecursiveGlobPath(normalizedPattern)) {
    const basePath = normalizeMediaSearchPath(normalizedPattern);
    return (filePath) => filePath === basePath || filePath.startsWith(`${basePath}/`);
  }
  if (isShallowGlobPath(normalizedPattern)) {
    const basePath = normalizeMediaSearchPath(normalizedPattern);
    return (filePath) => {
      var _a;
      const parentPath = (_a = filePath.split("/").slice(0, -1).join("/")) != null ? _a : "";
      return parentPath === basePath;
    };
  }
  if (allowFlexible && hasWildcardPattern(normalizedPattern)) {
    const regexPattern = `^${escapeRegex(normalizedPattern).replace(/\*\*/g, "::DOUBLE_STAR::").replace(/\*/g, "[^/]*").replace(/\\\?/g, "[^/]").replace(/::DOUBLE_STAR::/g, ".*")}$`;
    const regex = new RegExp(regexPattern);
    return (filePath) => regex.test(filePath);
  }
  const exactPath = (0, import_obsidian.normalizePath)(normalizedPattern);
  return (filePath) => filePath === exactPath || filePath.startsWith(`${exactPath}/`);
};
var getMediaItemPath = (item) => {
  var _a, _b;
  return (_b = (_a = item == null ? void 0 : item.path) != null ? _a : item == null ? void 0 : item.uri) != null ? _b : "";
};
var getMediaItemExtension = (item) => {
  var _a;
  if ((_a = item == null ? void 0 : item.extension) != null)
    return `${item.extension}`.toLowerCase();
  const normalizedPath = getMediaItemPath(item).split("?")[0].split("#")[0];
  const extension = normalizedPath.split(".").pop() || "";
  return extension.toLowerCase();
};
var createMediaItemFilter = (settings) => {
  const allowedExtensions = new Set(normalizeListSetting(settings.extensions).map((extension) => extension.replace(/^\./, "").toLowerCase()).filter(Boolean));
  const excludeMatchers = normalizeListSetting(settings.exclude).map((pattern) => createPathPatternMatcher(pattern, galleryRuntimeSettings.enableFlexiblePathPatterns));
  return (item) => {
    const itemPath = getMediaItemPath(item);
    if (allowedExtensions.size && !allowedExtensions.has(getMediaItemExtension(item)))
      return false;
    if (excludeMatchers.some((matcher) => matcher(itemPath)))
      return false;
    return true;
  };
};
var createMediaEntry = (app2, file) => {
  return {
    name: file.name,
    folder: file.parent.path,
    path: file.path,
    uri: app2.vault.adapter.getResourcePath(file.path),
    kind: getMediaKindFromPath(file.path)
  };
};
var createImageEntry = createMediaEntry;
var getMediaDisplayName = (file) => {
  const name = file.name || "";
  const lastDotIndex = name.lastIndexOf(".");
  return lastDotIndex > 0 ? name.slice(0, lastDotIndex) : name;
};
var getAudioSubtitle = (metadata) => {
  if (!metadata)
    return "";
  if (metadata.artist && metadata.album)
    return `${metadata.artist} • ${metadata.album}`;
  return metadata.artist || metadata.album || "";
};
var resolveMediaFromLink = (app2, link, sourcePath) => {
  const normalizedLink = link.trim();
  if (!normalizedLink)
    return null;
  if (/^https?:\/\//i.test(normalizedLink)) {
    const cleanUrl = normalizedLink;
    return {
      name: cleanUrl.split("/").pop() || cleanUrl,
      folder: "",
      path: cleanUrl,
      uri: cleanUrl,
      kind: getMediaKindFromPath(cleanUrl)
    };
  }
  const cleanLink = normalizedLink.split("|")[0].split("#")[0].trim();
  const resolved = app2.metadataCache.getFirstLinkpathDest(cleanLink, sourcePath) || app2.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(cleanLink));
  if (isVaultMedia(resolved))
    return createMediaEntry(app2, resolved);
  return null;
};
var resolveImageFromLink = resolveMediaFromLink;
var parseExplicitMediaList = (app2, container, src, sourcePath) => {
  const lines = src.split("\n").map((line) => line.trim()).filter(Boolean);
  const images = [];
  lines.forEach((line) => {
    var _a;
    let candidate = null;
    const wikiMatch = line.match(/^!?\[\[(.+?)\]\]$/);
    const markdownMatch = line.match(/^!\[[^\]]*\]\((.+?)\)$/);
    if (wikiMatch) {
      candidate = resolveMediaFromLink(app2, wikiMatch[1], sourcePath);
    } else if (markdownMatch) {
      candidate = resolveMediaFromLink(app2, markdownMatch[1], sourcePath);
    } else if (/^(https?:\/\/|[^:]+\.(?:jpe?g|gif|png|webp|tiff?|bmp|svg|avif|mp4|webm|mov|m4v|ogv|mp3|m4a|wav|ogg|oga|flac|aac|opus))$/i.test(line)) {
      candidate = resolveMediaFromLink(app2, line, sourcePath);
    }
    if (candidate)
      images.push(candidate);
    else if (wikiMatch || markdownMatch)
      new import_obsidian.Notice(`Media Gallery: cannot resolve ${((_a = wikiMatch == null ? void 0 : wikiMatch[1]) != null ? _a : markdownMatch == null ? void 0 : markdownMatch[1]) || line}`);
  });
  return images;
};
var parseExplicitImageList = parseExplicitMediaList;
var mergeMediaEntries = (baseEntries, extraEntries) => {
  const merged = [];
  const seenPaths = /* @__PURE__ */ new Set();
  [...baseEntries, ...extraEntries].forEach((entry) => {
    const key = entry.path || entry.uri || entry.name;
    if (seenPaths.has(key))
      return;
    seenPaths.add(key);
    merged.push(entry);
  });
  return merged;
};
var parseExplicitBlock = (app2, container, src, sourcePath) => {
  const lines = src.split("\n").map((line) => line.trim()).filter(Boolean);
  const overrides = {};
  const imageLines = [];
  const knownKeys = /* @__PURE__ */ new Set(["type", "radius", "gutter", "sortby", "sort", "mobile", "columns", "height", "path", "fit", "waveform", "spectrogram", "extensions", "exclude"]);
  lines.forEach((line) => {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+)$/);
    if (!match) {
      imageLines.push(line);
      return;
    }
    const key = match[1].toLowerCase();
    const rawValue = match[2].trim();
    if (!knownKeys.has(key)) {
      imageLines.push(line);
      return;
    }
    if (["radius", "gutter", "mobile", "columns", "height"].includes(key)) {
      const numeric = Number(rawValue);
      if (!Number.isNaN(numeric))
        overrides[key] = numeric;
      return;
    }
    if (key === "waveform" || key === "spectrogram") {
      overrides[key] = /^(true|1|yes|on)$/i.test(rawValue);
      return;
    }
    if (key === "extensions" || key === "exclude") {
      overrides[key] = normalizeListSetting(rawValue);
      return;
    }
    overrides[key] = rawValue;
  });
  return {
    images: parseExplicitMediaList(app2, container, imageLines.join("\n"), sourcePath),
    overrides
  };
};
var getImagesList = (plugin, app2, container, settings) => {
  const requestedPath = settings.path;
  const shouldSearchEverywhere = isSearchEverywherePath(requestedPath);
  const usesPathGlob = isRecursiveGlobPath(requestedPath) || isShallowGlobPath(requestedPath);
  const usesFlexiblePattern = galleryRuntimeSettings.enableFlexiblePathPatterns && hasWildcardPattern(requestedPath) && !shouldSearchEverywhere && !usesPathGlob;
  let files = [];
  if (shouldSearchEverywhere || usesPathGlob || usesFlexiblePattern) {
    files = plugin.getCachedMediaFiles();
  } else {
    const folder = app2.vault.getAbstractFileByPath(requestedPath);
    if (!(folder instanceof import_obsidian.TFolder)) {
      const error = "The folder doesn't exist!";
      render_error_default(container, error);
      throw new Error(error);
    }
    files = plugin.getCachedMediaFiles(folder.path);
  }
  let mediaFiles = files.filter((file) => isVaultMedia(file));
  if (usesFlexiblePattern) {
    const pathMatcher = createPathPatternMatcher(requestedPath, true);
    mediaFiles = mediaFiles.filter((file) => pathMatcher(file.path));
  }
  mediaFiles = mediaFiles.filter(createMediaItemFilter(settings));
  if (!mediaFiles.length) {
    const error = shouldSearchEverywhere ? "No images found in the vault!" : "No images found in this folder tree!";
    render_error_default(container, error);
    throw new Error(error);
  }
  const orderedImages = mediaFiles.sort((a, b) => {
    const refA = settings.sortby === "name" ? a["name"].toUpperCase() : a.stat[settings.sortby];
    const refB = settings.sortby === "name" ? b["name"].toUpperCase() : b.stat[settings.sortby];
    return refA < refB ? -1 : refA > refB ? 1 : 0;
  });
  const sortedImages = settings.sort === "asc" ? orderedImages : orderedImages.reverse();
  return sortedImages.map((file) => createMediaEntry(app2, file));
};
var get_imgs_list_default = getImagesList;

// src/get-settings.ts
var import_obsidian2 = __toModule(require("obsidian"));
var getSettings = (src, container) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const normalizedSettingsSrc = src.replace(/^(\s*path\s*:\s*)(\*{1,2})(\s*)$/gm, '$1"$2"$3');
  const settingsSrc = (0, import_obsidian2.parseYaml)(normalizedSettingsSrc);
  if (settingsSrc === void 0) {
    const error = "Cannot parse YAML!";
    render_error_default(container, error);
    throw new Error(error);
  }
  const settings = {
    path: void 0,
    type: void 0,
    radius: void 0,
    gutter: void 0,
    sortby: void 0,
    sort: void 0,
    fit: void 0,
    waveform: void 0,
    spectrogram: void 0,
    extensions: void 0,
    exclude: void 0,
    mobile: void 0,
    columns: void 0,
    height: void 0
  };
  settings.path = settingsSrc.path ? (0, import_obsidian2.normalizePath)(settingsSrc.path) : "*";
  settings.type = (_a = settingsSrc.type) != null ? _a : "vertical";
  settings.radius = (_b = settingsSrc.radius) != null ? _b : 0;
  settings.gutter = (_c = settingsSrc.gutter) != null ? _c : 8;
  settings.sortby = (_d = settingsSrc.sortby) != null ? _d : "ctime";
  settings.sort = (_e = settingsSrc.sort) != null ? _e : "desc";
  settings.fit = (_f = settingsSrc.fit) != null ? _f : "cover";
  settings.waveform = (_g = settingsSrc.waveform) != null ? _g : true;
  settings.spectrogram = (_h = settingsSrc.spectrogram) != null ? _h : false;
  settings.extensions = normalizeListSetting(settingsSrc.extensions);
  settings.exclude = normalizeListSetting(settingsSrc.exclude);
  settings.mobile = (_i = settingsSrc.mobile) != null ? _i : 1;
  if (import_obsidian2.Platform.isDesktop)
    settings.columns = (_j = settingsSrc.columns) != null ? _j : 3;
  else
    settings.columns = settings.mobile;
  settings.height = (_k = settingsSrc.height) != null ? _k : 260;
  return settings;
};
var get_settings_default = getSettings;
var getDefaultGallerySettings = (type = "vertical") => {
  return {
    path: "*",
    type,
    radius: 0,
    gutter: 8,
    sortby: "ctime",
    sort: "desc",
    fit: type === "mosaic" ? "contain" : "cover",
    waveform: true,
    spectrogram: false,
    extensions: [],
    exclude: [],
    mobile: 1,
    columns: import_obsidian2.Platform.isDesktop ? 3 : 1,
    height: 260
  };
};
var applyMediaFigureAttrs = (figure, file) => {
  figure.setAttribute("data-name", file.name);
  figure.setAttribute("data-folder", file.folder);
  figure.setAttribute("data-path", file.path);
  figure.setAttribute("data-media-kind", file.kind || "image");
  if ((file.kind || "image") === "image") {
    figure.setAttribute("data-src", file.uri);
  }
};
var appendAudioVisualization = (meta, file, settings) => {
  if (!galleryRuntimeSettings.enableAudioVisualizations)
    return;
  if (settings.spectrogram) {
    const spectrogram = meta.createEl("div", { cls: "img-gallery-audio-spectrogram" });
    getAudioSpectrogram(file, true).then((values) => {
      renderSpectrogram(spectrogram, values);
    });
    return;
  }
  if (!settings.waveform)
    return;
  const waveform = meta.createEl("div", { cls: "img-gallery-audio-waveform" });
  getAudioWaveform(file, true).then((values) => {
    renderWaveform(waveform, values);
  });
};
var fillAudioPreviewMetadata = (file, nameEl, subtitleEl) => {
  getAudioMetadata(file).then((metadata) => {
    nameEl.setText((metadata == null ? void 0 : metadata.title) || getMediaDisplayName(file));
    subtitleEl.setText(getAudioSubtitle(metadata));
    subtitleEl.toggleClass("is-empty", !subtitleEl.getText());
  });
};
var fillAudioPreviewArtwork = (file, cover) => {
  getAudioArtworkUrl(file).then((artworkUrl) => {
    if (!artworkUrl)
      return;
    cover.empty();
    const img = cover.createEl("img", { cls: "img-gallery-audio-cover-image" });
    img.src = artworkUrl;
    img.alt = file.name;
  });
};
var appendAudioPreview = (figure, file, settings) => {
  figure.addClass("img-gallery-audio-item");
  const audioCard = figure.createEl("div", { cls: "img-gallery-audio-card" });
  const cover = audioCard.createEl("div", { cls: "img-gallery-audio-cover" });
  cover.createEl("div", { cls: "img-gallery-audio-icon", text: "♪" });
  const meta = audioCard.createEl("div", { cls: "img-gallery-audio-meta" });
  const nameEl = meta.createEl("div", { cls: "img-gallery-audio-name", text: getMediaDisplayName(file) });
  const subtitleEl = meta.createEl("div", { cls: "img-gallery-audio-subtitle is-empty" });
  meta.createEl("div", { cls: "img-gallery-audio-kind", text: (file.path.split(".").pop() || "audio").toUpperCase() });
  appendAudioVisualization(meta, file, settings);
  fillAudioPreviewMetadata(file, nameEl, subtitleEl);
  fillAudioPreviewArtwork(file, cover);
  return audioCard;
};
var appendPreviewMedia = (figure, file, settings) => {
  if ((file.kind || "image") === "video") {
    figure.addClass("img-gallery-video-item");
    const video = figure.createEl("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = file.uri;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = settings.fit || "cover";
    video.style.objectPosition = "center center";
    video.style.display = "block";
    video.addEventListener("mouseenter", () => {
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function")
        playAttempt.catch(() => {
        });
    });
    video.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });
    return video;
  }
  if ((file.kind || "image") === "audio")
    return appendAudioPreview(figure, file, settings);
  const img = figure.createEl("img");
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = settings.fit || "cover";
  img.style.objectPosition = "center center";
  img.style.display = "block";
  img.src = file.uri;
  return img;
};

// src/build-horizontal.ts
var buildHorizontal = (container, imagesList, settings) => {
  const gallery = container.createEl("div");
  gallery.addClass("grid-wrapper");
  gallery.style.display = "flex";
  gallery.style.flexWrap = "wrap";
  gallery.style.marginRight = `-${settings.gutter}px`;
  imagesList.forEach((file) => {
    const figure = gallery.createEl("figure");
    figure.addClass("grid-item");
    figure.style.margin = `0px ${settings.gutter}px ${settings.gutter}px 0px`;
    figure.style.width = "auto";
    figure.style.height = `${settings.height}px`;
    figure.style.borderRadius = `${settings.radius}px`;
    figure.style.flex = "1 0 auto";
    figure.style.overflow = "hidden";
    figure.style.cursor = "pointer";
    applyMediaFigureAttrs(figure, file);
    const media = appendPreviewMedia(figure, file, settings);
    media.style.borderRadius = "0px";
  });
  return gallery;
};
var build_horizontal_default = buildHorizontal;

// src/build-vertical.ts
var buildVertical = (container, imagesList, settings) => {
  const gallery = container.createEl("div");
  gallery.addClass("grid-wrapper");
  gallery.style.lineHeight = "0px";
  gallery.style.columnCount = `${settings.columns}`;
  gallery.style.columnGap = `${settings.gutter}px`;
  imagesList.forEach((file) => {
    const figure = gallery.createEl("div");
    figure.addClass("grid-item");
    figure.style.marginBottom = `${settings.gutter}px`;
    figure.style.width = "100%";
    figure.style.height = "auto";
    figure.style.display = "inline-block";
    figure.style.breakInside = "avoid";
    figure.style.webkitColumnBreakInside = "avoid";
    figure.style.boxSizing = "border-box";
    figure.style.cursor = "pointer";
    applyMediaFigureAttrs(figure, file);
    const media = appendPreviewMedia(figure, file, settings);
    media.style.borderRadius = `${settings.radius}px`;
  });
  return gallery;
};
var build_vertical_default = buildVertical;
var buildCollage = (container, imagesList, settings) => {
  const gallery = container.createEl("div");
  const imagesCount = imagesList.length;
  gallery.addClass("grid-wrapper");
  gallery.style.display = "grid";
  if (imagesCount === 1) {
    gallery.style.gridTemplateColumns = "minmax(0, 1fr)";
  } else if (imagesCount === 2) {
    gallery.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  } else if (imagesCount === 3) {
    gallery.style.gridTemplateColumns = "1.35fr 1fr";
  } else if (imagesCount === 4) {
    gallery.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  } else {
    gallery.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  }
  gallery.style.gridAutoRows = `${Math.max(150, Math.round(settings.height * 0.72))}px`;
  gallery.style.gap = `${settings.gutter}px`;
  imagesList.forEach((file, index) => {
    const figure = gallery.createEl("figure");
    figure.addClass("grid-item");
    figure.style.margin = "0";
    figure.style.borderRadius = `${settings.radius}px`;
    figure.style.overflow = "hidden";
    figure.style.backgroundColor = "var(--background-secondary)";
    figure.style.cursor = "pointer";
    if (imagesCount === 1) {
      figure.style.aspectRatio = "16 / 10";
    } else if (imagesCount === 2) {
      figure.style.aspectRatio = "4 / 3";
    } else if (imagesCount === 3) {
      if (index === 0) {
        figure.style.gridRow = "span 2";
        figure.style.aspectRatio = "4 / 5";
      } else {
        figure.style.aspectRatio = "4 / 3";
      }
    } else if (imagesCount === 5) {
      if (index === 0) {
        figure.style.gridColumn = "span 2";
        figure.style.gridRow = "span 2";
        figure.style.aspectRatio = "16 / 10";
      } else {
        figure.style.aspectRatio = "4 / 3";
      }
    } else if (imagesCount >= 6 && index === 0) {
      figure.style.gridColumn = "span 2";
      figure.style.gridRow = "span 2";
      figure.style.aspectRatio = "16 / 10";
    } else {
      figure.style.aspectRatio = "4 / 3";
    }
    applyMediaFigureAttrs(figure, file);
    appendPreviewMedia(figure, file, settings);
  });
  return gallery;
};
var build_collage_default = buildCollage;

// src/build-lightbox.ts
var import_obsidian3 = __toModule(require("obsidian"));
var getVideoModal = (() => {
  let modal = null;
  let video = null;
  let title = null;
  let close = null;
  let escHandler = null;
  return () => {
    const openModal = (file) => {
      title.setText(file.name);
      video.src = file.uri;
      modal.removeClass("img-gallery-video-modal-hidden");
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function")
        playAttempt.catch(() => {
        });
    };
    if (modal)
      return {
        open: openModal
      };
    modal = document.body.createEl("div", { cls: "img-gallery-video-modal img-gallery-video-modal-hidden" });
    const content = modal.createEl("div", { cls: "img-gallery-video-modal-content" });
    title = content.createEl("div", { cls: "img-gallery-video-modal-title" });
    close = content.createEl("button", { cls: "img-gallery-video-modal-close", text: "×" });
    video = content.createEl("video", { cls: "img-gallery-video-modal-player" });
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    const closeModal = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      modal.addClass("img-gallery-video-modal-hidden");
    };
    modal.addEventListener("click", (event) => {
      if (event.target === modal)
        closeModal();
    });
    close.addEventListener("click", closeModal);
    escHandler = (event) => {
      if (event.key === "Escape" && !modal.hasClass("img-gallery-video-modal-hidden"))
        closeModal();
    };
    document.addEventListener("keydown", escHandler);
    return {
      open: openModal
    };
  };
})();
var getAudioModal = (() => {
  let modal = null;
  let audio = null;
  let title = null;
  let subtitle = null;
  let close = null;
  let cover = null;
  let escHandler = null;
  return () => {
    const openModal = (file) => {
      title.setText(getMediaDisplayName(file));
      subtitle.setText("");
      audio.src = file.uri;
      audio.type = getAudioMimeType(file.path);
      audio.currentTime = 0;
      cover.empty();
      cover.addClass("img-gallery-audio-modal-cover-empty");
      getAudioMetadata(file).then((metadata) => {
        title.setText((metadata == null ? void 0 : metadata.title) || getMediaDisplayName(file));
        subtitle.setText(getAudioSubtitle(metadata));
        subtitle.toggleClass("is-empty", !subtitle.getText());
      });
      getAudioArtworkUrl(file).then((artworkUrl) => {
        if (!artworkUrl)
          return;
        cover.removeClass("img-gallery-audio-modal-cover-empty");
        const img = cover.createEl("img", { cls: "img-gallery-audio-modal-cover-image" });
        img.src = artworkUrl;
        img.alt = file.name;
      });
      modal.removeClass("img-gallery-audio-modal-hidden");
      if (galleryRuntimeSettings.autoplayAudioOnOpen) {
        const playAttempt = audio.play();
        if (playAttempt && typeof playAttempt.catch === "function")
          playAttempt.catch(() => {
          });
      }
    };
    if (modal)
      return {
        open: openModal
      };
    modal = document.body.createEl("div", { cls: "img-gallery-audio-modal img-gallery-audio-modal-hidden" });
    const content = modal.createEl("div", { cls: "img-gallery-audio-modal-content" });
    title = content.createEl("div", { cls: "img-gallery-audio-modal-title" });
    subtitle = content.createEl("div", { cls: "img-gallery-audio-modal-subtitle is-empty" });
    close = content.createEl("button", { cls: "img-gallery-audio-modal-close", text: "×" });
    cover = content.createEl("div", { cls: "img-gallery-audio-modal-cover img-gallery-audio-modal-cover-empty" });
    audio = content.createEl("audio", { cls: "img-gallery-audio-modal-player" });
    audio.controls = true;
    audio.preload = "metadata";
    const closeModal = () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      modal.addClass("img-gallery-audio-modal-hidden");
    };
    modal.addEventListener("click", (event) => {
      if (event.target === modal)
        closeModal();
    });
    close.addEventListener("click", closeModal);
    escHandler = (event) => {
      if (event.key === "Escape" && !modal.hasClass("img-gallery-audio-modal-hidden"))
        closeModal();
    };
    document.addEventListener("keydown", escHandler);
    return {
      open: openModal
    };
  };
})();

var clampZoomValue = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
};
var installCustomZoom = (galleryLightbox) => {
  const zoomState = {
    scale: 1,
    x: 0,
    y: 0,
    dragging: false,
    startX: 0,
    startY: 0,
    moved: false
  };
  const getCurrentImage = () => {
    var _a;
    return (_a = galleryLightbox == null ? void 0 : galleryLightbox.outer) == null ? void 0 : _a.get().querySelector(".lg-current .lg-image");
  };
  const getCurrentWrap = () => {
    const image = getCurrentImage();
    return image == null ? void 0 : image.closest(".lg-img-wrap");
  };
  const updateCursor = (image) => {
    if (!image)
      return;
    image.style.cursor = zoomState.scale > 1 ? zoomState.dragging ? "grabbing" : "grab" : "zoom-in";
  };
  const clampOffsets = (image) => {
    const wrap = getCurrentWrap();
    if (!image || !wrap)
      return;
    const maxX = Math.max(0, image.clientWidth * (zoomState.scale - 1) / 2);
    const maxY = Math.max(0, image.clientHeight * (zoomState.scale - 1) / 2);
    zoomState.x = clampZoomValue(zoomState.x, -maxX, maxX);
    zoomState.y = clampZoomValue(zoomState.y, -maxY, maxY);
  };
  const applyZoom = () => {
    const image = getCurrentImage();
    const wrap = getCurrentWrap();
    if (!image || !wrap)
      return;
    clampOffsets(image);
    wrap.classList.toggle("img-gallery-zoomed", zoomState.scale > 1);
    image.style.transformOrigin = "center center";
    image.style.transform = zoomState.scale > 1 ? `translate3d(${zoomState.x}px, ${zoomState.y}px, 0) scale(${zoomState.scale})` : "translate3d(0, 0, 0) scale(1)";
    image.style.transition = zoomState.dragging ? "none" : "transform 120ms ease";
    updateCursor(image);
  };
  const resetZoom = () => {
    zoomState.scale = 1;
    zoomState.x = 0;
    zoomState.y = 0;
    zoomState.dragging = false;
    zoomState.moved = false;
    applyZoom();
  };
  const setZoom = (nextScale) => {
    zoomState.scale = clampZoomValue(nextScale, 1, 6);
    if (zoomState.scale === 1) {
      zoomState.x = 0;
      zoomState.y = 0;
    }
    applyZoom();
  };
  const handleWheel = (event) => {
    const image = getCurrentImage();
    if (!image || !image.contains(event.target))
      return;
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.35 : -0.35;
    setZoom(zoomState.scale + delta);
  };
  const handlePointerDown = (event) => {
    if (zoomState.scale <= 1)
      return;
    const image = getCurrentImage();
    if (!image || !image.contains(event.target))
      return;
    zoomState.dragging = true;
    zoomState.startX = event.clientX - zoomState.x;
    zoomState.startY = event.clientY - zoomState.y;
    zoomState.moved = false;
    updateCursor(image);
    event.preventDefault();
    event.stopPropagation();
  };
  const handlePointerMove = (event) => {
    if (!zoomState.dragging)
      return;
    zoomState.x = event.clientX - zoomState.startX;
    zoomState.y = event.clientY - zoomState.startY;
    zoomState.moved = true;
    applyZoom();
    event.preventDefault();
  };
  const handlePointerUp = (event) => {
    if (!zoomState.dragging)
      return;
    zoomState.dragging = false;
    applyZoom();
    event.preventDefault();
  };
  const handleDblClick = (event) => {
    const image = getCurrentImage();
    if (!image || !image.contains(event.target))
      return;
    event.preventDefault();
    setZoom(zoomState.scale > 1 ? 1 : 2.5);
  };
  const handleClick = (event) => {
    const image = getCurrentImage();
    if (!image || !image.contains(event.target) || zoomState.moved) {
      zoomState.moved = false;
      return;
    }
    if (zoomState.scale > 1) {
      event.preventDefault();
      resetZoom();
    }
  };
  galleryLightbox.LGel.on("lgAfterOpen.imgGalleryZoom", () => {
    resetZoom();
  });
  galleryLightbox.LGel.on("lgAfterSlide.imgGalleryZoom", () => {
    resetZoom();
  });
  galleryLightbox.LGel.on("lgBeforeClose.imgGalleryZoom", () => {
    resetZoom();
  });
  document.addEventListener("wheel", handleWheel, { passive: false });
  document.addEventListener("pointerdown", handlePointerDown, true);
  document.addEventListener("pointermove", handlePointerMove, true);
  document.addEventListener("pointerup", handlePointerUp, true);
  document.addEventListener("pointercancel", handlePointerUp, true);
  document.addEventListener("dblclick", handleDblClick, true);
  document.addEventListener("click", handleClick, true);
  return () => {
    document.removeEventListener("wheel", handleWheel);
    document.removeEventListener("pointerdown", handlePointerDown, true);
    document.removeEventListener("pointermove", handlePointerMove, true);
    document.removeEventListener("pointerup", handlePointerUp, true);
    document.removeEventListener("pointercancel", handlePointerUp, true);
    document.removeEventListener("dblclick", handleDblClick, true);
    document.removeEventListener("click", handleClick, true);
  };
};

// node_modules/lightgallery/lightgallery.es5.js
var __assign = function() {
  __assign = Object.assign || function __assign3(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++)
    s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
      r[k] = a[j];
  return r;
}
var lGEvents = {
  afterAppendSlide: "lgAfterAppendSlide",
  init: "lgInit",
  hasVideo: "lgHasVideo",
  containerResize: "lgContainerResize",
  updateSlides: "lgUpdateSlides",
  afterAppendSubHtml: "lgAfterAppendSubHtml",
  beforeOpen: "lgBeforeOpen",
  afterOpen: "lgAfterOpen",
  slideItemLoad: "lgSlideItemLoad",
  beforeSlide: "lgBeforeSlide",
  afterSlide: "lgAfterSlide",
  posterClick: "lgPosterClick",
  dragStart: "lgDragStart",
  dragMove: "lgDragMove",
  dragEnd: "lgDragEnd",
  beforeNextSlide: "lgBeforeNextSlide",
  beforePrevSlide: "lgBeforePrevSlide",
  beforeClose: "lgBeforeClose",
  afterClose: "lgAfterClose",
  rotateLeft: "lgRotateLeft",
  rotateRight: "lgRotateRight",
  flipHorizontal: "lgFlipHorizontal",
  flipVertical: "lgFlipVertical",
  autoplay: "lgAutoplay",
  autoplayStart: "lgAutoplayStart",
  autoplayStop: "lgAutoplayStop"
};
var lightGalleryCoreSettings = {
  mode: "lg-slide",
  easing: "ease",
  speed: 400,
  licenseKey: "0000-0000-000-0000",
  height: "100%",
  width: "100%",
  addClass: "",
  startClass: "lg-start-zoom",
  backdropDuration: 300,
  container: "",
  startAnimationDuration: 400,
  zoomFromOrigin: true,
  hideBarsDelay: 0,
  showBarsAfter: 1e4,
  slideDelay: 0,
  supportLegacyBrowser: true,
  allowMediaOverlap: false,
  videoMaxSize: "1280-720",
  loadYouTubePoster: true,
  defaultCaptionHeight: 0,
  ariaLabelledby: "",
  ariaDescribedby: "",
  resetScrollPosition: true,
  hideScrollbar: false,
  closable: true,
  swipeToClose: true,
  closeOnTap: true,
  showCloseIcon: true,
  showMaximizeIcon: false,
  loop: true,
  escKey: true,
  keyPress: true,
  trapFocus: true,
  controls: true,
  slideEndAnimation: true,
  hideControlOnEnd: false,
  mousewheel: false,
  getCaptionFromTitleOrAlt: true,
  appendSubHtmlTo: ".lg-sub-html",
  subHtmlSelectorRelative: false,
  preload: 2,
  numberOfSlideItemsInDom: 10,
  selector: "",
  selectWithin: "",
  nextHtml: "",
  prevHtml: "",
  index: 0,
  iframeWidth: "100%",
  iframeHeight: "100%",
  iframeMaxWidth: "100%",
  iframeMaxHeight: "100%",
  download: true,
  counter: true,
  appendCounterTo: ".lg-toolbar",
  swipeThreshold: 50,
  enableSwipe: true,
  enableDrag: true,
  dynamic: false,
  dynamicEl: [],
  extraProps: [],
  exThumbImage: "",
  isMobile: void 0,
  mobileSettings: {
    controls: false,
    showCloseIcon: false,
    download: false
  },
  plugins: [],
  strings: {
    closeGallery: "Close gallery",
    toggleMaximize: "Toggle maximize",
    previousSlide: "Previous slide",
    nextSlide: "Next slide",
    download: "Download",
    playVideo: "Play video"
  }
};
function initLgPolyfills() {
  (function() {
    if (typeof window.CustomEvent === "function")
      return false;
    function CustomEvent2(event, params) {
      params = params || {
        bubbles: false,
        cancelable: false,
        detail: null
      };
      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    }
    window.CustomEvent = CustomEvent2;
  })();
  (function() {
    if (!Element.prototype.matches) {
      Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }
  })();
}
var lgQuery = function() {
  function lgQuery2(selector) {
    this.cssVenderPrefixes = [
      "TransitionDuration",
      "TransitionTimingFunction",
      "Transform",
      "Transition"
    ];
    this.selector = this._getSelector(selector);
    this.firstElement = this._getFirstEl();
    return this;
  }
  lgQuery2.generateUUID = function() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  };
  lgQuery2.prototype._getSelector = function(selector, context) {
    if (context === void 0) {
      context = document;
    }
    if (typeof selector !== "string") {
      return selector;
    }
    context = context || document;
    var fl = selector.substring(0, 1);
    if (fl === "#") {
      return context.querySelector(selector);
    } else {
      return context.querySelectorAll(selector);
    }
  };
  lgQuery2.prototype._each = function(func) {
    if (!this.selector) {
      return this;
    }
    if (this.selector.length !== void 0) {
      [].forEach.call(this.selector, func);
    } else {
      func(this.selector, 0);
    }
    return this;
  };
  lgQuery2.prototype._setCssVendorPrefix = function(el, cssProperty, value) {
    var property = cssProperty.replace(/-([a-z])/gi, function(s, group1) {
      return group1.toUpperCase();
    });
    if (this.cssVenderPrefixes.indexOf(property) !== -1) {
      el.style[property.charAt(0).toLowerCase() + property.slice(1)] = value;
      el.style["webkit" + property] = value;
      el.style["moz" + property] = value;
      el.style["ms" + property] = value;
      el.style["o" + property] = value;
    } else {
      el.style[property] = value;
    }
  };
  lgQuery2.prototype._getFirstEl = function() {
    if (this.selector && this.selector.length !== void 0) {
      return this.selector[0];
    } else {
      return this.selector;
    }
  };
  lgQuery2.prototype.isEventMatched = function(event, eventName) {
    var eventNamespace = eventName.split(".");
    return event.split(".").filter(function(e) {
      return e;
    }).every(function(e) {
      return eventNamespace.indexOf(e) !== -1;
    });
  };
  lgQuery2.prototype.attr = function(attr, value) {
    if (value === void 0) {
      if (!this.firstElement) {
        return "";
      }
      return this.firstElement.getAttribute(attr);
    }
    this._each(function(el) {
      el.setAttribute(attr, value);
    });
    return this;
  };
  lgQuery2.prototype.find = function(selector) {
    return $LG(this._getSelector(selector, this.selector));
  };
  lgQuery2.prototype.first = function() {
    if (this.selector && this.selector.length !== void 0) {
      return $LG(this.selector[0]);
    } else {
      return $LG(this.selector);
    }
  };
  lgQuery2.prototype.eq = function(index) {
    return $LG(this.selector[index]);
  };
  lgQuery2.prototype.parent = function() {
    return $LG(this.selector.parentElement);
  };
  lgQuery2.prototype.get = function() {
    return this._getFirstEl();
  };
  lgQuery2.prototype.removeAttr = function(attributes) {
    var attrs = attributes.split(" ");
    this._each(function(el) {
      attrs.forEach(function(attr) {
        return el.removeAttribute(attr);
      });
    });
    return this;
  };
  lgQuery2.prototype.wrap = function(className) {
    if (!this.firstElement) {
      return this;
    }
    var wrapper = document.createElement("div");
    wrapper.className = className;
    this.firstElement.parentNode.insertBefore(wrapper, this.firstElement);
    this.firstElement.parentNode.removeChild(this.firstElement);
    wrapper.appendChild(this.firstElement);
    return this;
  };
  lgQuery2.prototype.addClass = function(classNames) {
    if (classNames === void 0) {
      classNames = "";
    }
    this._each(function(el) {
      classNames.split(" ").forEach(function(className) {
        if (className) {
          el.classList.add(className);
        }
      });
    });
    return this;
  };
  lgQuery2.prototype.removeClass = function(classNames) {
    this._each(function(el) {
      classNames.split(" ").forEach(function(className) {
        if (className) {
          el.classList.remove(className);
        }
      });
    });
    return this;
  };
  lgQuery2.prototype.hasClass = function(className) {
    if (!this.firstElement) {
      return false;
    }
    return this.firstElement.classList.contains(className);
  };
  lgQuery2.prototype.hasAttribute = function(attribute) {
    if (!this.firstElement) {
      return false;
    }
    return this.firstElement.hasAttribute(attribute);
  };
  lgQuery2.prototype.toggleClass = function(className) {
    if (!this.firstElement) {
      return this;
    }
    if (this.hasClass(className)) {
      this.removeClass(className);
    } else {
      this.addClass(className);
    }
    return this;
  };
  lgQuery2.prototype.css = function(property, value) {
    var _this = this;
    this._each(function(el) {
      _this._setCssVendorPrefix(el, property, value);
    });
    return this;
  };
  lgQuery2.prototype.on = function(events, listener) {
    var _this = this;
    if (!this.selector) {
      return this;
    }
    events.split(" ").forEach(function(event) {
      if (!Array.isArray(lgQuery2.eventListeners[event])) {
        lgQuery2.eventListeners[event] = [];
      }
      lgQuery2.eventListeners[event].push(listener);
      _this.selector.addEventListener(event.split(".")[0], listener);
    });
    return this;
  };
  lgQuery2.prototype.once = function(event, listener) {
    var _this = this;
    this.on(event, function() {
      _this.off(event);
      listener(event);
    });
    return this;
  };
  lgQuery2.prototype.off = function(event) {
    var _this = this;
    if (!this.selector) {
      return this;
    }
    Object.keys(lgQuery2.eventListeners).forEach(function(eventName) {
      if (_this.isEventMatched(event, eventName)) {
        lgQuery2.eventListeners[eventName].forEach(function(listener) {
          _this.selector.removeEventListener(eventName.split(".")[0], listener);
        });
        lgQuery2.eventListeners[eventName] = [];
      }
    });
    return this;
  };
  lgQuery2.prototype.trigger = function(event, detail) {
    if (!this.firstElement) {
      return this;
    }
    var customEvent = new CustomEvent(event.split(".")[0], {
      detail: detail || null
    });
    this.firstElement.dispatchEvent(customEvent);
    return this;
  };
  lgQuery2.prototype.load = function(url) {
    var _this = this;
    fetch(url).then(function(res) {
      return res.text();
    }).then(function(html) {
      _this.selector.innerHTML = html;
    });
    return this;
  };
  lgQuery2.prototype.html = function(html) {
    if (html === void 0) {
      if (!this.firstElement) {
        return "";
      }
      return this.firstElement.innerHTML;
    }
    this._each(function(el) {
      el.innerHTML = html;
    });
    return this;
  };
  lgQuery2.prototype.append = function(html) {
    this._each(function(el) {
      if (typeof html === "string") {
        el.insertAdjacentHTML("beforeend", html);
      } else {
        el.appendChild(html);
      }
    });
    return this;
  };
  lgQuery2.prototype.prepend = function(html) {
    this._each(function(el) {
      el.insertAdjacentHTML("afterbegin", html);
    });
    return this;
  };
  lgQuery2.prototype.remove = function() {
    this._each(function(el) {
      el.parentNode.removeChild(el);
    });
    return this;
  };
  lgQuery2.prototype.empty = function() {
    this._each(function(el) {
      el.innerHTML = "";
    });
    return this;
  };
  lgQuery2.prototype.scrollTop = function(scrollTop) {
    if (scrollTop !== void 0) {
      document.body.scrollTop = scrollTop;
      document.documentElement.scrollTop = scrollTop;
      return this;
    } else {
      return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }
  };
  lgQuery2.prototype.scrollLeft = function(scrollLeft) {
    if (scrollLeft !== void 0) {
      document.body.scrollLeft = scrollLeft;
      document.documentElement.scrollLeft = scrollLeft;
      return this;
    } else {
      return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    }
  };
  lgQuery2.prototype.offset = function() {
    if (!this.firstElement) {
      return {
        left: 0,
        top: 0
      };
    }
    var rect = this.firstElement.getBoundingClientRect();
    var bodyMarginLeft = $LG("body").style().marginLeft;
    return {
      left: rect.left - parseFloat(bodyMarginLeft) + this.scrollLeft(),
      top: rect.top + this.scrollTop()
    };
  };
  lgQuery2.prototype.style = function() {
    if (!this.firstElement) {
      return {};
    }
    return this.firstElement.currentStyle || window.getComputedStyle(this.firstElement);
  };
  lgQuery2.prototype.width = function() {
    var style = this.style();
    return this.firstElement.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  };
  lgQuery2.prototype.height = function() {
    var style = this.style();
    return this.firstElement.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  };
  lgQuery2.eventListeners = {};
  return lgQuery2;
}();
function $LG(selector) {
  initLgPolyfills();
  return new lgQuery(selector);
}
var defaultDynamicOptions = [
  "src",
  "sources",
  "subHtml",
  "subHtmlUrl",
  "html",
  "video",
  "poster",
  "slideName",
  "responsive",
  "srcset",
  "sizes",
  "iframe",
  "downloadUrl",
  "download",
  "width",
  "facebookShareUrl",
  "tweetText",
  "iframeTitle",
  "twitterShareUrl",
  "pinterestShareUrl",
  "pinterestText",
  "fbHtml",
  "disqusIdentifier",
  "disqusUrl"
];
function convertToData(attr) {
  if (attr === "href") {
    return "src";
  }
  attr = attr.replace("data-", "");
  attr = attr.charAt(0).toLowerCase() + attr.slice(1);
  attr = attr.replace(/-([a-z])/g, function(g) {
    return g[1].toUpperCase();
  });
  return attr;
}
var utils = {
  getSize: function(el, container, spacing, defaultLgSize) {
    if (spacing === void 0) {
      spacing = 0;
    }
    var LGel = $LG(el);
    var lgSize = LGel.attr("data-lg-size") || defaultLgSize;
    if (!lgSize) {
      return;
    }
    var isResponsiveSizes = lgSize.split(",");
    if (isResponsiveSizes[1]) {
      var wWidth = window.innerWidth;
      for (var i = 0; i < isResponsiveSizes.length; i++) {
        var size_1 = isResponsiveSizes[i];
        var responsiveWidth = parseInt(size_1.split("-")[2], 10);
        if (responsiveWidth > wWidth) {
          lgSize = size_1;
          break;
        }
        if (i === isResponsiveSizes.length - 1) {
          lgSize = size_1;
        }
      }
    }
    var size = lgSize.split("-");
    var width = parseInt(size[0], 10);
    var height = parseInt(size[1], 10);
    var cWidth = container.width();
    var cHeight = container.height() - spacing;
    var maxWidth = Math.min(cWidth, width);
    var maxHeight = Math.min(cHeight, height);
    var ratio = Math.min(maxWidth / width, maxHeight / height);
    return { width: width * ratio, height: height * ratio };
  },
  getTransform: function(el, container, top, bottom, imageSize) {
    if (!imageSize) {
      return;
    }
    var LGel = $LG(el).find("img").first();
    if (!LGel.get()) {
      return;
    }
    var containerRect = container.get().getBoundingClientRect();
    var wWidth = containerRect.width;
    var wHeight = container.height() - (top + bottom);
    var elWidth = LGel.width();
    var elHeight = LGel.height();
    var elStyle = LGel.style();
    var x = (wWidth - elWidth) / 2 - LGel.offset().left + (parseFloat(elStyle.paddingLeft) || 0) + (parseFloat(elStyle.borderLeft) || 0) + $LG(window).scrollLeft() + containerRect.left;
    var y = (wHeight - elHeight) / 2 - LGel.offset().top + (parseFloat(elStyle.paddingTop) || 0) + (parseFloat(elStyle.borderTop) || 0) + $LG(window).scrollTop() + top;
    var scX = elWidth / imageSize.width;
    var scY = elHeight / imageSize.height;
    var transform = "translate3d(" + (x *= -1) + "px, " + (y *= -1) + "px, 0) scale3d(" + scX + ", " + scY + ", 1)";
    return transform;
  },
  getIframeMarkup: function(iframeWidth, iframeHeight, iframeMaxWidth, iframeMaxHeight, src, iframeTitle) {
    var title = iframeTitle ? 'title="' + iframeTitle + '"' : "";
    return '<div class="lg-video-cont lg-has-iframe" style="width:' + iframeWidth + "; max-width:" + iframeMaxWidth + "; height: " + iframeHeight + "; max-height:" + iframeMaxHeight + '">\n                    <iframe class="lg-object" frameborder="0" ' + title + ' src="' + src + '"  allowfullscreen="true"></iframe>\n                </div>';
  },
  getImgMarkup: function(index, src, altAttr, srcset, sizes, sources) {
    var srcsetAttr = srcset ? 'srcset="' + srcset + '"' : "";
    var sizesAttr = sizes ? 'sizes="' + sizes + '"' : "";
    var imgMarkup = "<img " + altAttr + " " + srcsetAttr + "  " + sizesAttr + ' class="lg-object lg-image" data-index="' + index + '" src="' + src + '" />';
    var sourceTag = "";
    if (sources) {
      var sourceObj = typeof sources === "string" ? JSON.parse(sources) : sources;
      sourceTag = sourceObj.map(function(source) {
        var attrs = "";
        Object.keys(source).forEach(function(key) {
          attrs += " " + key + '="' + source[key] + '"';
        });
        return "<source " + attrs + "></source>";
      });
    }
    return "" + sourceTag + imgMarkup;
  },
  getResponsiveSrc: function(srcItms) {
    var rsWidth = [];
    var rsSrc = [];
    var src = "";
    for (var i = 0; i < srcItms.length; i++) {
      var _src = srcItms[i].split(" ");
      if (_src[0] === "") {
        _src.splice(0, 1);
      }
      rsSrc.push(_src[0]);
      rsWidth.push(_src[1]);
    }
    var wWidth = window.innerWidth;
    for (var j = 0; j < rsWidth.length; j++) {
      if (parseInt(rsWidth[j], 10) > wWidth) {
        src = rsSrc[j];
        break;
      }
    }
    return src;
  },
  isImageLoaded: function(img) {
    if (!img)
      return false;
    if (!img.complete) {
      return false;
    }
    if (img.naturalWidth === 0) {
      return false;
    }
    return true;
  },
  getVideoPosterMarkup: function(_poster, dummyImg, videoContStyle, playVideoString, _isVideo) {
    var videoClass = "";
    if (_isVideo && _isVideo.youtube) {
      videoClass = "lg-has-youtube";
    } else if (_isVideo && _isVideo.vimeo) {
      videoClass = "lg-has-vimeo";
    } else {
      videoClass = "lg-has-html5";
    }
    return '<div class="lg-video-cont ' + videoClass + '" style="' + videoContStyle + '">\n                <div class="lg-video-play-button">\n                <svg\n                    viewBox="0 0 20 20"\n                    preserveAspectRatio="xMidYMid"\n                    focusable="false"\n                    aria-labelledby="' + playVideoString + '"\n                    role="img"\n                    class="lg-video-play-icon"\n                >\n                    <title>' + playVideoString + '</title>\n                    <polygon class="lg-video-play-icon-inner" points="1,0 20,10 1,20"></polygon>\n                </svg>\n                <svg class="lg-video-play-icon-bg" viewBox="0 0 50 50" focusable="false">\n                    <circle cx="50%" cy="50%" r="20"></circle></svg>\n                <svg class="lg-video-play-icon-circle" viewBox="0 0 50 50" focusable="false">\n                    <circle cx="50%" cy="50%" r="20"></circle>\n                </svg>\n            </div>\n            ' + (dummyImg || "") + '\n            <img class="lg-object lg-video-poster" src="' + _poster + '" />\n        </div>';
  },
  getFocusableElements: function(container) {
    var elements = container.querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])');
    var visibleElements = [].filter.call(elements, function(element) {
      var style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    return visibleElements;
  },
  getDynamicOptions: function(items, extraProps, getCaptionFromTitleOrAlt, exThumbImage) {
    var dynamicElements = [];
    var availableDynamicOptions = __spreadArrays(defaultDynamicOptions, extraProps);
    [].forEach.call(items, function(item) {
      var dynamicEl = {};
      for (var i = 0; i < item.attributes.length; i++) {
        var attr = item.attributes[i];
        if (attr.specified) {
          var dynamicAttr = convertToData(attr.name);
          var label = "";
          if (availableDynamicOptions.indexOf(dynamicAttr) > -1) {
            label = dynamicAttr;
          }
          if (label) {
            dynamicEl[label] = attr.value;
          }
        }
      }
      var currentItem = $LG(item);
      var alt = currentItem.find("img").first().attr("alt");
      var title = currentItem.attr("title");
      var thumb = exThumbImage ? currentItem.attr(exThumbImage) : currentItem.find("img").first().attr("src");
      dynamicEl.thumb = thumb;
      if (getCaptionFromTitleOrAlt && !dynamicEl.subHtml) {
        dynamicEl.subHtml = title || alt || "";
      }
      dynamicEl.alt = alt || title || "";
      dynamicElements.push(dynamicEl);
    });
    return dynamicElements;
  },
  isMobile: function() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  },
  isVideo: function(src, isHTML5VIdeo, index) {
    if (!src) {
      if (isHTML5VIdeo) {
        return {
          html5: true
        };
      } else {
        console.error("lightGallery :- data-src is not provided on slide item " + (index + 1) + ". Please make sure the selector property is properly configured. More info - https://www.lightgalleryjs.com/demos/html-markup/");
        return;
      }
    }
    var youtube = src.match(/\/\/(?:www\.)?youtu(?:\.be|be\.com|be-nocookie\.com)\/(?:watch\?v=|embed\/)?([a-z0-9\-\_\%]+)([\&|?][\S]*)*/i);
    var vimeo = src.match(/\/\/(?:www\.)?(?:player\.)?vimeo.com\/(?:video\/)?([0-9a-z\-_]+)(.*)?/i);
    var wistia = src.match(/https?:\/\/(.+)?(wistia\.com|wi\.st)\/(medias|embed)\/([0-9a-z\-_]+)(.*)/);
    if (youtube) {
      return {
        youtube
      };
    } else if (vimeo) {
      return {
        vimeo
      };
    } else if (wistia) {
      return {
        wistia
      };
    }
  }
};
var lgId = 0;
var LightGallery = function() {
  function LightGallery2(element, options) {
    this.lgOpened = false;
    this.index = 0;
    this.plugins = [];
    this.lGalleryOn = false;
    this.lgBusy = false;
    this.currentItemsInDom = [];
    this.prevScrollTop = 0;
    this.bodyPaddingRight = 0;
    this.isDummyImageRemoved = false;
    this.dragOrSwipeEnabled = false;
    this.mediaContainerPosition = {
      top: 0,
      bottom: 0
    };
    if (!element) {
      return this;
    }
    lgId++;
    this.lgId = lgId;
    this.el = element;
    this.LGel = $LG(element);
    this.generateSettings(options);
    this.buildModules();
    if (this.settings.dynamic && this.settings.dynamicEl !== void 0 && !Array.isArray(this.settings.dynamicEl)) {
      throw "When using dynamic mode, you must also define dynamicEl as an Array.";
    }
    this.galleryItems = this.getItems();
    this.normalizeSettings();
    this.init();
    this.validateLicense();
    return this;
  }
  LightGallery2.prototype.generateSettings = function(options) {
    this.settings = __assign(__assign({}, lightGalleryCoreSettings), options);
    if (this.settings.isMobile && typeof this.settings.isMobile === "function" ? this.settings.isMobile() : utils.isMobile()) {
      var mobileSettings = __assign(__assign({}, this.settings.mobileSettings), this.settings.mobileSettings);
      this.settings = __assign(__assign({}, this.settings), mobileSettings);
    }
  };
  LightGallery2.prototype.normalizeSettings = function() {
    if (this.settings.slideEndAnimation) {
      this.settings.hideControlOnEnd = false;
    }
    if (!this.settings.closable) {
      this.settings.swipeToClose = false;
    }
    this.zoomFromOrigin = this.settings.zoomFromOrigin;
    if (this.settings.dynamic) {
      this.zoomFromOrigin = false;
    }
    if (!this.settings.container) {
      this.settings.container = document.body;
    }
    this.settings.preload = Math.min(this.settings.preload, this.galleryItems.length);
  };
  LightGallery2.prototype.init = function() {
    var _this = this;
    this.addSlideVideoInfo(this.galleryItems);
    this.buildStructure();
    this.LGel.trigger(lGEvents.init, {
      instance: this
    });
    if (this.settings.keyPress) {
      this.keyPress();
    }
    setTimeout(function() {
      _this.enableDrag();
      _this.enableSwipe();
      _this.triggerPosterClick();
    }, 50);
    this.arrow();
    if (this.settings.mousewheel) {
      this.mousewheel();
    }
    if (!this.settings.dynamic) {
      this.openGalleryOnItemClick();
    }
  };
  LightGallery2.prototype.openGalleryOnItemClick = function() {
    var _this = this;
    var _loop_1 = function(index2) {
      var element = this_1.items[index2];
      var $element = $LG(element);
      var uuid = lgQuery.generateUUID();
      $element.attr("data-lg-id", uuid).on("click.lgcustom-item-" + uuid, function(e) {
        e.preventDefault();
        var currentItemIndex = _this.settings.index || index2;
        _this.openGallery(currentItemIndex, element);
      });
    };
    var this_1 = this;
    for (var index = 0; index < this.items.length; index++) {
      _loop_1(index);
    }
  };
  LightGallery2.prototype.buildModules = function() {
    var _this = this;
    this.settings.plugins.forEach(function(plugin) {
      _this.plugins.push(new plugin(_this, $LG));
    });
  };
  LightGallery2.prototype.validateLicense = function() {
    if (!this.settings.licenseKey) {
      console.error("Please provide a valid license key");
    } else if (this.settings.licenseKey === "0000-0000-000-0000") {
      console.warn("lightGallery: " + this.settings.licenseKey + " license key is not valid for production use");
    }
  };
  LightGallery2.prototype.getSlideItem = function(index) {
    return $LG(this.getSlideItemId(index));
  };
  LightGallery2.prototype.getSlideItemId = function(index) {
    return "#lg-item-" + this.lgId + "-" + index;
  };
  LightGallery2.prototype.getIdName = function(id) {
    return id + "-" + this.lgId;
  };
  LightGallery2.prototype.getElementById = function(id) {
    return $LG("#" + this.getIdName(id));
  };
  LightGallery2.prototype.manageSingleSlideClassName = function() {
    if (this.galleryItems.length < 2) {
      this.outer.addClass("lg-single-item");
    } else {
      this.outer.removeClass("lg-single-item");
    }
  };
  LightGallery2.prototype.buildStructure = function() {
    var _this = this;
    var container = this.$container && this.$container.get();
    if (container) {
      return;
    }
    var controls = "";
    var subHtmlCont = "";
    if (this.settings.controls) {
      controls = '<button type="button" id="' + this.getIdName("lg-prev") + '" aria-label="' + this.settings.strings["previousSlide"] + '" class="lg-prev lg-icon"> ' + this.settings.prevHtml + ' </button>\n                <button type="button" id="' + this.getIdName("lg-next") + '" aria-label="' + this.settings.strings["nextSlide"] + '" class="lg-next lg-icon"> ' + this.settings.nextHtml + " </button>";
    }
    if (this.settings.appendSubHtmlTo !== ".lg-item") {
      subHtmlCont = '<div class="lg-sub-html" role="status" aria-live="polite"></div>';
    }
    var addClasses = "";
    if (this.settings.allowMediaOverlap) {
      addClasses += "lg-media-overlap ";
    }
    var ariaLabelledby = this.settings.ariaLabelledby ? 'aria-labelledby="' + this.settings.ariaLabelledby + '"' : "";
    var ariaDescribedby = this.settings.ariaDescribedby ? 'aria-describedby="' + this.settings.ariaDescribedby + '"' : "";
    var containerClassName = "lg-container " + this.settings.addClass + " " + (document.body !== this.settings.container ? "lg-inline" : "");
    var closeIcon = this.settings.closable && this.settings.showCloseIcon ? '<button type="button" aria-label="' + this.settings.strings["closeGallery"] + '" id="' + this.getIdName("lg-close") + '" class="lg-close lg-icon"></button>' : "";
    var maximizeIcon = this.settings.showMaximizeIcon ? '<button type="button" aria-label="' + this.settings.strings["toggleMaximize"] + '" id="' + this.getIdName("lg-maximize") + '" class="lg-maximize lg-icon"></button>' : "";
    var template = '\n        <div class="' + containerClassName + '" id="' + this.getIdName("lg-container") + '" tabindex="-1" aria-modal="true" ' + ariaLabelledby + " " + ariaDescribedby + ' role="dialog"\n        >\n            <div id="' + this.getIdName("lg-backdrop") + '" class="lg-backdrop"></div>\n\n            <div id="' + this.getIdName("lg-outer") + '" class="lg-outer lg-use-css3 lg-css3 lg-hide-items ' + addClasses + ' ">\n\n              <div id="' + this.getIdName("lg-content") + '" class="lg-content">\n                <div id="' + this.getIdName("lg-inner") + '" class="lg-inner">\n                </div>\n                ' + controls + '\n              </div>\n                <div id="' + this.getIdName("lg-toolbar") + '" class="lg-toolbar lg-group">\n                    ' + maximizeIcon + "\n                    " + closeIcon + "\n                    </div>\n                    " + (this.settings.appendSubHtmlTo === ".lg-outer" ? subHtmlCont : "") + '\n                <div id="' + this.getIdName("lg-components") + '" class="lg-components">\n                    ' + (this.settings.appendSubHtmlTo === ".lg-sub-html" ? subHtmlCont : "") + "\n                </div>\n            </div>\n        </div>\n        ";
    $LG(this.settings.container).append(template);
    if (document.body !== this.settings.container) {
      $LG(this.settings.container).css("position", "relative");
    }
    this.outer = this.getElementById("lg-outer");
    this.$lgComponents = this.getElementById("lg-components");
    this.$backdrop = this.getElementById("lg-backdrop");
    this.$container = this.getElementById("lg-container");
    this.$inner = this.getElementById("lg-inner");
    this.$content = this.getElementById("lg-content");
    this.$toolbar = this.getElementById("lg-toolbar");
    this.$backdrop.css("transition-duration", this.settings.backdropDuration + "ms");
    var outerClassNames = this.settings.mode + " ";
    this.manageSingleSlideClassName();
    if (this.settings.enableDrag) {
      outerClassNames += "lg-grab ";
    }
    this.outer.addClass(outerClassNames);
    this.$inner.css("transition-timing-function", this.settings.easing);
    this.$inner.css("transition-duration", this.settings.speed + "ms");
    if (this.settings.download) {
      this.$toolbar.append('<a id="' + this.getIdName("lg-download") + '" target="_blank" rel="noopener" aria-label="' + this.settings.strings["download"] + '" download class="lg-download lg-icon"></a>');
    }
    this.counter();
    $LG(window).on("resize.lg.global" + this.lgId + " orientationchange.lg.global" + this.lgId, function() {
      _this.refreshOnResize();
    });
    this.hideBars();
    this.manageCloseGallery();
    this.toggleMaximize();
    this.initModules();
  };
  LightGallery2.prototype.refreshOnResize = function() {
    if (this.lgOpened) {
      var currentGalleryItem = this.galleryItems[this.index];
      var __slideVideoInfo = currentGalleryItem.__slideVideoInfo;
      this.mediaContainerPosition = this.getMediaContainerPosition();
      var _a = this.mediaContainerPosition, top_1 = _a.top, bottom = _a.bottom;
      this.currentImageSize = utils.getSize(this.items[this.index], this.outer, top_1 + bottom, __slideVideoInfo && this.settings.videoMaxSize);
      if (__slideVideoInfo) {
        this.resizeVideoSlide(this.index, this.currentImageSize);
      }
      if (this.zoomFromOrigin && !this.isDummyImageRemoved) {
        var imgStyle = this.getDummyImgStyles(this.currentImageSize);
        this.outer.find(".lg-current .lg-dummy-img").first().attr("style", imgStyle);
      }
      this.LGel.trigger(lGEvents.containerResize);
    }
  };
  LightGallery2.prototype.resizeVideoSlide = function(index, imageSize) {
    var lgVideoStyle = this.getVideoContStyle(imageSize);
    var currentSlide = this.getSlideItem(index);
    currentSlide.find(".lg-video-cont").attr("style", lgVideoStyle);
  };
  LightGallery2.prototype.updateSlides = function(items, index) {
    if (this.index > items.length - 1) {
      this.index = items.length - 1;
    }
    if (items.length === 1) {
      this.index = 0;
    }
    if (!items.length) {
      this.closeGallery();
      return;
    }
    var currentSrc = this.galleryItems[index].src;
    this.galleryItems = items;
    this.updateControls();
    this.$inner.empty();
    this.currentItemsInDom = [];
    var _index = 0;
    this.galleryItems.some(function(galleryItem, itemIndex) {
      if (galleryItem.src === currentSrc) {
        _index = itemIndex;
        return true;
      }
      return false;
    });
    this.currentItemsInDom = this.organizeSlideItems(_index, -1);
    this.loadContent(_index, true);
    this.getSlideItem(_index).addClass("lg-current");
    this.index = _index;
    this.updateCurrentCounter(_index);
    this.LGel.trigger(lGEvents.updateSlides);
  };
  LightGallery2.prototype.getItems = function() {
    this.items = [];
    if (!this.settings.dynamic) {
      if (this.settings.selector === "this") {
        this.items.push(this.el);
      } else if (this.settings.selector) {
        if (typeof this.settings.selector === "string") {
          if (this.settings.selectWithin) {
            var selectWithin = $LG(this.settings.selectWithin);
            this.items = selectWithin.find(this.settings.selector).get();
          } else {
            this.items = this.el.querySelectorAll(this.settings.selector);
          }
        } else {
          this.items = this.settings.selector;
        }
      } else {
        this.items = this.el.children;
      }
      return utils.getDynamicOptions(this.items, this.settings.extraProps, this.settings.getCaptionFromTitleOrAlt, this.settings.exThumbImage);
    } else {
      return this.settings.dynamicEl || [];
    }
  };
  LightGallery2.prototype.shouldHideScrollbar = function() {
    return this.settings.hideScrollbar && document.body === this.settings.container;
  };
  LightGallery2.prototype.hideScrollbar = function() {
    if (!this.shouldHideScrollbar()) {
      return;
    }
    this.bodyPaddingRight = parseFloat($LG("body").style().paddingRight);
    var bodyRect = document.documentElement.getBoundingClientRect();
    var scrollbarWidth = window.innerWidth - bodyRect.width;
    $LG(document.body).css("padding-right", scrollbarWidth + this.bodyPaddingRight + "px");
    $LG(document.body).addClass("lg-overlay-open");
  };
  LightGallery2.prototype.resetScrollBar = function() {
    if (!this.shouldHideScrollbar()) {
      return;
    }
    $LG(document.body).css("padding-right", this.bodyPaddingRight + "px");
    $LG(document.body).removeClass("lg-overlay-open");
  };
  LightGallery2.prototype.openGallery = function(index, element) {
    var _this = this;
    if (index === void 0) {
      index = this.settings.index;
    }
    if (this.lgOpened)
      return;
    this.lgOpened = true;
    this.outer.removeClass("lg-hide-items");
    this.hideScrollbar();
    this.$container.addClass("lg-show");
    var itemsToBeInsertedToDom = this.getItemsToBeInsertedToDom(index, index);
    this.currentItemsInDom = itemsToBeInsertedToDom;
    var items = "";
    itemsToBeInsertedToDom.forEach(function(item) {
      items = items + ('<div id="' + item + '" class="lg-item"></div>');
    });
    this.$inner.append(items);
    this.addHtml(index);
    var transform = "";
    this.mediaContainerPosition = this.getMediaContainerPosition();
    var _a = this.mediaContainerPosition, top = _a.top, bottom = _a.bottom;
    if (!this.settings.allowMediaOverlap) {
      this.setMediaContainerPosition(top, bottom);
    }
    var __slideVideoInfo = this.galleryItems[index].__slideVideoInfo;
    if (this.zoomFromOrigin && element) {
      this.currentImageSize = utils.getSize(element, this.outer, top + bottom, __slideVideoInfo && this.settings.videoMaxSize);
      transform = utils.getTransform(element, this.outer, top, bottom, this.currentImageSize);
    }
    if (!this.zoomFromOrigin || !transform) {
      this.outer.addClass(this.settings.startClass);
      this.getSlideItem(index).removeClass("lg-complete");
    }
    var timeout = this.settings.zoomFromOrigin ? 100 : this.settings.backdropDuration;
    setTimeout(function() {
      _this.outer.addClass("lg-components-open");
    }, timeout);
    this.index = index;
    this.LGel.trigger(lGEvents.beforeOpen);
    this.getSlideItem(index).addClass("lg-current");
    this.lGalleryOn = false;
    this.prevScrollTop = $LG(window).scrollTop();
    setTimeout(function() {
      if (_this.zoomFromOrigin && transform) {
        var currentSlide_1 = _this.getSlideItem(index);
        currentSlide_1.css("transform", transform);
        setTimeout(function() {
          currentSlide_1.addClass("lg-start-progress lg-start-end-progress").css("transition-duration", _this.settings.startAnimationDuration + "ms");
          _this.outer.addClass("lg-zoom-from-image");
        });
        setTimeout(function() {
          currentSlide_1.css("transform", "translate3d(0, 0, 0)");
        }, 100);
      }
      setTimeout(function() {
        _this.$backdrop.addClass("in");
        _this.$container.addClass("lg-show-in");
      }, 10);
      setTimeout(function() {
        if (_this.settings.trapFocus && document.body === _this.settings.container) {
          _this.trapFocus();
        }
      }, _this.settings.backdropDuration + 50);
      if (!_this.zoomFromOrigin || !transform) {
        setTimeout(function() {
          _this.outer.addClass("lg-visible");
        }, _this.settings.backdropDuration);
      }
      _this.slide(index, false, false, false);
      _this.LGel.trigger(lGEvents.afterOpen);
    });
    if (document.body === this.settings.container) {
      $LG("html").addClass("lg-on");
    }
  };
  LightGallery2.prototype.getMediaContainerPosition = function() {
    if (this.settings.allowMediaOverlap) {
      return {
        top: 0,
        bottom: 0
      };
    }
    var top = this.$toolbar.get().clientHeight || 0;
    var subHtml = this.outer.find(".lg-components .lg-sub-html").get();
    var captionHeight = this.settings.defaultCaptionHeight || subHtml && subHtml.clientHeight || 0;
    var thumbContainer = this.outer.find(".lg-thumb-outer").get();
    var thumbHeight = thumbContainer ? thumbContainer.clientHeight : 0;
    var bottom = thumbHeight + captionHeight;
    return {
      top,
      bottom
    };
  };
  LightGallery2.prototype.setMediaContainerPosition = function(top, bottom) {
    if (top === void 0) {
      top = 0;
    }
    if (bottom === void 0) {
      bottom = 0;
    }
    this.$content.css("top", top + "px").css("bottom", bottom + "px");
  };
  LightGallery2.prototype.hideBars = function() {
    var _this = this;
    setTimeout(function() {
      _this.outer.removeClass("lg-hide-items");
      if (_this.settings.hideBarsDelay > 0) {
        _this.outer.on("mousemove.lg click.lg touchstart.lg", function() {
          _this.outer.removeClass("lg-hide-items");
          clearTimeout(_this.hideBarTimeout);
          _this.hideBarTimeout = setTimeout(function() {
            _this.outer.addClass("lg-hide-items");
          }, _this.settings.hideBarsDelay);
        });
        _this.outer.trigger("mousemove.lg");
      }
    }, this.settings.showBarsAfter);
  };
  LightGallery2.prototype.initPictureFill = function($img) {
    if (this.settings.supportLegacyBrowser) {
      try {
        picturefill({
          elements: [$img.get()]
        });
      } catch (e) {
        console.warn("lightGallery :- If you want srcset or picture tag to be supported for older browser please include picturefil javascript library in your document.");
      }
    }
  };
  LightGallery2.prototype.counter = function() {
    if (this.settings.counter) {
      var counterHtml = '<div class="lg-counter" role="status" aria-live="polite">\n                <span id="' + this.getIdName("lg-counter-current") + '" class="lg-counter-current">' + (this.index + 1) + ' </span> /\n                <span id="' + this.getIdName("lg-counter-all") + '" class="lg-counter-all">' + this.galleryItems.length + " </span></div>";
      this.outer.find(this.settings.appendCounterTo).append(counterHtml);
    }
  };
  LightGallery2.prototype.addHtml = function(index) {
    var subHtml;
    var subHtmlUrl;
    if (this.galleryItems[index].subHtmlUrl) {
      subHtmlUrl = this.galleryItems[index].subHtmlUrl;
    } else {
      subHtml = this.galleryItems[index].subHtml;
    }
    if (!subHtmlUrl) {
      if (subHtml) {
        var fL = subHtml.substring(0, 1);
        if (fL === "." || fL === "#") {
          if (this.settings.subHtmlSelectorRelative && !this.settings.dynamic) {
            subHtml = $LG(this.items).eq(index).find(subHtml).first().html();
          } else {
            subHtml = $LG(subHtml).first().html();
          }
        }
      } else {
        subHtml = "";
      }
    }
    if (this.settings.appendSubHtmlTo !== ".lg-item") {
      if (subHtmlUrl) {
        this.outer.find(".lg-sub-html").load(subHtmlUrl);
      } else {
        this.outer.find(".lg-sub-html").html(subHtml);
      }
    } else {
      var currentSlide = $LG(this.getSlideItemId(index));
      if (subHtmlUrl) {
        currentSlide.load(subHtmlUrl);
      } else {
        currentSlide.append('<div class="lg-sub-html">' + subHtml + "</div>");
      }
    }
    if (typeof subHtml !== "undefined" && subHtml !== null) {
      if (subHtml === "") {
        this.outer.find(this.settings.appendSubHtmlTo).addClass("lg-empty-html");
      } else {
        this.outer.find(this.settings.appendSubHtmlTo).removeClass("lg-empty-html");
      }
    }
    this.LGel.trigger(lGEvents.afterAppendSubHtml, {
      index
    });
  };
  LightGallery2.prototype.preload = function(index) {
    for (var i = 1; i <= this.settings.preload; i++) {
      if (i >= this.galleryItems.length - index) {
        break;
      }
      this.loadContent(index + i, false);
    }
    for (var j = 1; j <= this.settings.preload; j++) {
      if (index - j < 0) {
        break;
      }
      this.loadContent(index - j, false);
    }
  };
  LightGallery2.prototype.getDummyImgStyles = function(imageSize) {
    if (!imageSize)
      return "";
    return "width:" + imageSize.width + "px;\n                margin-left: -" + imageSize.width / 2 + "px;\n                margin-top: -" + imageSize.height / 2 + "px;\n                height:" + imageSize.height + "px";
  };
  LightGallery2.prototype.getVideoContStyle = function(imageSize) {
    if (!imageSize)
      return "";
    return "width:" + imageSize.width + "px;\n                height:" + imageSize.height + "px";
  };
  LightGallery2.prototype.getDummyImageContent = function($currentSlide, index, alt) {
    var $currentItem;
    if (!this.settings.dynamic) {
      $currentItem = $LG(this.items).eq(index);
    }
    if ($currentItem) {
      var _dummyImgSrc = void 0;
      if (!this.settings.exThumbImage) {
        _dummyImgSrc = $currentItem.find("img").first().attr("src");
      } else {
        _dummyImgSrc = $currentItem.attr(this.settings.exThumbImage);
      }
      if (!_dummyImgSrc)
        return "";
      var imgStyle = this.getDummyImgStyles(this.currentImageSize);
      var dummyImgContent = "<img " + alt + ' style="' + imgStyle + '" class="lg-dummy-img" src="' + _dummyImgSrc + '" />';
      $currentSlide.addClass("lg-first-slide");
      this.outer.addClass("lg-first-slide-loading");
      return dummyImgContent;
    }
    return "";
  };
  LightGallery2.prototype.setImgMarkup = function(src, $currentSlide, index) {
    var currentGalleryItem = this.galleryItems[index];
    var alt = currentGalleryItem.alt, srcset = currentGalleryItem.srcset, sizes = currentGalleryItem.sizes, sources = currentGalleryItem.sources;
    var imgContent = "";
    var altAttr = alt ? 'alt="' + alt + '"' : "";
    if (this.isFirstSlideWithZoomAnimation()) {
      imgContent = this.getDummyImageContent($currentSlide, index, altAttr);
    } else {
      imgContent = utils.getImgMarkup(index, src, altAttr, srcset, sizes, sources);
    }
    var imgMarkup = '<picture class="lg-img-wrap"> ' + imgContent + "</picture>";
    $currentSlide.prepend(imgMarkup);
  };
  LightGallery2.prototype.onSlideObjectLoad = function($slide, isHTML5VideoWithoutPoster, onLoad, onError) {
    var mediaObject = $slide.find(".lg-object").first();
    if (utils.isImageLoaded(mediaObject.get()) || isHTML5VideoWithoutPoster) {
      onLoad();
    } else {
      mediaObject.on("load.lg error.lg", function() {
        onLoad && onLoad();
      });
      mediaObject.on("error.lg", function() {
        onError && onError();
      });
    }
  };
  LightGallery2.prototype.onLgObjectLoad = function(currentSlide, index, delay, speed, isFirstSlide, isHTML5VideoWithoutPoster) {
    var _this = this;
    this.onSlideObjectLoad(currentSlide, isHTML5VideoWithoutPoster, function() {
      _this.triggerSlideItemLoad(currentSlide, index, delay, speed, isFirstSlide);
    }, function() {
      currentSlide.addClass("lg-complete lg-complete_");
      currentSlide.html('<span class="lg-error-msg">Oops... Failed to load content...</span>');
    });
  };
  LightGallery2.prototype.triggerSlideItemLoad = function($currentSlide, index, delay, speed, isFirstSlide) {
    var _this = this;
    var currentGalleryItem = this.galleryItems[index];
    var _speed = isFirstSlide && this.getSlideType(currentGalleryItem) === "video" && !currentGalleryItem.poster ? speed : 0;
    setTimeout(function() {
      $currentSlide.addClass("lg-complete lg-complete_");
      _this.LGel.trigger(lGEvents.slideItemLoad, {
        index,
        delay: delay || 0,
        isFirstSlide
      });
    }, _speed);
  };
  LightGallery2.prototype.isFirstSlideWithZoomAnimation = function() {
    return !!(!this.lGalleryOn && this.zoomFromOrigin && this.currentImageSize);
  };
  LightGallery2.prototype.addSlideVideoInfo = function(items) {
    var _this = this;
    items.forEach(function(element, index) {
      element.__slideVideoInfo = utils.isVideo(element.src, !!element.video, index);
      if (element.__slideVideoInfo && _this.settings.loadYouTubePoster && !element.poster && element.__slideVideoInfo.youtube) {
        element.poster = "//img.youtube.com/vi/" + element.__slideVideoInfo.youtube[1] + "/maxresdefault.jpg";
      }
    });
  };
  LightGallery2.prototype.loadContent = function(index, rec) {
    var _this = this;
    var currentGalleryItem = this.galleryItems[index];
    var $currentSlide = $LG(this.getSlideItemId(index));
    var poster = currentGalleryItem.poster, srcset = currentGalleryItem.srcset, sizes = currentGalleryItem.sizes, sources = currentGalleryItem.sources;
    var src = currentGalleryItem.src;
    var video = currentGalleryItem.video;
    var _html5Video = video && typeof video === "string" ? JSON.parse(video) : video;
    if (currentGalleryItem.responsive) {
      var srcDyItms = currentGalleryItem.responsive.split(",");
      src = utils.getResponsiveSrc(srcDyItms) || src;
    }
    var videoInfo = currentGalleryItem.__slideVideoInfo;
    var lgVideoStyle = "";
    var iframe = !!currentGalleryItem.iframe;
    var isFirstSlide = !this.lGalleryOn;
    var delay = 0;
    if (isFirstSlide) {
      if (this.zoomFromOrigin && this.currentImageSize) {
        delay = this.settings.startAnimationDuration + 10;
      } else {
        delay = this.settings.backdropDuration + 10;
      }
    }
    if (!$currentSlide.hasClass("lg-loaded")) {
      if (videoInfo) {
        var _a = this.mediaContainerPosition, top_2 = _a.top, bottom = _a.bottom;
        var videoSize = utils.getSize(this.items[index], this.outer, top_2 + bottom, videoInfo && this.settings.videoMaxSize);
        lgVideoStyle = this.getVideoContStyle(videoSize);
      }
      if (iframe) {
        var markup = utils.getIframeMarkup(this.settings.iframeWidth, this.settings.iframeHeight, this.settings.iframeMaxWidth, this.settings.iframeMaxHeight, src, currentGalleryItem.iframeTitle);
        $currentSlide.prepend(markup);
      } else if (poster) {
        var dummyImg = "";
        var hasStartAnimation = isFirstSlide && this.zoomFromOrigin && this.currentImageSize;
        if (hasStartAnimation) {
          dummyImg = this.getDummyImageContent($currentSlide, index, "");
        }
        var markup = utils.getVideoPosterMarkup(poster, dummyImg || "", lgVideoStyle, this.settings.strings["playVideo"], videoInfo);
        $currentSlide.prepend(markup);
      } else if (videoInfo) {
        var markup = '<div class="lg-video-cont " style="' + lgVideoStyle + '"></div>';
        $currentSlide.prepend(markup);
      } else {
        this.setImgMarkup(src, $currentSlide, index);
        if (srcset || sources) {
          var $img = $currentSlide.find(".lg-object");
          this.initPictureFill($img);
        }
      }
      if (poster || videoInfo) {
        this.LGel.trigger(lGEvents.hasVideo, {
          index,
          src,
          html5Video: _html5Video,
          hasPoster: !!poster
        });
      }
      this.LGel.trigger(lGEvents.afterAppendSlide, { index });
      if (this.lGalleryOn && this.settings.appendSubHtmlTo === ".lg-item") {
        this.addHtml(index);
      }
    }
    var _speed = 0;
    if (delay && !$LG(document.body).hasClass("lg-from-hash")) {
      _speed = delay;
    }
    if (this.isFirstSlideWithZoomAnimation()) {
      setTimeout(function() {
        $currentSlide.removeClass("lg-start-end-progress lg-start-progress").removeAttr("style");
      }, this.settings.startAnimationDuration + 100);
      if (!$currentSlide.hasClass("lg-loaded")) {
        setTimeout(function() {
          if (_this.getSlideType(currentGalleryItem) === "image") {
            var alt = currentGalleryItem.alt;
            var altAttr = alt ? 'alt="' + alt + '"' : "";
            $currentSlide.find(".lg-img-wrap").append(utils.getImgMarkup(index, src, altAttr, srcset, sizes, currentGalleryItem.sources));
            if (srcset || sources) {
              var $img2 = $currentSlide.find(".lg-object");
              _this.initPictureFill($img2);
            }
          }
          if (_this.getSlideType(currentGalleryItem) === "image" || _this.getSlideType(currentGalleryItem) === "video" && poster) {
            _this.onLgObjectLoad($currentSlide, index, delay, _speed, true, false);
            _this.onSlideObjectLoad($currentSlide, !!(videoInfo && videoInfo.html5 && !poster), function() {
              _this.loadContentOnFirstSlideLoad(index, $currentSlide, _speed);
            }, function() {
              _this.loadContentOnFirstSlideLoad(index, $currentSlide, _speed);
            });
          }
        }, this.settings.startAnimationDuration + 100);
      }
    }
    $currentSlide.addClass("lg-loaded");
    if (!this.isFirstSlideWithZoomAnimation() || this.getSlideType(currentGalleryItem) === "video" && !poster) {
      this.onLgObjectLoad($currentSlide, index, delay, _speed, isFirstSlide, !!(videoInfo && videoInfo.html5 && !poster));
    }
    if ((!this.zoomFromOrigin || !this.currentImageSize) && $currentSlide.hasClass("lg-complete_") && !this.lGalleryOn) {
      setTimeout(function() {
        $currentSlide.addClass("lg-complete");
      }, this.settings.backdropDuration);
    }
    this.lGalleryOn = true;
    if (rec === true) {
      if (!$currentSlide.hasClass("lg-complete_")) {
        $currentSlide.find(".lg-object").first().on("load.lg error.lg", function() {
          _this.preload(index);
        });
      } else {
        this.preload(index);
      }
    }
  };
  LightGallery2.prototype.loadContentOnFirstSlideLoad = function(index, $currentSlide, speed) {
    var _this = this;
    setTimeout(function() {
      $currentSlide.find(".lg-dummy-img").remove();
      $currentSlide.removeClass("lg-first-slide");
      _this.outer.removeClass("lg-first-slide-loading");
      _this.isDummyImageRemoved = true;
      _this.preload(index);
    }, speed + 300);
  };
  LightGallery2.prototype.getItemsToBeInsertedToDom = function(index, prevIndex, numberOfItems) {
    var _this = this;
    if (numberOfItems === void 0) {
      numberOfItems = 0;
    }
    var itemsToBeInsertedToDom = [];
    var possibleNumberOfItems = Math.max(numberOfItems, 3);
    possibleNumberOfItems = Math.min(possibleNumberOfItems, this.galleryItems.length);
    var prevIndexItem = "lg-item-" + this.lgId + "-" + prevIndex;
    if (this.galleryItems.length <= 3) {
      this.galleryItems.forEach(function(_element, index2) {
        itemsToBeInsertedToDom.push("lg-item-" + _this.lgId + "-" + index2);
      });
      return itemsToBeInsertedToDom;
    }
    if (index < (this.galleryItems.length - 1) / 2) {
      for (var idx = index; idx > index - possibleNumberOfItems / 2 && idx >= 0; idx--) {
        itemsToBeInsertedToDom.push("lg-item-" + this.lgId + "-" + idx);
      }
      var numberOfExistingItems = itemsToBeInsertedToDom.length;
      for (var idx = 0; idx < possibleNumberOfItems - numberOfExistingItems; idx++) {
        itemsToBeInsertedToDom.push("lg-item-" + this.lgId + "-" + (index + idx + 1));
      }
    } else {
      for (var idx = index; idx <= this.galleryItems.length - 1 && idx < index + possibleNumberOfItems / 2; idx++) {
        itemsToBeInsertedToDom.push("lg-item-" + this.lgId + "-" + idx);
      }
      var numberOfExistingItems = itemsToBeInsertedToDom.length;
      for (var idx = 0; idx < possibleNumberOfItems - numberOfExistingItems; idx++) {
        itemsToBeInsertedToDom.push("lg-item-" + this.lgId + "-" + (index - idx - 1));
      }
    }
    if (this.settings.loop) {
      if (index === this.galleryItems.length - 1) {
        itemsToBeInsertedToDom.push("lg-item-" + this.lgId + "-" + 0);
      } else if (index === 0) {
        itemsToBeInsertedToDom.push("lg-item-" + this.lgId + "-" + (this.galleryItems.length - 1));
      }
    }
    if (itemsToBeInsertedToDom.indexOf(prevIndexItem) === -1) {
      itemsToBeInsertedToDom.push("lg-item-" + this.lgId + "-" + prevIndex);
    }
    return itemsToBeInsertedToDom;
  };
  LightGallery2.prototype.organizeSlideItems = function(index, prevIndex) {
    var _this = this;
    var itemsToBeInsertedToDom = this.getItemsToBeInsertedToDom(index, prevIndex, this.settings.numberOfSlideItemsInDom);
    itemsToBeInsertedToDom.forEach(function(item) {
      if (_this.currentItemsInDom.indexOf(item) === -1) {
        _this.$inner.append('<div id="' + item + '" class="lg-item"></div>');
      }
    });
    this.currentItemsInDom.forEach(function(item) {
      if (itemsToBeInsertedToDom.indexOf(item) === -1) {
        $LG("#" + item).remove();
      }
    });
    return itemsToBeInsertedToDom;
  };
  LightGallery2.prototype.getPreviousSlideIndex = function() {
    var prevIndex = 0;
    try {
      var currentItemId = this.outer.find(".lg-current").first().attr("id");
      prevIndex = parseInt(currentItemId.split("-")[3]) || 0;
    } catch (error) {
      prevIndex = 0;
    }
    return prevIndex;
  };
  LightGallery2.prototype.setDownloadValue = function(index) {
    if (this.settings.download) {
      var currentGalleryItem = this.galleryItems[index];
      var hideDownloadBtn = currentGalleryItem.downloadUrl === false || currentGalleryItem.downloadUrl === "false";
      if (hideDownloadBtn) {
        this.outer.addClass("lg-hide-download");
      } else {
        var $download = this.getElementById("lg-download");
        this.outer.removeClass("lg-hide-download");
        $download.attr("href", currentGalleryItem.downloadUrl || currentGalleryItem.src);
        if (currentGalleryItem.download) {
          $download.attr("download", currentGalleryItem.download);
        }
      }
    }
  };
  LightGallery2.prototype.makeSlideAnimation = function(direction, currentSlideItem, previousSlideItem) {
    var _this = this;
    if (this.lGalleryOn) {
      previousSlideItem.addClass("lg-slide-progress");
    }
    setTimeout(function() {
      _this.outer.addClass("lg-no-trans");
      _this.outer.find(".lg-item").removeClass("lg-prev-slide lg-next-slide");
      if (direction === "prev") {
        currentSlideItem.addClass("lg-prev-slide");
        previousSlideItem.addClass("lg-next-slide");
      } else {
        currentSlideItem.addClass("lg-next-slide");
        previousSlideItem.addClass("lg-prev-slide");
      }
      setTimeout(function() {
        _this.outer.find(".lg-item").removeClass("lg-current");
        currentSlideItem.addClass("lg-current");
        _this.outer.removeClass("lg-no-trans");
      }, 50);
    }, this.lGalleryOn ? this.settings.slideDelay : 0);
  };
  LightGallery2.prototype.slide = function(index, fromTouch, fromThumb, direction) {
    var _this = this;
    var prevIndex = this.getPreviousSlideIndex();
    this.currentItemsInDom = this.organizeSlideItems(index, prevIndex);
    if (this.lGalleryOn && prevIndex === index) {
      return;
    }
    var numberOfGalleryItems = this.galleryItems.length;
    if (!this.lgBusy) {
      if (this.settings.counter) {
        this.updateCurrentCounter(index);
      }
      var currentSlideItem = this.getSlideItem(index);
      var previousSlideItem_1 = this.getSlideItem(prevIndex);
      var currentGalleryItem = this.galleryItems[index];
      var videoInfo = currentGalleryItem.__slideVideoInfo;
      this.outer.attr("data-lg-slide-type", this.getSlideType(currentGalleryItem));
      this.setDownloadValue(index);
      if (videoInfo) {
        var _a = this.mediaContainerPosition, top_3 = _a.top, bottom = _a.bottom;
        var videoSize = utils.getSize(this.items[index], this.outer, top_3 + bottom, videoInfo && this.settings.videoMaxSize);
        this.resizeVideoSlide(index, videoSize);
      }
      this.LGel.trigger(lGEvents.beforeSlide, {
        prevIndex,
        index,
        fromTouch: !!fromTouch,
        fromThumb: !!fromThumb
      });
      this.lgBusy = true;
      clearTimeout(this.hideBarTimeout);
      this.arrowDisable(index);
      if (!direction) {
        if (index < prevIndex) {
          direction = "prev";
        } else if (index > prevIndex) {
          direction = "next";
        }
      }
      if (!fromTouch) {
        this.makeSlideAnimation(direction, currentSlideItem, previousSlideItem_1);
      } else {
        this.outer.find(".lg-item").removeClass("lg-prev-slide lg-current lg-next-slide");
        var touchPrev = void 0;
        var touchNext = void 0;
        if (numberOfGalleryItems > 2) {
          touchPrev = index - 1;
          touchNext = index + 1;
          if (index === 0 && prevIndex === numberOfGalleryItems - 1) {
            touchNext = 0;
            touchPrev = numberOfGalleryItems - 1;
          } else if (index === numberOfGalleryItems - 1 && prevIndex === 0) {
            touchNext = 0;
            touchPrev = numberOfGalleryItems - 1;
          }
        } else {
          touchPrev = 0;
          touchNext = 1;
        }
        if (direction === "prev") {
          this.getSlideItem(touchNext).addClass("lg-next-slide");
        } else {
          this.getSlideItem(touchPrev).addClass("lg-prev-slide");
        }
        currentSlideItem.addClass("lg-current");
      }
      if (!this.lGalleryOn) {
        this.loadContent(index, true);
      } else {
        setTimeout(function() {
          _this.loadContent(index, true);
          if (_this.settings.appendSubHtmlTo !== ".lg-item") {
            _this.addHtml(index);
          }
        }, this.settings.speed + 50 + (fromTouch ? 0 : this.settings.slideDelay));
      }
      setTimeout(function() {
        _this.lgBusy = false;
        previousSlideItem_1.removeClass("lg-slide-progress");
        _this.LGel.trigger(lGEvents.afterSlide, {
          prevIndex,
          index,
          fromTouch,
          fromThumb
        });
      }, (this.lGalleryOn ? this.settings.speed + 100 : 100) + (fromTouch ? 0 : this.settings.slideDelay));
    }
    this.index = index;
  };
  LightGallery2.prototype.updateCurrentCounter = function(index) {
    this.getElementById("lg-counter-current").html(index + 1 + "");
  };
  LightGallery2.prototype.updateCounterTotal = function() {
    this.getElementById("lg-counter-all").html(this.galleryItems.length + "");
  };
  LightGallery2.prototype.getSlideType = function(item) {
    if (item.__slideVideoInfo) {
      return "video";
    } else if (item.iframe) {
      return "iframe";
    } else {
      return "image";
    }
  };
  LightGallery2.prototype.touchMove = function(startCoords, endCoords, e) {
    var distanceX = endCoords.pageX - startCoords.pageX;
    var distanceY = endCoords.pageY - startCoords.pageY;
    var allowSwipe = false;
    if (this.swipeDirection) {
      allowSwipe = true;
    } else {
      if (Math.abs(distanceX) > 15) {
        this.swipeDirection = "horizontal";
        allowSwipe = true;
      } else if (Math.abs(distanceY) > 15) {
        this.swipeDirection = "vertical";
        allowSwipe = true;
      }
    }
    if (!allowSwipe) {
      return;
    }
    var $currentSlide = this.getSlideItem(this.index);
    if (this.swipeDirection === "horizontal") {
      e === null || e === void 0 ? void 0 : e.preventDefault();
      this.outer.addClass("lg-dragging");
      this.setTranslate($currentSlide, distanceX, 0);
      var width = $currentSlide.get().offsetWidth;
      var slideWidthAmount = width * 15 / 100;
      var gutter = slideWidthAmount - Math.abs(distanceX * 10 / 100);
      this.setTranslate(this.outer.find(".lg-prev-slide").first(), -width + distanceX - gutter, 0);
      this.setTranslate(this.outer.find(".lg-next-slide").first(), width + distanceX + gutter, 0);
    } else if (this.swipeDirection === "vertical") {
      if (this.settings.swipeToClose) {
        e === null || e === void 0 ? void 0 : e.preventDefault();
        this.$container.addClass("lg-dragging-vertical");
        var opacity = 1 - Math.abs(distanceY) / window.innerHeight;
        this.$backdrop.css("opacity", opacity);
        var scale = 1 - Math.abs(distanceY) / (window.innerWidth * 2);
        this.setTranslate($currentSlide, 0, distanceY, scale, scale);
        if (Math.abs(distanceY) > 100) {
          this.outer.addClass("lg-hide-items").removeClass("lg-components-open");
        }
      }
    }
  };
  LightGallery2.prototype.touchEnd = function(endCoords, startCoords, event) {
    var _this = this;
    var distance;
    if (this.settings.mode !== "lg-slide") {
      this.outer.addClass("lg-slide");
    }
    setTimeout(function() {
      _this.$container.removeClass("lg-dragging-vertical");
      _this.outer.removeClass("lg-dragging lg-hide-items").addClass("lg-components-open");
      var triggerClick = true;
      if (_this.swipeDirection === "horizontal") {
        distance = endCoords.pageX - startCoords.pageX;
        var distanceAbs = Math.abs(endCoords.pageX - startCoords.pageX);
        if (distance < 0 && distanceAbs > _this.settings.swipeThreshold) {
          _this.goToNextSlide(true);
          triggerClick = false;
        } else if (distance > 0 && distanceAbs > _this.settings.swipeThreshold) {
          _this.goToPrevSlide(true);
          triggerClick = false;
        }
      } else if (_this.swipeDirection === "vertical") {
        distance = Math.abs(endCoords.pageY - startCoords.pageY);
        if (_this.settings.closable && _this.settings.swipeToClose && distance > 100) {
          _this.closeGallery();
          return;
        } else {
          _this.$backdrop.css("opacity", 1);
        }
      }
      _this.outer.find(".lg-item").removeAttr("style");
      if (triggerClick && Math.abs(endCoords.pageX - startCoords.pageX) < 5) {
        var target = $LG(event.target);
        if (_this.isPosterElement(target)) {
          _this.LGel.trigger(lGEvents.posterClick);
        }
      }
      _this.swipeDirection = void 0;
    });
    setTimeout(function() {
      if (!_this.outer.hasClass("lg-dragging") && _this.settings.mode !== "lg-slide") {
        _this.outer.removeClass("lg-slide");
      }
    }, this.settings.speed + 100);
  };
  LightGallery2.prototype.enableSwipe = function() {
    var _this = this;
    var startCoords = {};
    var endCoords = {};
    var isMoved = false;
    var isSwiping = false;
    if (this.settings.enableSwipe) {
      this.$inner.on("touchstart.lg", function(e) {
        _this.dragOrSwipeEnabled = true;
        var $item = _this.getSlideItem(_this.index);
        if (($LG(e.target).hasClass("lg-item") || $item.get().contains(e.target)) && !_this.outer.hasClass("lg-zoomed") && !_this.lgBusy && e.touches.length === 1) {
          isSwiping = true;
          _this.touchAction = "swipe";
          _this.manageSwipeClass();
          startCoords = {
            pageX: e.touches[0].pageX,
            pageY: e.touches[0].pageY
          };
        }
      });
      this.$inner.on("touchmove.lg", function(e) {
        if (isSwiping && _this.touchAction === "swipe" && e.touches.length === 1) {
          endCoords = {
            pageX: e.touches[0].pageX,
            pageY: e.touches[0].pageY
          };
          _this.touchMove(startCoords, endCoords, e);
          isMoved = true;
        }
      });
      this.$inner.on("touchend.lg", function(event) {
        if (_this.touchAction === "swipe") {
          if (isMoved) {
            isMoved = false;
            _this.touchEnd(endCoords, startCoords, event);
          } else if (isSwiping) {
            var target = $LG(event.target);
            if (_this.isPosterElement(target)) {
              _this.LGel.trigger(lGEvents.posterClick);
            }
          }
          _this.touchAction = void 0;
          isSwiping = false;
        }
      });
    }
  };
  LightGallery2.prototype.enableDrag = function() {
    var _this = this;
    var startCoords = {};
    var endCoords = {};
    var isDraging = false;
    var isMoved = false;
    if (this.settings.enableDrag) {
      this.outer.on("mousedown.lg", function(e) {
        _this.dragOrSwipeEnabled = true;
        var $item = _this.getSlideItem(_this.index);
        if ($LG(e.target).hasClass("lg-item") || $item.get().contains(e.target)) {
          if (!_this.outer.hasClass("lg-zoomed") && !_this.lgBusy) {
            e.preventDefault();
            if (!_this.lgBusy) {
              _this.manageSwipeClass();
              startCoords = {
                pageX: e.pageX,
                pageY: e.pageY
              };
              isDraging = true;
              _this.outer.get().scrollLeft += 1;
              _this.outer.get().scrollLeft -= 1;
              _this.outer.removeClass("lg-grab").addClass("lg-grabbing");
              _this.LGel.trigger(lGEvents.dragStart);
            }
          }
        }
      });
      $LG(window).on("mousemove.lg.global" + this.lgId, function(e) {
        if (isDraging && _this.lgOpened) {
          isMoved = true;
          endCoords = {
            pageX: e.pageX,
            pageY: e.pageY
          };
          _this.touchMove(startCoords, endCoords);
          _this.LGel.trigger(lGEvents.dragMove);
        }
      });
      $LG(window).on("mouseup.lg.global" + this.lgId, function(event) {
        if (!_this.lgOpened) {
          return;
        }
        var target = $LG(event.target);
        if (isMoved) {
          isMoved = false;
          _this.touchEnd(endCoords, startCoords, event);
          _this.LGel.trigger(lGEvents.dragEnd);
        } else if (_this.isPosterElement(target)) {
          _this.LGel.trigger(lGEvents.posterClick);
        }
        if (isDraging) {
          isDraging = false;
          _this.outer.removeClass("lg-grabbing").addClass("lg-grab");
        }
      });
    }
  };
  LightGallery2.prototype.triggerPosterClick = function() {
    var _this = this;
    this.$inner.on("click.lg", function(event) {
      if (!_this.dragOrSwipeEnabled && _this.isPosterElement($LG(event.target))) {
        _this.LGel.trigger(lGEvents.posterClick);
      }
    });
  };
  LightGallery2.prototype.manageSwipeClass = function() {
    var _touchNext = this.index + 1;
    var _touchPrev = this.index - 1;
    if (this.settings.loop && this.galleryItems.length > 2) {
      if (this.index === 0) {
        _touchPrev = this.galleryItems.length - 1;
      } else if (this.index === this.galleryItems.length - 1) {
        _touchNext = 0;
      }
    }
    this.outer.find(".lg-item").removeClass("lg-next-slide lg-prev-slide");
    if (_touchPrev > -1) {
      this.getSlideItem(_touchPrev).addClass("lg-prev-slide");
    }
    this.getSlideItem(_touchNext).addClass("lg-next-slide");
  };
  LightGallery2.prototype.goToNextSlide = function(fromTouch) {
    var _this = this;
    var _loop = this.settings.loop;
    if (fromTouch && this.galleryItems.length < 3) {
      _loop = false;
    }
    if (!this.lgBusy) {
      if (this.index + 1 < this.galleryItems.length) {
        this.index++;
        this.LGel.trigger(lGEvents.beforeNextSlide, {
          index: this.index
        });
        this.slide(this.index, !!fromTouch, false, "next");
      } else {
        if (_loop) {
          this.index = 0;
          this.LGel.trigger(lGEvents.beforeNextSlide, {
            index: this.index
          });
          this.slide(this.index, !!fromTouch, false, "next");
        } else if (this.settings.slideEndAnimation && !fromTouch) {
          this.outer.addClass("lg-right-end");
          setTimeout(function() {
            _this.outer.removeClass("lg-right-end");
          }, 400);
        }
      }
    }
  };
  LightGallery2.prototype.goToPrevSlide = function(fromTouch) {
    var _this = this;
    var _loop = this.settings.loop;
    if (fromTouch && this.galleryItems.length < 3) {
      _loop = false;
    }
    if (!this.lgBusy) {
      if (this.index > 0) {
        this.index--;
        this.LGel.trigger(lGEvents.beforePrevSlide, {
          index: this.index,
          fromTouch
        });
        this.slide(this.index, !!fromTouch, false, "prev");
      } else {
        if (_loop) {
          this.index = this.galleryItems.length - 1;
          this.LGel.trigger(lGEvents.beforePrevSlide, {
            index: this.index,
            fromTouch
          });
          this.slide(this.index, !!fromTouch, false, "prev");
        } else if (this.settings.slideEndAnimation && !fromTouch) {
          this.outer.addClass("lg-left-end");
          setTimeout(function() {
            _this.outer.removeClass("lg-left-end");
          }, 400);
        }
      }
    }
  };
  LightGallery2.prototype.keyPress = function() {
    var _this = this;
    $LG(window).on("keydown.lg.global" + this.lgId, function(e) {
      if (_this.lgOpened && _this.settings.escKey === true && e.keyCode === 27) {
        e.preventDefault();
        if (_this.settings.allowMediaOverlap && _this.outer.hasClass("lg-can-toggle") && _this.outer.hasClass("lg-components-open")) {
          _this.outer.removeClass("lg-components-open");
        } else {
          _this.closeGallery();
        }
      }
      if (_this.lgOpened && _this.galleryItems.length > 1) {
        if (e.keyCode === 37) {
          e.preventDefault();
          _this.goToPrevSlide();
        }
        if (e.keyCode === 39) {
          e.preventDefault();
          _this.goToNextSlide();
        }
      }
    });
  };
  LightGallery2.prototype.arrow = function() {
    var _this = this;
    this.getElementById("lg-prev").on("click.lg", function() {
      _this.goToPrevSlide();
    });
    this.getElementById("lg-next").on("click.lg", function() {
      _this.goToNextSlide();
    });
  };
  LightGallery2.prototype.arrowDisable = function(index) {
    if (!this.settings.loop && this.settings.hideControlOnEnd) {
      var $prev = this.getElementById("lg-prev");
      var $next = this.getElementById("lg-next");
      if (index + 1 === this.galleryItems.length) {
        $next.attr("disabled", "disabled").addClass("disabled");
      } else {
        $next.removeAttr("disabled").removeClass("disabled");
      }
      if (index === 0) {
        $prev.attr("disabled", "disabled").addClass("disabled");
      } else {
        $prev.removeAttr("disabled").removeClass("disabled");
      }
    }
  };
  LightGallery2.prototype.setTranslate = function($el, xValue, yValue, scaleX, scaleY) {
    if (scaleX === void 0) {
      scaleX = 1;
    }
    if (scaleY === void 0) {
      scaleY = 1;
    }
    $el.css("transform", "translate3d(" + xValue + "px, " + yValue + "px, 0px) scale3d(" + scaleX + ", " + scaleY + ", 1)");
  };
  LightGallery2.prototype.mousewheel = function() {
    var _this = this;
    var lastCall = 0;
    this.outer.on("wheel.lg", function(e) {
      if (!e.deltaY || _this.galleryItems.length < 2) {
        return;
      }
      e.preventDefault();
      var now = new Date().getTime();
      if (now - lastCall < 1e3) {
        return;
      }
      lastCall = now;
      if (e.deltaY > 0) {
        _this.goToNextSlide();
      } else if (e.deltaY < 0) {
        _this.goToPrevSlide();
      }
    });
  };
  LightGallery2.prototype.isSlideElement = function(target) {
    return target.hasClass("lg-outer") || target.hasClass("lg-item") || target.hasClass("lg-img-wrap");
  };
  LightGallery2.prototype.isPosterElement = function(target) {
    var playButton = this.getSlideItem(this.index).find(".lg-video-play-button").get();
    return target.hasClass("lg-video-poster") || target.hasClass("lg-video-play-button") || playButton && playButton.contains(target.get());
  };
  LightGallery2.prototype.toggleMaximize = function() {
    var _this = this;
    this.getElementById("lg-maximize").on("click.lg", function() {
      _this.$container.toggleClass("lg-inline");
      _this.refreshOnResize();
    });
  };
  LightGallery2.prototype.invalidateItems = function() {
    for (var index = 0; index < this.items.length; index++) {
      var element = this.items[index];
      var $element = $LG(element);
      $element.off("click.lgcustom-item-" + $element.attr("data-lg-id"));
    }
  };
  LightGallery2.prototype.trapFocus = function() {
    var _this = this;
    this.$container.get().focus({
      preventScroll: true
    });
    $LG(window).on("keydown.lg.global" + this.lgId, function(e) {
      if (!_this.lgOpened) {
        return;
      }
      var isTabPressed = e.key === "Tab" || e.keyCode === 9;
      if (!isTabPressed) {
        return;
      }
      var focusableEls = utils.getFocusableElements(_this.$container.get());
      var firstFocusableEl = focusableEls[0];
      var lastFocusableEl = focusableEls[focusableEls.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableEl) {
          lastFocusableEl.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableEl) {
          firstFocusableEl.focus();
          e.preventDefault();
        }
      }
    });
  };
  LightGallery2.prototype.manageCloseGallery = function() {
    var _this = this;
    if (!this.settings.closable)
      return;
    var mousedown = false;
    this.getElementById("lg-close").on("click.lg", function() {
      _this.closeGallery();
    });
    if (this.settings.closeOnTap) {
      this.outer.on("mousedown.lg", function(e) {
        var target = $LG(e.target);
        if (_this.isSlideElement(target)) {
          mousedown = true;
        } else {
          mousedown = false;
        }
      });
      this.outer.on("mousemove.lg", function() {
        mousedown = false;
      });
      this.outer.on("mouseup.lg", function(e) {
        var target = $LG(e.target);
        if (_this.isSlideElement(target) && mousedown) {
          if (!_this.outer.hasClass("lg-dragging")) {
            _this.closeGallery();
          }
        }
      });
    }
  };
  LightGallery2.prototype.closeGallery = function(force) {
    var _this = this;
    if (!this.lgOpened || !this.settings.closable && !force) {
      return 0;
    }
    this.LGel.trigger(lGEvents.beforeClose);
    if (this.settings.resetScrollPosition && !this.settings.hideScrollbar) {
      $LG(window).scrollTop(this.prevScrollTop);
    }
    var currentItem = this.items[this.index];
    var transform;
    if (this.zoomFromOrigin && currentItem) {
      var _a = this.mediaContainerPosition, top_4 = _a.top, bottom = _a.bottom;
      var _b = this.galleryItems[this.index], __slideVideoInfo = _b.__slideVideoInfo, poster = _b.poster;
      var imageSize = utils.getSize(currentItem, this.outer, top_4 + bottom, __slideVideoInfo && poster && this.settings.videoMaxSize);
      transform = utils.getTransform(currentItem, this.outer, top_4, bottom, imageSize);
    }
    if (this.zoomFromOrigin && transform) {
      this.outer.addClass("lg-closing lg-zoom-from-image");
      this.getSlideItem(this.index).addClass("lg-start-end-progress").css("transition-duration", this.settings.startAnimationDuration + "ms").css("transform", transform);
    } else {
      this.outer.addClass("lg-hide-items");
      this.outer.removeClass("lg-zoom-from-image");
    }
    this.destroyModules();
    this.lGalleryOn = false;
    this.isDummyImageRemoved = false;
    this.zoomFromOrigin = this.settings.zoomFromOrigin;
    clearTimeout(this.hideBarTimeout);
    this.hideBarTimeout = false;
    $LG("html").removeClass("lg-on");
    this.outer.removeClass("lg-visible lg-components-open");
    this.$backdrop.removeClass("in").css("opacity", 0);
    var removeTimeout = this.zoomFromOrigin && transform ? Math.max(this.settings.startAnimationDuration, this.settings.backdropDuration) : this.settings.backdropDuration;
    this.$container.removeClass("lg-show-in");
    setTimeout(function() {
      if (_this.zoomFromOrigin && transform) {
        _this.outer.removeClass("lg-zoom-from-image");
      }
      _this.$container.removeClass("lg-show");
      _this.resetScrollBar();
      _this.$backdrop.removeAttr("style").css("transition-duration", _this.settings.backdropDuration + "ms");
      _this.outer.removeClass("lg-closing " + _this.settings.startClass);
      _this.getSlideItem(_this.index).removeClass("lg-start-end-progress");
      _this.$inner.empty();
      if (_this.lgOpened) {
        _this.LGel.trigger(lGEvents.afterClose, {
          instance: _this
        });
      }
      if (_this.$container.get()) {
        _this.$container.get().blur();
      }
      _this.lgOpened = false;
    }, removeTimeout + 100);
    return removeTimeout + 100;
  };
  LightGallery2.prototype.initModules = function() {
    this.plugins.forEach(function(module2) {
      try {
        module2.init();
      } catch (err) {
        console.warn("lightGallery:- make sure lightGallery module is properly initiated");
      }
    });
  };
  LightGallery2.prototype.destroyModules = function(destroy) {
    this.plugins.forEach(function(module2) {
      try {
        if (destroy) {
          module2.destroy();
        } else {
          module2.closeGallery && module2.closeGallery();
        }
      } catch (err) {
        console.warn("lightGallery:- make sure lightGallery module is properly destroyed");
      }
    });
  };
  LightGallery2.prototype.refresh = function(galleryItems) {
    if (!this.settings.dynamic) {
      this.invalidateItems();
    }
    if (galleryItems) {
      this.galleryItems = galleryItems;
    } else {
      this.galleryItems = this.getItems();
    }
    this.updateControls();
    this.openGalleryOnItemClick();
    this.LGel.trigger(lGEvents.updateSlides);
  };
  LightGallery2.prototype.updateControls = function() {
    this.addSlideVideoInfo(this.galleryItems);
    this.updateCounterTotal();
    this.manageSingleSlideClassName();
  };
  LightGallery2.prototype.destroyGallery = function() {
    this.destroyModules(true);
    if (!this.settings.dynamic) {
      this.invalidateItems();
    }
    $LG(window).off(".lg.global" + this.lgId);
    this.LGel.off(".lg");
    this.$container.remove();
  };
  LightGallery2.prototype.destroy = function() {
    var closeTimeout = this.closeGallery(true);
    if (closeTimeout) {
      setTimeout(this.destroyGallery.bind(this), closeTimeout);
    } else {
      this.destroyGallery();
    }
    return closeTimeout;
  };
  return LightGallery2;
}();
function lightGallery(el, options) {
  return new LightGallery(el, options);
}
var lightgallery_es5_default = lightGallery;

// node_modules/lightgallery/plugins/thumbnail/lg-thumbnail.es5.js
var __assign2 = function() {
  __assign2 = Object.assign || function __assign3(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign2.apply(this, arguments);
};
var thumbnailsSettings = {
  thumbnail: true,
  animateThumb: true,
  currentPagerPosition: "middle",
  alignThumbnails: "middle",
  thumbWidth: 100,
  thumbHeight: "80px",
  thumbMargin: 5,
  appendThumbnailsTo: ".lg-components",
  toggleThumb: false,
  enableThumbDrag: true,
  enableThumbSwipe: true,
  thumbnailSwipeThreshold: 10,
  loadYouTubeThumbnail: true,
  youTubeThumbSize: 1,
  thumbnailPluginStrings: {
    toggleThumbnails: "Toggle thumbnails"
  }
};
var lGEvents2 = {
  afterAppendSlide: "lgAfterAppendSlide",
  init: "lgInit",
  hasVideo: "lgHasVideo",
  containerResize: "lgContainerResize",
  updateSlides: "lgUpdateSlides",
  afterAppendSubHtml: "lgAfterAppendSubHtml",
  beforeOpen: "lgBeforeOpen",
  afterOpen: "lgAfterOpen",
  slideItemLoad: "lgSlideItemLoad",
  beforeSlide: "lgBeforeSlide",
  afterSlide: "lgAfterSlide",
  posterClick: "lgPosterClick",
  dragStart: "lgDragStart",
  dragMove: "lgDragMove",
  dragEnd: "lgDragEnd",
  beforeNextSlide: "lgBeforeNextSlide",
  beforePrevSlide: "lgBeforePrevSlide",
  beforeClose: "lgBeforeClose",
  afterClose: "lgAfterClose",
  rotateLeft: "lgRotateLeft",
  rotateRight: "lgRotateRight",
  flipHorizontal: "lgFlipHorizontal",
  flipVertical: "lgFlipVertical",
  autoplay: "lgAutoplay",
  autoplayStart: "lgAutoplayStart",
  autoplayStop: "lgAutoplayStop"
};
var Thumbnail = function() {
  function Thumbnail2(instance, $LG2) {
    this.thumbOuterWidth = 0;
    this.thumbTotalWidth = 0;
    this.translateX = 0;
    this.thumbClickable = false;
    this.core = instance;
    this.$LG = $LG2;
    return this;
  }
  Thumbnail2.prototype.init = function() {
    this.settings = __assign2(__assign2({}, thumbnailsSettings), this.core.settings);
    this.thumbOuterWidth = 0;
    this.thumbTotalWidth = this.core.galleryItems.length * (this.settings.thumbWidth + this.settings.thumbMargin);
    this.translateX = 0;
    this.setAnimateThumbStyles();
    if (!this.core.settings.allowMediaOverlap) {
      this.settings.toggleThumb = false;
    }
    if (this.settings.thumbnail) {
      this.build();
      if (this.settings.animateThumb) {
        if (this.settings.enableThumbDrag) {
          this.enableThumbDrag();
        }
        if (this.settings.enableThumbSwipe) {
          this.enableThumbSwipe();
        }
        this.thumbClickable = false;
      } else {
        this.thumbClickable = true;
      }
      this.toggleThumbBar();
      this.thumbKeyPress();
    }
  };
  Thumbnail2.prototype.build = function() {
    var _this = this;
    this.setThumbMarkup();
    this.manageActiveClassOnSlideChange();
    this.$lgThumb.first().on("click.lg touchend.lg", function(e) {
      var $target = _this.$LG(e.target);
      if (!$target.hasAttribute("data-lg-item-id")) {
        return;
      }
      setTimeout(function() {
        if (_this.thumbClickable && !_this.core.lgBusy) {
          var index = parseInt($target.attr("data-lg-item-id"));
          _this.core.slide(index, false, true, false);
        }
      }, 50);
    });
    this.core.LGel.on(lGEvents2.beforeSlide + ".thumb", function(event) {
      var index = event.detail.index;
      _this.animateThumb(index);
    });
    this.core.LGel.on(lGEvents2.beforeOpen + ".thumb", function() {
      _this.thumbOuterWidth = _this.core.outer.get().offsetWidth;
    });
    this.core.LGel.on(lGEvents2.updateSlides + ".thumb", function() {
      _this.rebuildThumbnails();
    });
    this.core.LGel.on(lGEvents2.containerResize + ".thumb", function() {
      if (!_this.core.lgOpened)
        return;
      setTimeout(function() {
        _this.thumbOuterWidth = _this.core.outer.get().offsetWidth;
        _this.animateThumb(_this.core.index);
        _this.thumbOuterWidth = _this.core.outer.get().offsetWidth;
      }, 50);
    });
  };
  Thumbnail2.prototype.setThumbMarkup = function() {
    var thumbOuterClassNames = "lg-thumb-outer ";
    if (this.settings.alignThumbnails) {
      thumbOuterClassNames += "lg-thumb-align-" + this.settings.alignThumbnails;
    }
    var html = '<div class="' + thumbOuterClassNames + '">\n        <div class="lg-thumb lg-group">\n        </div>\n        </div>';
    this.core.outer.addClass("lg-has-thumb");
    if (this.settings.appendThumbnailsTo === ".lg-components") {
      this.core.$lgComponents.append(html);
    } else {
      this.core.outer.append(html);
    }
    this.$thumbOuter = this.core.outer.find(".lg-thumb-outer").first();
    this.$lgThumb = this.core.outer.find(".lg-thumb").first();
    if (this.settings.animateThumb) {
      this.core.outer.find(".lg-thumb").css("transition-duration", this.core.settings.speed + "ms").css("width", this.thumbTotalWidth + "px").css("position", "relative");
    }
    this.setThumbItemHtml(this.core.galleryItems);
  };
  Thumbnail2.prototype.enableThumbDrag = function() {
    var _this = this;
    var thumbDragUtils = {
      cords: {
        startX: 0,
        endX: 0
      },
      isMoved: false,
      newTranslateX: 0,
      startTime: new Date(),
      endTime: new Date(),
      touchMoveTime: 0
    };
    var isDragging = false;
    this.$thumbOuter.addClass("lg-grab");
    this.core.outer.find(".lg-thumb").first().on("mousedown.lg.thumb", function(e) {
      if (_this.thumbTotalWidth > _this.thumbOuterWidth) {
        e.preventDefault();
        thumbDragUtils.cords.startX = e.pageX;
        thumbDragUtils.startTime = new Date();
        _this.thumbClickable = false;
        isDragging = true;
        _this.core.outer.get().scrollLeft += 1;
        _this.core.outer.get().scrollLeft -= 1;
        _this.$thumbOuter.removeClass("lg-grab").addClass("lg-grabbing");
      }
    });
    this.$LG(window).on("mousemove.lg.thumb.global" + this.core.lgId, function(e) {
      if (!_this.core.lgOpened)
        return;
      if (isDragging) {
        thumbDragUtils.cords.endX = e.pageX;
        thumbDragUtils = _this.onThumbTouchMove(thumbDragUtils);
      }
    });
    this.$LG(window).on("mouseup.lg.thumb.global" + this.core.lgId, function() {
      if (!_this.core.lgOpened)
        return;
      if (thumbDragUtils.isMoved) {
        thumbDragUtils = _this.onThumbTouchEnd(thumbDragUtils);
      } else {
        _this.thumbClickable = true;
      }
      if (isDragging) {
        isDragging = false;
        _this.$thumbOuter.removeClass("lg-grabbing").addClass("lg-grab");
      }
    });
  };
  Thumbnail2.prototype.enableThumbSwipe = function() {
    var _this = this;
    var thumbDragUtils = {
      cords: {
        startX: 0,
        endX: 0
      },
      isMoved: false,
      newTranslateX: 0,
      startTime: new Date(),
      endTime: new Date(),
      touchMoveTime: 0
    };
    this.$lgThumb.on("touchstart.lg", function(e) {
      if (_this.thumbTotalWidth > _this.thumbOuterWidth) {
        e.preventDefault();
        thumbDragUtils.cords.startX = e.targetTouches[0].pageX;
        _this.thumbClickable = false;
        thumbDragUtils.startTime = new Date();
      }
    });
    this.$lgThumb.on("touchmove.lg", function(e) {
      if (_this.thumbTotalWidth > _this.thumbOuterWidth) {
        e.preventDefault();
        thumbDragUtils.cords.endX = e.targetTouches[0].pageX;
        thumbDragUtils = _this.onThumbTouchMove(thumbDragUtils);
      }
    });
    this.$lgThumb.on("touchend.lg", function() {
      if (thumbDragUtils.isMoved) {
        thumbDragUtils = _this.onThumbTouchEnd(thumbDragUtils);
      } else {
        _this.thumbClickable = true;
      }
    });
  };
  Thumbnail2.prototype.rebuildThumbnails = function() {
    var _this = this;
    this.$thumbOuter.addClass("lg-rebuilding-thumbnails");
    setTimeout(function() {
      _this.thumbTotalWidth = _this.core.galleryItems.length * (_this.settings.thumbWidth + _this.settings.thumbMargin);
      _this.$lgThumb.css("width", _this.thumbTotalWidth + "px");
      _this.$lgThumb.empty();
      _this.setThumbItemHtml(_this.core.galleryItems);
      _this.animateThumb(_this.core.index);
    }, 50);
    setTimeout(function() {
      _this.$thumbOuter.removeClass("lg-rebuilding-thumbnails");
    }, 200);
  };
  Thumbnail2.prototype.setTranslate = function(value) {
    this.$lgThumb.css("transform", "translate3d(-" + value + "px, 0px, 0px)");
  };
  Thumbnail2.prototype.getPossibleTransformX = function(left) {
    if (left > this.thumbTotalWidth - this.thumbOuterWidth) {
      left = this.thumbTotalWidth - this.thumbOuterWidth;
    }
    if (left < 0) {
      left = 0;
    }
    return left;
  };
  Thumbnail2.prototype.animateThumb = function(index) {
    this.$lgThumb.css("transition-duration", this.core.settings.speed + "ms");
    if (this.settings.animateThumb) {
      var position = 0;
      switch (this.settings.currentPagerPosition) {
        case "left":
          position = 0;
          break;
        case "middle":
          position = this.thumbOuterWidth / 2 - this.settings.thumbWidth / 2;
          break;
        case "right":
          position = this.thumbOuterWidth - this.settings.thumbWidth;
      }
      this.translateX = (this.settings.thumbWidth + this.settings.thumbMargin) * index - 1 - position;
      if (this.translateX > this.thumbTotalWidth - this.thumbOuterWidth) {
        this.translateX = this.thumbTotalWidth - this.thumbOuterWidth;
      }
      if (this.translateX < 0) {
        this.translateX = 0;
      }
      this.setTranslate(this.translateX);
    }
  };
  Thumbnail2.prototype.onThumbTouchMove = function(thumbDragUtils) {
    thumbDragUtils.newTranslateX = this.translateX;
    thumbDragUtils.isMoved = true;
    thumbDragUtils.touchMoveTime = new Date().valueOf();
    thumbDragUtils.newTranslateX -= thumbDragUtils.cords.endX - thumbDragUtils.cords.startX;
    thumbDragUtils.newTranslateX = this.getPossibleTransformX(thumbDragUtils.newTranslateX);
    this.setTranslate(thumbDragUtils.newTranslateX);
    this.$thumbOuter.addClass("lg-dragging");
    return thumbDragUtils;
  };
  Thumbnail2.prototype.onThumbTouchEnd = function(thumbDragUtils) {
    thumbDragUtils.isMoved = false;
    thumbDragUtils.endTime = new Date();
    this.$thumbOuter.removeClass("lg-dragging");
    var touchDuration = thumbDragUtils.endTime.valueOf() - thumbDragUtils.startTime.valueOf();
    var distanceXnew = thumbDragUtils.cords.endX - thumbDragUtils.cords.startX;
    var speedX = Math.abs(distanceXnew) / touchDuration;
    if (speedX > 0.15 && thumbDragUtils.endTime.valueOf() - thumbDragUtils.touchMoveTime < 30) {
      speedX += 1;
      if (speedX > 2) {
        speedX += 1;
      }
      speedX = speedX + speedX * (Math.abs(distanceXnew) / this.thumbOuterWidth);
      this.$lgThumb.css("transition-duration", Math.min(speedX - 1, 2) + "settings");
      distanceXnew = distanceXnew * speedX;
      this.translateX = this.getPossibleTransformX(this.translateX - distanceXnew);
      this.setTranslate(this.translateX);
    } else {
      this.translateX = thumbDragUtils.newTranslateX;
    }
    if (Math.abs(thumbDragUtils.cords.endX - thumbDragUtils.cords.startX) < this.settings.thumbnailSwipeThreshold) {
      this.thumbClickable = true;
    }
    return thumbDragUtils;
  };
  Thumbnail2.prototype.getThumbHtml = function(thumb, index) {
    var slideVideoInfo = this.core.galleryItems[index].__slideVideoInfo || {};
    var thumbImg;
    if (slideVideoInfo.youtube) {
      if (this.settings.loadYouTubeThumbnail) {
        thumbImg = "//img.youtube.com/vi/" + slideVideoInfo.youtube[1] + "/" + this.settings.youTubeThumbSize + ".jpg";
      } else {
        thumbImg = thumb;
      }
    } else {
      thumbImg = thumb;
    }
    return '<div data-lg-item-id="' + index + '" class="lg-thumb-item ' + (index === this.core.index ? " active" : "") + '" \n        style="width:' + this.settings.thumbWidth + "px; height: " + this.settings.thumbHeight + ";\n            margin-right: " + this.settings.thumbMargin + 'px;">\n            <img data-lg-item-id="' + index + '" src="' + thumbImg + '" />\n        </div>';
  };
  Thumbnail2.prototype.getThumbItemHtml = function(items) {
    var thumbList = "";
    for (var i = 0; i < items.length; i++) {
      thumbList += this.getThumbHtml(items[i].thumb, i);
    }
    return thumbList;
  };
  Thumbnail2.prototype.setThumbItemHtml = function(items) {
    var thumbList = this.getThumbItemHtml(items);
    this.$lgThumb.html(thumbList);
  };
  Thumbnail2.prototype.setAnimateThumbStyles = function() {
    if (this.settings.animateThumb) {
      this.core.outer.addClass("lg-animate-thumb");
    }
  };
  Thumbnail2.prototype.manageActiveClassOnSlideChange = function() {
    var _this = this;
    this.core.LGel.on(lGEvents2.beforeSlide + ".thumb", function(event) {
      var $thumb = _this.core.outer.find(".lg-thumb-item");
      var index = event.detail.index;
      $thumb.removeClass("active");
      $thumb.eq(index).addClass("active");
    });
  };
  Thumbnail2.prototype.toggleThumbBar = function() {
    var _this = this;
    if (this.settings.toggleThumb) {
      this.core.outer.addClass("lg-can-toggle");
      this.core.$toolbar.append('<button type="button" aria-label="' + this.settings.thumbnailPluginStrings["toggleThumbnails"] + '" class="lg-toggle-thumb lg-icon"></button>');
      this.core.outer.find(".lg-toggle-thumb").first().on("click.lg", function() {
        _this.core.outer.toggleClass("lg-components-open");
      });
    }
  };
  Thumbnail2.prototype.thumbKeyPress = function() {
    var _this = this;
    this.$LG(window).on("keydown.lg.thumb.global" + this.core.lgId, function(e) {
      if (!_this.core.lgOpened || !_this.settings.toggleThumb)
        return;
      if (e.keyCode === 38) {
        e.preventDefault();
        _this.core.outer.addClass("lg-components-open");
      } else if (e.keyCode === 40) {
        e.preventDefault();
        _this.core.outer.removeClass("lg-components-open");
      }
    });
  };
  Thumbnail2.prototype.destroy = function() {
    if (this.settings.thumbnail) {
      this.$LG(window).off(".lg.thumb.global" + this.core.lgId);
      this.core.LGel.off(".lg.thumb");
      this.core.LGel.off(".thumb");
      this.$thumbOuter.remove();
      this.core.outer.removeClass("lg-has-thumb");
    }
  };
  return Thumbnail2;
}();
var lg_thumbnail_es5_default = Thumbnail;

// src/build-lightbox.ts
var lightbox = (gallery, imagesList, app2) => {
  const lightboxImages = imagesList.filter((file) => (file.kind || "image") === "image");
  if (import_obsidian3.Platform.isDesktop)
    globalSearchBtn(gallery, lightboxImages, app2);
  const galleryLightbox = lightgallery_es5_default(gallery, {
    plugins: [lg_thumbnail_es5_default],
    selector: '.grid-item[data-media-kind="image"]',
    counter: false,
    download: false,
    thumbnail: true,
    loop: false,
    mode: "lg-fade",
    licenseKey: "1234-1234-123-1234"
  });
  let destroyZoom = null;
  if (import_obsidian3.Platform.isDesktop)
    destroyZoom = installCustomZoom(galleryLightbox);
  if (import_obsidian3.Platform.isIosApp || import_obsidian3.Platform.isAndroidApp) {
    const elements = document.querySelectorAll(".lg-close, .lg-prev, .lg-next");
    for (const element of elements) {
      element.style.display = "none";
    }
  }
  galleryLightbox.__imgGalleryDestroyZoom = destroyZoom;
  gallery.querySelectorAll('.grid-item[data-media-kind="video"]').forEach((item) => {
    item.addEventListener("click", () => {
      const itemPath = item.getAttribute("data-path");
      const matched = imagesList.find((file) => file.kind === "video" && file.path === itemPath);
      if (matched)
        getVideoModal().open(matched);
    });
  });
  gallery.querySelectorAll('.grid-item[data-media-kind="audio"]').forEach((item) => {
    item.addEventListener("click", () => {
      const itemPath = item.getAttribute("data-path");
      const matched = imagesList.find((file) => file.kind === "audio" && file.path === itemPath);
      if (matched)
        getAudioModal().open(matched);
    });
  });
  return galleryLightbox;
};
var globalSearchBtn = (gallery, imagesList, app2) => {
  gallery.addEventListener("lgInit", (event) => {
    const galleryInstance = event.detail.instance;
    const btn = '<button type="button" id="btn-glob-search" class="lg-icon btn-glob-search"></button>';
    galleryInstance.outer.find(".lg-toolbar").append(btn);
    galleryInstance.outer.find("#btn-glob-search").on("click", () => {
      const index = galleryInstance.index;
      const selected = imagesList[index];
      const selectedFile = /^https?:\/\//i.test(selected.path) ? null : app2.vault.getAbstractFileByPath(selected.path);
      if (selectedFile instanceof import_obsidian3.TFile)
        app2.workspace.getLeaf(true).openFile(selectedFile, { active: true });
      galleryInstance.closeGallery();
    });
  });
};
var build_lightbox_default = lightbox;

// src/init.ts
var imgGalleryInit = class extends import_obsidian4.MarkdownRenderChild {
  constructor(plugin, src, container, app2, sourcePath, blockType) {
    super(container);
    this.plugin = plugin;
    this.src = src;
    this.container = container;
    this.app = app2;
    this.sourcePath = sourcePath;
    this.blockType = blockType;
    this._gallery = null;
    this._lightbox = null;
    this._settings = {};
    this._imagesList = {};
  }
  onload() {
    return __async(this, null, function* () {
      const explicitBlock = parseExplicitBlock(this.app, this.container, this.src, this.sourcePath);
      const explicitImages = explicitBlock.images;
      const hasExplicitPath = typeof explicitBlock.overrides.path !== "undefined";
      if (explicitImages.length || hasExplicitPath) {
        this._settings = getDefaultGallerySettings("vertical");
        this._settings.radius = 10;
        Object.assign(this._settings, explicitBlock.overrides);
        if (this._settings.type === "collage")
          this._settings.type = "mosaic";
        const pathImages = hasExplicitPath ? get_imgs_list_default(this.plugin, this.app, this.container, this._settings) : [];
        this._imagesList = mergeMediaEntries(pathImages, explicitImages).filter(createMediaItemFilter(this._settings));
      } else {
        this._settings = get_settings_default(this.src, this.container);
        this._imagesList = get_imgs_list_default(this.plugin, this.app, this.container, this._settings);
      }
      if (this._settings.type === "horizontal") {
        this._gallery = build_horizontal_default(this.container, this._imagesList, this._settings);
      } else if (this._settings.type === "mosaic" || this._settings.type === "collage") {
        this._gallery = build_collage_default(this.container, this._imagesList, this._settings);
      } else if (this._settings.type === "vertical") {
        this._gallery = build_vertical_default(this.container, this._imagesList, this._settings);
      }
      this._lightbox = build_lightbox_default(this._gallery, this._imagesList, this.app);
    });
  }
  onunload() {
    return __async(this, null, function* () {
      if (this._gallery) {
        this._gallery.remove();
        this._gallery = null;
      }
      if (this._lightbox) {
        if (this._lightbox.__imgGalleryDestroyZoom)
          this._lightbox.__imgGalleryDestroyZoom();
        this._lightbox.destroy();
        this._lightbox = null;
      }
    });
  }
};

// src/main.ts
var DEFAULT_PLUGIN_SETTINGS = {
  enableCache: true,
  enableAudioVisualizations: true,
  autoplayAudioOnOpen: true,
  enableFlexiblePathPatterns: true
};
var ImgGallerySettingTab = class extends import_obsidian5.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h3", { text: "Performance" });
    new import_obsidian5.Setting(containerEl).setName("Enable cache").setDesc("Caches the vault media list and per-folder lookups in memory. Disable this if the plugin uses too much RAM; galleries will rescan files on each render.").addToggle((toggle) => toggle.setValue(this.plugin.settings.enableCache).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.enableCache = value;
      galleryRuntimeSettings.enableCache = value;
      this.plugin.invalidateImageCache();
      yield this.plugin.saveSettings();
    })));
    containerEl.createEl("h3", { text: "Paths" });
    new import_obsidian5.Setting(containerEl).setName("Enable flexible path patterns").setDesc("Allows wildcard patterns like `media/**/concert*` and `media/2025-??`. Regular paths, `folder/*`, and `folder/**` stay on the fast path either way.").addToggle((toggle) => toggle.setValue(this.plugin.settings.enableFlexiblePathPatterns).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.enableFlexiblePathPatterns = value;
      galleryRuntimeSettings.enableFlexiblePathPatterns = value;
      this.plugin.invalidateImageCache();
      yield this.plugin.saveSettings();
    })));
    containerEl.createEl("h3", { text: "Audio" });
    new import_obsidian5.Setting(containerEl).setName("Enable audio visualizations").setDesc("Enables audio waveform and spectrogram rendering inside gallery blocks. If disabled, audio cards show only metadata and cover art.").addToggle((toggle) => toggle.setValue(this.plugin.settings.enableAudioVisualizations).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.enableAudioVisualizations = value;
      galleryRuntimeSettings.enableAudioVisualizations = value;
      this.plugin.invalidateImageCache();
      yield this.plugin.saveSettings();
    })));
    new import_obsidian5.Setting(containerEl).setName("Autoplay audio on open").setDesc("Starts audio playback automatically when you open an audio card.").addToggle((toggle) => toggle.setValue(this.plugin.settings.autoplayAudioOnOpen).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.autoplayAudioOnOpen = value;
      galleryRuntimeSettings.autoplayAudioOnOpen = value;
      yield this.plugin.saveSettings();
    })));
  }
};
var ImgGallery = class extends import_obsidian5.Plugin {
  loadSettings() {
    return __async(this, null, function* () {
      const loaded = yield this.loadData();
      this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, loaded);
      if (loaded && typeof loaded.enableAudioVisualizations === "undefined" && typeof loaded.enableSpectrogram !== "undefined")
        this.settings.enableAudioVisualizations = loaded.enableSpectrogram;
      galleryRuntimeSettings.enableCache = this.settings.enableCache;
      galleryRuntimeSettings.enableAudioVisualizations = this.settings.enableAudioVisualizations;
      galleryRuntimeSettings.autoplayAudioOnOpen = this.settings.autoplayAudioOnOpen;
      galleryRuntimeSettings.enableFlexiblePathPatterns = this.settings.enableFlexiblePathPatterns;
    });
  }
  saveSettings() {
    return __async(this, null, function* () {
      yield this.saveData(this.settings);
    });
  }
  onload() {
    return __async(this, null, function* () {
      yield this.loadSettings();
      this._cachedMediaFiles = null;
      this._cachedMediaFolders = /* @__PURE__ */ new Map();
      this.addSettingTab(new ImgGallerySettingTab(this.app, this));
      this.registerEvent(this.app.vault.on("create", () => this.invalidateImageCache()));
      this.registerEvent(this.app.vault.on("delete", () => this.invalidateImageCache()));
      this.registerEvent(this.app.vault.on("rename", () => this.invalidateImageCache()));
      const registerGalleryBlock = (blockType) => {
        this.registerMarkdownCodeBlockProcessor(blockType, (src, el, ctx) => {
          const handler = new imgGalleryInit(this, src, el, this.app, ctx.sourcePath, blockType);
          ctx.addChild(handler);
        });
      };
      registerGalleryBlock("img-gallery");
      registerGalleryBlock("img-gal");
      registerGalleryBlock("media-gallery");
    });
  }
  invalidateImageCache() {
    this._cachedMediaFiles = null;
    this._cachedMediaFolders = /* @__PURE__ */ new Map();
    clearAudioCaches();
  }
  getCachedMediaFiles(path) {
    if (!this.settings.enableCache) {
      const allMediaFiles = this.app.vault.getFiles().filter((file) => isVaultMedia(file));
      if (isSearchEverywherePath(path))
        return allMediaFiles;
      const normalizedPath = normalizeMediaSearchPath(path);
      if (isShallowGlobPath(path))
        return allMediaFiles.filter((file) => {
          var _a;
          return ((_a = file.parent) == null ? void 0 : _a.path) === normalizedPath;
        });
      const prefix = `${normalizedPath}/`;
      return allMediaFiles.filter((file) => file.path.startsWith(prefix));
    }
    if (!this._cachedMediaFiles) {
      this._cachedMediaFiles = this.app.vault.getFiles().filter((file) => isVaultMedia(file));
    }
    if (isSearchEverywherePath(path))
      return this._cachedMediaFiles;
    const normalizedPath = normalizeMediaSearchPath(path);
    const cacheKey = isShallowGlobPath(path) ? `${normalizedPath}/*` : normalizedPath;
    if (this._cachedMediaFolders.has(cacheKey))
      return this._cachedMediaFolders.get(cacheKey);
    if (isShallowGlobPath(path)) {
      const shallowFiltered = this._cachedMediaFiles.filter((file) => {
        var _a;
        return ((_a = file.parent) == null ? void 0 : _a.path) === normalizedPath;
      });
      this._cachedMediaFolders.set(cacheKey, shallowFiltered);
      return shallowFiltered;
    }
    const prefix = `${normalizedPath}/`;
    const filtered = this._cachedMediaFiles.filter((file) => file.path.startsWith(prefix));
    this._cachedMediaFolders.set(cacheKey, filtered);
    return filtered;
  }
  getCachedImageFiles(path) {
    return this.getCachedMediaFiles(path);
  }
  onunload() {
    this.invalidateImageCache();
  }
};
/*!
 * lightgallery | 2.7.0 | October 9th 2022
 * http://www.lightgalleryjs.com/
 * Copyright (c) 2020 Sachin Neravath;
 * @license GPLv3
 */
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

/* nosourcemap */
