import { Plugin } from "obsidian";
import type { TFile } from "obsidian";
import { cleanupMediaModals } from "./build-lightbox";
import {
  clearAudioCaches,
  isSearchEverywherePath,
  isShallowGlobPath,
  isVaultMedia,
  normalizeMediaSearchPath,
  revokeAudioObjectUrls,
} from "./get-imgs-list";
import { ImgGalleryInit } from "./init";
import { DEFAULT_PLUGIN_SETTINGS, galleryRuntimeSettings } from "./runtime-settings";
import { ImgGallerySettingTab } from "./settings-tab";
import { isRecord } from "./utils";
import type { MediaCacheHost, MediaGalleryPluginSettings } from "./types";

type LoadedSettings = Partial<MediaGalleryPluginSettings> & {
  enableSpectrogram?: boolean;
};

export default class ImgGallery extends Plugin implements MediaCacheHost {
  settings: MediaGalleryPluginSettings = { ...DEFAULT_PLUGIN_SETTINGS };
  _cachedMediaFiles: TFile[] | null = null;
  _cachedMediaFolders = new Map<string, TFile[]>();

  async loadSettings(): Promise<void> {
    const rawLoaded: unknown = await this.loadData();
    const loaded: LoadedSettings = isRecord(rawLoaded) ? rawLoaded : {};

    this.settings = {
      ...DEFAULT_PLUGIN_SETTINGS,
      ...loaded,
    };

    if (
      typeof loaded.enableAudioVisualizations === "undefined" &&
      typeof loaded.enableSpectrogram !== "undefined"
    ) {
      this.settings.enableAudioVisualizations = loaded.enableSpectrogram;
    }

    galleryRuntimeSettings.enableCache = this.settings.enableCache;
    galleryRuntimeSettings.enableAudioVisualizations = this.settings.enableAudioVisualizations;
    galleryRuntimeSettings.autoplayAudioOnOpen = this.settings.autoplayAudioOnOpen;
    galleryRuntimeSettings.enableFlexiblePathPatterns = this.settings.enableFlexiblePathPatterns;
    galleryRuntimeSettings.matchWildcardsAgainstFileNames =
      this.settings.enableFlexiblePathPatterns && this.settings.matchWildcardsAgainstFileNames;
    galleryRuntimeSettings.showPathErrors = this.settings.showPathErrors;
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async onload(): Promise<void> {
    await this.loadSettings();
    this.invalidateImageCache();

    this.addSettingTab(new ImgGallerySettingTab(this));
    this.registerEvent(
      this.app.vault.on("create", () => {
        this.invalidateImageCache();
      }),
    );
    this.registerEvent(
      this.app.vault.on("delete", () => {
        this.invalidateImageCache();
      }),
    );
    this.registerEvent(
      this.app.vault.on("rename", () => {
        this.invalidateImageCache();
      }),
    );

    const registerGalleryBlock = (blockType: string): void => {
      this.registerMarkdownCodeBlockProcessor(blockType, (src, el, ctx) => {
        const handler = new ImgGalleryInit(this, src, el, this.app, ctx.sourcePath);
        ctx.addChild(handler);
      });
    };

    registerGalleryBlock("img-gallery");
    registerGalleryBlock("img-gal");
    registerGalleryBlock("media-gallery");
  }

  invalidateImageCache(): void {
    this._cachedMediaFiles = null;
    this._cachedMediaFolders = new Map<string, TFile[]>();
    clearAudioCaches();
  }

  getCachedMediaFiles(path?: string): TFile[] {
    if (!this.settings.enableCache) {
      const allMediaFiles = this.app.vault.getFiles().filter((file) => isVaultMedia(file));
      if (isSearchEverywherePath(path)) {
        return allMediaFiles;
      }

      const normalizedPath = normalizeMediaSearchPath(path ?? "");
      if (isShallowGlobPath(path)) {
        return allMediaFiles.filter((file) => file.parent?.path === normalizedPath);
      }

      const prefix = `${normalizedPath}/`;
      return allMediaFiles.filter((file) => file.path.startsWith(prefix));
    }

    if (!this._cachedMediaFiles) {
      this._cachedMediaFiles = this.app.vault.getFiles().filter((file) => isVaultMedia(file));
    }

    if (isSearchEverywherePath(path)) {
      return this._cachedMediaFiles;
    }

    const normalizedPath = normalizeMediaSearchPath(path ?? "");
    const cacheKey = isShallowGlobPath(path) ? `${normalizedPath}/*` : normalizedPath;
    const cached = this._cachedMediaFolders.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (isShallowGlobPath(path)) {
      const shallowFiltered = this._cachedMediaFiles.filter(
        (file) => file.parent?.path === normalizedPath,
      );
      this._cachedMediaFolders.set(cacheKey, shallowFiltered);
      return shallowFiltered;
    }

    const prefix = `${normalizedPath}/`;
    const filtered = this._cachedMediaFiles.filter((file) => file.path.startsWith(prefix));
    this._cachedMediaFolders.set(cacheKey, filtered);
    return filtered;
  }

  onunload(): void {
    this.invalidateImageCache();
    revokeAudioObjectUrls();
    cleanupMediaModals();
  }
}
