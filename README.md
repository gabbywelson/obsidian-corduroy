# Corduroy

An [Obsidian](https://obsidian.md) plugin.

## Development

Install dependencies:

```bash
bun install
```

Build `main.js` once:

```bash
bun run build
```

Watch and rebuild on change:

```bash
bun run dev
```

Type-check without emitting:

```bash
bun run typecheck
```

## Installing into a vault

Obsidian loads a plugin from `<vault>/.obsidian/plugins/corduroy/`. Copy (or
symlink) `manifest.json`, `main.js`, and `styles.css` there, then enable
**Corduroy** under Settings → Community plugins.
