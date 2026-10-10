// The community directory flags a call to an Obsidian API whose `@since` in obsidian.d.ts is
// newer than minAppVersion in manifest.json, and it ignores eslint-disable directives.
// eslint-plugin-obsidianmd does not see every such call, so this check resolves each name in
// the shipped sources to its symbol through the TypeScript compiler and reads the tag itself
//
//   node check-since.mjs [MIN_VERSION]
//
// Run it from the plugin root. MIN_VERSION replaces minAppVersion, to see what a lower
// minimum would cost. Exit 1 when a newer API is used, 2 when the check cannot run
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const OBSIDIAN_TYPES = "obsidian/obsidian.d.ts";
// Tests never reach users, so what they call does not bind minAppVersion
const isTestFile = (file) => /\.test\.[cm]?[jt]sx?$/.test(file) || /(^|\/)tests?\//.test(file);

const fail = (message) => {
  console.error(`check-since: ${message}`);
  process.exit(2);
};

const parseVersion = (text) => {
  const match = /^(\d+)\.(\d+)(?:\.(\d+))?$/.exec(text.trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)] : null;
};

const compare = (a, b) => {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};

const readMinVersion = () => {
  let text = process.argv[2];
  if (process.argv.length > 3) fail("usage: node check-since.mjs [MIN_VERSION]");
  if (text === undefined) {
    try {
      text = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8")).minAppVersion;
    } catch (error) {
      fail(`cannot read minAppVersion from manifest.json: ${error.message}`);
    }
  }
  const version = typeof text === "string" ? parseVersion(text) : null;
  if (!version) fail(`not a version: ${text}`);
  return { text, version };
};

const loadProgram = () => {
  const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  if (!configPath) fail("no tsconfig.json found");
  const config = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        fail(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    },
  );
  const program = ts.createProgram(config.fileNames, config.options);
  if (!program.getSourceFiles().some((file) => file.fileName.endsWith(OBSIDIAN_TYPES))) {
    fail(`${OBSIDIAN_TYPES} is not part of the program, so nothing could be checked`);
  }
  return program;
};

const min = readMinVersion();
const program = loadProgram();
const checker = program.getTypeChecker();

// The @since of a symbol declared in obsidian.d.ts, or null. A symbol with several
// declarations, such as overloads, counts as new only when every one of them is tagged,
// since a call may resolve to the untagged one
const sinceOf = (symbol) => {
  if (!symbol) return null;
  if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
  const declarations = (symbol.declarations ?? []).filter((declaration) =>
    declaration.getSourceFile().fileName.endsWith(OBSIDIAN_TYPES),
  );
  if (declarations.length === 0) return null;
  let oldest = null;
  for (const declaration of declarations) {
    const tag = ts
      .getJSDocTags(declaration)
      .find((candidate) => candidate.tagName.text === "since");
    const version = tag ? parseVersion(ts.getTextOfJSDocComment(tag.comment) ?? "") : null;
    if (!version) return null;
    if (!oldest || compare(version, oldest.version) < 0)
      oldest = { version, text: version.join(".") };
  }
  const owner = declarations[0].parent?.name?.text;
  return {
    member: symbol.getName(),
    name: owner ? `${owner}.${symbol.getName()}` : symbol.getName(),
    ...oldest,
  };
};

const memberName = (name) =>
  ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)
    ? name.text
    : null;

// The property a declaration in the plugin's own source stands for in an Obsidian type: a key
// of an object literal that an Obsidian type describes, such as a declarative settings entry,
// or a member that overrides a member of an Obsidian class. The checker resolves the name to
// the plugin's own declaration, so the Obsidian side has to be looked up by type
const inheritedSymbols = (node) => {
  const member = node.parent;
  const name = memberName(node);
  if (name === null || member.name !== node) return [];
  const owner = member.parent;
  if (ts.isObjectLiteralExpression(owner)) {
    const contextual = checker.getContextualType(owner);
    const types = contextual?.isUnion() ? contextual.types : contextual ? [contextual] : [];
    return types.map((type) => checker.getPropertyOfType(type, name));
  }
  if (ts.isClassLike(owner)) {
    const type = checker.getTypeAtLocation(owner);
    return checker.getBaseTypes(type).map((base) => checker.getPropertyOfType(base, name));
  }
  return [];
};

// A key of an object literal typed by a union matches the same member in each variant of
// it, so a finding is one line per place, member and @since, naming the first owner found
const hits = new Map();
let seen = 0;

const report = (file, node, info) => {
  seen++;
  if (compare(info.version, min.version) <= 0) return;
  const { line } = file.getLineAndCharacterOfPosition(node.getStart());
  const place = `${path.relative(root, file.fileName)}:${line + 1}`;
  const key = `${place} ${info.member} ${info.text}`;
  if (!hits.has(key)) hits.set(key, `${place} ${info.name} @since ${info.text}`);
};

for (const file of program.getSourceFiles()) {
  const relative = path.relative(root, file.fileName).split(path.sep).join("/");
  if (file.isDeclarationFile || relative.startsWith("..") || /(^|\/)node_modules\//.test(relative))
    continue;
  if (isTestFile(relative)) continue;
  const visit = (node) => {
    if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node) || ts.isStringLiteral(node)) {
      const symbols = [checker.getSymbolAtLocation(node), ...inheritedSymbols(node)];
      for (const symbol of symbols) {
        const info = sinceOf(symbol);
        if (info) report(file, node, info);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
}

for (const hit of hits.values()) console.log(hit);
console.error(
  `check-since: ${seen} uses of Obsidian API with @since, ${hits.size} newer than ${min.text}`,
);
process.exit(hits.size > 0 ? 1 : 0);
