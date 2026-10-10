// check-since.mjs decides whether the plugin calls an Obsidian API newer than minAppVersion. A
// checker that has never been seen failing proves nothing, so these tests run it on small
// fixture projects: one that calls newer API, in each of the ways the checker claims to see,
// and one that does not. The fixture carries its own obsidian.d.ts, so the @since values are
// fixed here and do not move with the installed package
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const checker = path.resolve(__dirname, "../check-since.mjs");
const roots: string[] = [];

const OBSIDIAN_TYPES = `
export declare class PluginSettingTab {
  /** @since 0.9.0 */
  display(): void;
  /** @since 1.13.0 */
  update(): void;
}
export interface SettingDefinition {
  /** @since 0.9.0 */
  name?: string;
  /** @since 1.13.0 */
  render?: () => void;
}
`;

interface Fixture {
  minAppVersion?: string;
  files: Record<string, string>;
}

const makeProject = ({ minAppVersion = "1.12.0", files }: Fixture): string => {
  const root = mkdtempSync(path.join(tmpdir(), "check-since-"));
  roots.push(root);
  const write = (name: string, content: string): void => {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), content);
  };
  if (minAppVersion) write("manifest.json", JSON.stringify({ minAppVersion }));
  write(
    "tsconfig.json",
    JSON.stringify({
      compilerOptions: { module: "ESNext", moduleResolution: "node", strict: true, noEmit: true },
      include: ["src/**/*.ts"],
    }),
  );
  write(
    "node_modules/obsidian/package.json",
    JSON.stringify({ name: "obsidian", types: "obsidian.d.ts" }),
  );
  write("node_modules/obsidian/obsidian.d.ts", OBSIDIAN_TYPES);
  for (const [name, content] of Object.entries(files)) write(name, content);
  return root;
};

const run = (root: string, ...args: string[]) => {
  const result = spawnSync(process.execPath, [checker, ...args], { cwd: root, encoding: "utf8" });
  return { status: result.status, out: result.stdout, err: result.stderr };
};

const CALLS_UPDATE = `
import { PluginSettingTab } from 'obsidian'
export class Tab extends PluginSettingTab {
  refresh(): void {
    this.update()
  }
}
`;

const SETS_NEW_KEY = `
import type { SettingDefinition } from 'obsidian'
export const definition: SettingDefinition = {
  name: 'old key',
  render: () => {},
}
`;

const USES_OLD_ONLY = `
import { PluginSettingTab } from 'obsidian'
import type { SettingDefinition } from 'obsidian'
export class Tab extends PluginSettingTab {
  show(): void {
    this.display()
  }
}
export const definition: SettingDefinition = { name: 'old key' }
`;

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe("check-since", () => {
  it("reports a call to API newer than minAppVersion and exits 1", () => {
    const root = makeProject({ files: { "src/tab.ts": CALLS_UPDATE } });
    const { status, out } = run(root);
    expect(status).toBe(1);
    expect(out).toContain("src/tab.ts:5 PluginSettingTab.update @since 1.13.0");
  });

  it("reports a newer property key in an object literal typed by an Obsidian type", () => {
    const root = makeProject({ files: { "src/definition.ts": SETS_NEW_KEY } });
    const { status, out } = run(root);
    expect(status).toBe(1);
    expect(out).toContain("src/definition.ts:5 SettingDefinition.render @since 1.13.0");
    expect(out).not.toContain("SettingDefinition.name");
  });

  it("exits 0 when the plugin uses only API that minAppVersion covers", () => {
    const root = makeProject({ files: { "src/tab.ts": USES_OLD_ONLY } });
    const { status, out } = run(root);
    expect(status).toBe(0);
    expect(out).toBe("");
  });

  it("exits 0 when minAppVersion covers the newer API", () => {
    const root = makeProject({ minAppVersion: "1.13.0", files: { "src/tab.ts": CALLS_UPDATE } });
    expect(run(root).status).toBe(0);
  });

  it("lets a version argument override minAppVersion", () => {
    const root = makeProject({ minAppVersion: "1.13.0", files: { "src/tab.ts": CALLS_UPDATE } });
    const { status, out } = run(root, "1.12.0");
    expect(status).toBe(1);
    expect(out).toContain("PluginSettingTab.update");
  });

  it("ignores test files, which never reach users", () => {
    const root = makeProject({
      files: {
        "src/tab.ts": USES_OLD_ONLY,
        "src/tab.test.ts": CALLS_UPDATE,
        "src/tests/helper.ts": CALLS_UPDATE,
        "src/test/helper.ts": SETS_NEW_KEY,
      },
    });
    expect(run(root).status).toBe(0);
  });

  it("exits 2 without a manifest", () => {
    const root = makeProject({ minAppVersion: "", files: { "src/tab.ts": USES_OLD_ONLY } });
    expect(run(root).status).toBe(2);
  });

  it("exits 2 when the Obsidian types are not part of the program", () => {
    const root = makeProject({ files: { "src/plain.ts": "export const x = 1\n" } });
    expect(run(root).status).toBe(2);
  });
});
