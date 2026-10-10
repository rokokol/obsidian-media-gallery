import { describe, expect, it, vi } from "vitest";
import type { SettingDefinitionControl, SettingDefinitionGroup } from "obsidian";
import { DEFAULT_PLUGIN_SETTINGS, galleryRuntimeSettings } from "./runtime-settings";
import { ImgGallerySettingTab } from "./settings-tab";
import type { SettingsHost } from "./settings-tab";

const makeTab = (overrides: Partial<typeof DEFAULT_PLUGIN_SETTINGS> = {}) => {
  const plugin = {
    app: {},
    settings: { ...DEFAULT_PLUGIN_SETTINGS, ...overrides },
    invalidateImageCache: vi.fn(),
    saveSettings: vi.fn(() => Promise.resolve()),
  };
  Object.assign(galleryRuntimeSettings, plugin.settings);
  const tab = new ImgGallerySettingTab(plugin as unknown as SettingsHost);
  const update = vi.spyOn(tab, "update");
  return { plugin, tab, update };
};

const controls = (tab: ImgGallerySettingTab): SettingDefinitionControl[] =>
  tab
    .getSettingDefinitions()
    .flatMap((item) => (item as SettingDefinitionGroup).items ?? []) as SettingDefinitionControl[];

describe("getSettingDefinitions", () => {
  it("has one toggle for every plugin setting", () => {
    const keys = controls(makeTab().tab)
      .map((def) => def.control.key)
      .sort();
    expect(keys).toEqual(Object.keys(DEFAULT_PLUGIN_SETTINGS).sort());
  });

  it("groups the toggles under the three headings", () => {
    const headings = makeTab()
      .tab.getSettingDefinitions()
      .map((item) => (item as SettingDefinitionGroup).heading);
    expect(headings).toEqual(["Performance", "Paths", "Audio"]);
  });

  it("disables the file-name toggle exactly while flexible patterns are off", () => {
    const { plugin, tab } = makeTab();
    const wildcard = controls(tab).find(
      (def) => def.control.key === "matchWildcardsAgainstFileNames",
    );
    const disabled = wildcard?.control.disabled as () => boolean;

    expect(disabled()).toBe(false);
    plugin.settings.enableFlexiblePathPatterns = false;
    expect(disabled()).toBe(true);
  });
});

describe("setControlValue", () => {
  it("stores a change for the plugin and for the running galleries, drops the caches and saves", async () => {
    const { plugin, tab } = makeTab();
    await tab.setControlValue("enableCache", false);

    expect(plugin.settings.enableCache).toBe(false);
    expect(galleryRuntimeSettings.enableCache).toBe(false);
    expect(plugin.invalidateImageCache).toHaveBeenCalledTimes(1);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it("leaves the caches alone for a setting that does not change what a gallery lists", async () => {
    const { plugin, tab } = makeTab();
    await tab.setControlValue("showPathErrors", false);

    expect(galleryRuntimeSettings.showPathErrors).toBe(false);
    expect(plugin.invalidateImageCache).not.toHaveBeenCalled();
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it("switches the file-name match off and redraws the tab when flexible patterns go off", async () => {
    const { plugin, tab, update } = makeTab();
    await tab.setControlValue("enableFlexiblePathPatterns", false);

    expect(plugin.settings.matchWildcardsAgainstFileNames).toBe(false);
    expect(galleryRuntimeSettings.matchWildcardsAgainstFileNames).toBe(false);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("ignores the file-name match while flexible patterns are off", async () => {
    const { plugin, tab } = makeTab({
      enableFlexiblePathPatterns: false,
      matchWildcardsAgainstFileNames: false,
    });
    await tab.setControlValue("matchWildcardsAgainstFileNames", true);

    expect(plugin.settings.matchWildcardsAgainstFileNames).toBe(false);
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });

  it("ignores an unknown key and a value that is not a boolean", async () => {
    const { plugin, tab } = makeTab();
    await tab.setControlValue("nonsense", true);
    await tab.setControlValue("enableCache", "no");

    expect(plugin.settings).toEqual(DEFAULT_PLUGIN_SETTINGS);
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });
});

describe("getControlValue", () => {
  it("shows the file-name match as off while flexible patterns are off, whatever is stored", () => {
    const { tab } = makeTab({
      enableFlexiblePathPatterns: false,
      matchWildcardsAgainstFileNames: true,
    });
    expect(tab.getControlValue("matchWildcardsAgainstFileNames")).toBe(false);
  });
});
