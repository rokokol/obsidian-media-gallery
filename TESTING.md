# Manual testing

Use this checklist before pushing a release or asking the Obsidian review bot to rescan.

## Local checks

```bash
npm ci
npm run check:types
npm run lint
```

## Runtime checks in Obsidian

Open a vault with representative media and verify:

- Folder-based galleries render in both `horizontal` and `vertical` layouts.
- `sortby: rand` changes order when no `seed` is set.
- Equal `seed` values produce equal ordering.
- Different `seed` values produce different ordering.
- `limit` caps the final rendered list.
- `path + ![[...]]` mixed galleries include both folder results and explicit items.
- `extensions` and `exclude` filter correctly.
- `*`, `**`, `folder/*`, `folder/**`, and filename wildcards match the intended files.
- Empty blocks render nothing.
- Invalid paths render an error instead of hanging.
- Images open in the lightbox and the toolbar button opens the source file.
- Audio cards, video cards, and mixed galleries still behave as expected in the shipped build.
