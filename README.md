# Corduroy

> Search a place, get its coordinates — straight into your note's frontmatter.

**Corduroy** is an [Obsidian](https://obsidian.md) plugin for people who keep
place-based notes: cities, restaurants, trips, points of interest. Map plugins
like [Obsidian Leaflet](https://github.com/javalent/obsidian-leaflet) and
[Map View](https://github.com/esm7/obsidian-map-view) can render those notes on
a map — but only if each note carries coordinates in its frontmatter. Getting
those coordinates normally means leaving Obsidian, hunting around Google Maps,
and copy-pasting a latitude/longitude pair by hand.

Corduroy removes that detour. Run one command, type the name of a place, pick it
from a live search list, and the plugin writes the coordinates (and, optionally,
the formatted address) into the current note's frontmatter.

## How it works

1. Open the note you want to tag with a location.
2. Run **"Search for a place and insert coordinates"** from the command palette
   (`Cmd/Ctrl-P`).
3. Start typing — results stream in live from Google Maps as you type.
4. Pick a place. Corduroy looks up its coordinates and writes them to the note's
   frontmatter, leaving every other property untouched.

The result looks like this:

```yaml
---
categories:
  - "[[Places]]"
type:
  - "[[Cities]]"
created: 2026-05-31
coordinates:
  - "36.1251645"
  - "-115.339808"
address: "Las Vegas, NV, USA"
---
```

That `coordinates` list is exactly the shape map plugins expect, so the note
shows up on your map immediately.

## Setup

Corduroy uses the **Google Places API (New)**, which requires an API key.

1. In the [Google Cloud Console](https://console.cloud.google.com/), create (or
   pick) a project and enable the **Places API (New)**.
2. Create an API key under **APIs & Services → Credentials**.
3. In Obsidian, go to **Settings → Corduroy** and paste the key into the
   **Google Maps API key** field.

Your key is stored in [Obsidian's native secret storage](https://docs.obsidian.md/plugins/guides/secret-storage),
not in the plugin's settings file — so it never lands in plaintext in your vault
or in any synced `data.json`.

> **Billing note:** Google's Places API is a paid service with a monthly free
> tier. Corduroy minimizes cost by debouncing requests as you type and by using
> [session tokens](https://developers.google.com/maps/documentation/places/web-service/session-tokens),
> so an autocomplete search plus the final coordinate lookup are billed as a
> single session. Review Google's pricing before heavy use.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| Google Maps API key | _(none)_ | Your Places API (New) key, held in secret storage. |
| Coordinates property | `coordinates` | Frontmatter key that receives the `[latitude, longitude]` list. |
| Write address | `on` | Whether to also write the place's formatted address. |
| Address property | `address` | Frontmatter key that receives the formatted address. |

Coordinates are written as a list of two **quoted strings** (`["lat", "lng"]`),
which matches the convention used by Obsidian Leaflet and Map View.

## Installing into a vault

Corduroy isn't in the community plugin directory yet, so install it manually.

Obsidian loads a plugin from `<vault>/.obsidian/plugins/corduroy/`. Build the
plugin (see below), then copy `manifest.json`, `main.js`, and `styles.css` into
that folder and enable **Corduroy** under **Settings → Community plugins**.

For active development, symlink the repo in place instead of copying:

```bash
mkdir -p "<vault>/.obsidian/plugins"
ln -s "$(pwd)" "<vault>/.obsidian/plugins/corduroy"
```

Then run `bun run dev` to rebuild `main.js` on every change. Reload the plugin
in Obsidian to pick up changes (toggle it off/on, or use the community
[Hot Reload](https://github.com/pjeby/hot-reload) plugin).

## Development

Built with [Bun](https://bun.com).

```bash
bun install        # install dependencies
bun run build      # build main.js once (production)
bun run dev        # watch + rebuild on change
bun run typecheck  # type-check without emitting
```

### Project layout

| File | Responsibility |
| --- | --- |
| `main.ts` | Plugin entry point: command registration and frontmatter writing. |
| `search-modal.ts` | The search-as-you-type modal (debounced, async). |
| `places.ts` | Google Places API (New) client — autocomplete + place details. |
| `settings.ts` | Settings tab, including the secret-storage API-key field. |
| `build.ts` | Bun-based bundler that emits the CommonJS `main.js`. |

`main.js` and `data.json` are intentionally gitignored — the former is a build
artifact, the latter is per-vault runtime settings.

## License

No license has been chosen yet. Until one is added, default copyright applies.
