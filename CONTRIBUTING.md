# Contributing

Issues and pull requests are welcome. This is a small project, so nothing here is heavy — read the sections below and open the thing

## AI assistance

Parts of this repository are written with AI assistance, and that is disclosed per commit. A commit whose diff is substantially machine-written carries a trailer naming the tool and the model:

```
Generated-by: Claude Code:claude-opus-5
Assisted-by: Claude Code:claude-opus-5 (mostly)
```

`Generated-by:` means the task was carried out without a hand in it — set, reviewed, accepted as it came. `Assisted-by:` means it was steered: `(mostly)` when most of the final diff came from the tool, `(partly)` when a substantial part did. Commits without a trailer are hand-written, dictated line by line, or mechanical — a formatter run, or a rename swept with grep

The same is expected of contributions. Name the tool and the model you used, in a trailer or in the pull request description. Do not use `Co-authored-by:` for a tool: it is reserved for human co-authors, and [nixpkgs](https://github.com/NixOS/nixpkgs/blob/master/CONTRIBUTING.md), [Mesa](https://gitlab.freedesktop.org/mesa/mesa/-/blob/main/docs/submittingpatches.rst) and the [kernel](https://docs.kernel.org/process/coding-assistants.html) all reject it as disclosure. Never sign off on a tool's behalf — only a human can certify a Developer Certificate of Origin

Whoever opens the pull request answers for it. Review what the tool wrote, understand it, and be ready to discuss it without forwarding the questions back to the tool. Undisclosed generated code is the one thing that gets a pull request closed unread

Where the split is genuinely unclear, a bare `Assisted-by:` with no suffix is the right answer — it stays true of anything worth arguing about. The convention and the upstream policies behind it are collected in [rokokol/ai-commit-trailers-skill](https://github.com/rokokol/ai-commit-trailers-skill)

## Before a pull request

```sh
npm run test
npm run build
```

One commit per logical change. `manifest.json` and `versions.json` are written by `npm version`, not edited by hand

Commit messages: a short imperative subject saying what changes, and a body for why, if the why is not obvious

## Releasing

```sh
npm version minor   # or patch, or major
git push origin main --follow-tags
```

`package.json` holds the version. `npm version` writes it there and into `package-lock.json`, `version-bump.mjs` copies it into `manifest.json` and `versions.json`, and npm commits the four as `Release X.Y.Z` with an annotated tag `X.Y.Z` on that commit. The tag has no `v` in front, because Obsidian installs the release whose tag equals the version in `manifest.json`

Pushing the tag runs `.github/workflows/release.yml`: it refuses a tag that disagrees with the tagged commit's `manifest.json` or `package.json`, runs the checks, builds, and publishes `main.js`, `manifest.json` and `styles.css` as the release. A pushed tag is never moved — a wrong release is followed by the next patch. Before pushing a tag, go through [TESTING.md](TESTING.md)

By contributing you agree that your work is released under this repository's licence
