# threads-grid editor

A local Next.js editor for **connected** multi-post social grids. You design one canvas split into post frames; export crops it into exact platform-sized PNGs.

```bash
pnpm install
pnpm dev                 # http://localhost:3210
```

| Command | What it does |
|---|---|
| `pnpm dev` | Editor on port 3210. Loads/creates `threads-grid.json`, autosaves every change. |
| `pnpm draft <template> [--style <id>]` | Regenerates `elements` from the brief in `threads-grid.json`. `--list` shows templates. |
| `pnpm validate [--write]` | Schema check + readability/missing-image warnings. `--write` normalizes the file. |
| `pnpm export` | Headless export via Playwright (needs `pnpm dev` running) → `exports/latest/`. |
| `pnpm build && pnpm start` | Production server, same port. |

## Editor

- **Left — Design:** project name, platform preset (1080², 1080×1350, 1080×1920, 1200×628, custom), grid layout (carousel 3–10, 2×2, 3×3, vertical, custom rows×cols), style presets, layout templates, add element, guides & snapping.
- **Left — Brand:** brand name, logo upload, 7 color tokens, heading/body fonts, asset library (upload with a role, click to place).
- **Left — Posts:** copy plan per post (role, headline, body) and caption; click "preview" to focus one post.
- **Center:** connected canvas with post boundaries (blue), safe area (pink), drag/resize/rotate, smart snapping to seams/centers/safe area (red guide lines), ⌘+scroll zoom, drop images straight onto a post. "Feed split" shows posts with gaps the way the feed/profile shows them.
- **Right:** inspector for the selected element (position, size, rotation, opacity, layer order, font family/size/weight, colors, radius, shadow, blur, blend mode, image fit/crop focus/mask/frame). With nothing selected: connected background + layers list.

Shortcuts: ⌘Z / ⇧⌘Z undo/redo · ⌘D duplicate · ⌫ delete · arrows nudge (⇧ = 10px) · Esc deselect · ⌘S save now.

## Files

```
threads-grid.json         project state (the source of truth, safe to edit by hand)
public/uploads/<hash>.ext uploaded assets (content-addressed)
exports/<timestamp>/      export bundles; exports/latest/ = most recent
  threads-grid-01.png …   one per post, exact platform size
  threads-grid-preview.png  stitched overview
  threads-grid-project.json snapshot of the project
  POSTING-ORDER.txt         order + caption + copy plan
```

## threads-grid.json reference

Validated by `src/lib/types.ts` (zod). Every field has a default; minimal valid file: `{}`.

```jsonc
{
  "version": 1,
  "name": "Campaign name",
  "style": "clean-founder-thread",           // style preset id (see src/lib/constants.ts)
  "preset": "square",                        // square | portrait | story | landscape | custom
  "post": { "width": 1080, "height": 1080 }, // per post, in export pixels
  "layout": { "mode": "carousel", "rows": 1, "cols": 6 }, // carousel | grid-2x2 | grid-3x3 | vertical | custom
  "brand": {
    "name": "Brand", "logo": "/uploads/logo.png",
    "colors": { "primary": "#111", "secondary": "#555", "accent": "#c8a96a", "background": "#f6f2ea", "surface": "#fff", "text": "#111", "muted": "#6b6b6b" },
    "fonts": { "heading": "playfair", "body": "inter" }
  },
  "background": { "type": "linear", "color": "background", "from": "background", "to": "surface", "angle": 120, "image": "", "imageOpacity": 1, "grain": 0.05 },
  "elements": [ /* see below; array order = z-order */ ],
  "assets": [{ "id": "hero", "path": "/uploads/product.png", "name": "Product", "role": "product" }],
  "copyPlan": { "structure": "carousel", "language": "en", "caption": "", "posts": [{ "role": "hook", "headline": "", "body": "", "notes": "" }] },
  "guides": { "safeArea": 7, "showSafeArea": true, "showBoundaries": true, "snap": true, "gridSize": 10 },
  "export": { "fileBase": "threads-grid", "includePreview": true, "includeProjectJson": true, "order": "reading", "previewMaxSize": 3000 }
}
```

**Coordinates.** Canvas is `cols × post.width` wide and `rows × post.height` tall. Post *i* (row-major from top-left) starts at `x = col × post.width`, `y = row × post.height`. An element at `x: 700, w: 760` on 1080 posts spans posts 1 and 2 and is cropped into both.

**Common element fields:** `id` (required, unique), `type`, `x`, `y`, `w`, `h`, `name`, `rotation` (deg), `opacity` (0–1), `radius`, `blur`, `blendMode`, `shadow: { enabled, x, y, blur, color }`, `locked`, `hidden`.

**Colors:** brand token (`primary`, `secondary`, `accent`, `background`, `surface`, `text`, `muted`), any CSS color, or `transparent`.
**Fonts:** `heading`, `body`, or one of `inter`, `be-vietnam`, `montserrat`, `space-grotesk`, `playfair`, `cormorant`, `lora`, `jetbrains`.

| type | fields (defaults) |
|---|---|
| `text` | `text`, `fontFamily` (heading), `fontSize` (96), `fontWeight` (700), `color` (text), `align` (left), `verticalAlign` (top), `lineHeight` (1.05), `letterSpacing` em (0), `uppercase`, `italic`, `background` (transparent), `padding` |
| `image` | `src`, `role` (image/logo/product/screenshot/texture), `fit` (cover/contain/fill), `focusX`/`focusY` (50), `mask` (none/circle/arch/rounded/pill), `frame` (none/phone/browser) |
| `shape` | `shape` (rect/ellipse/pill/arch/ring), `fill` (primary), `stroke`, `strokeWidth` |
| `gradient` | `kind` (linear/radial), `from` (primary), `to` (transparent), `angle` (135) |
| `line` | `variant` (straight/arc/wave), `color` (accent), `thickness` (4), `dash` (solid/dashed/dotted) |
| `badge` | `text` ("01"), `shape` (circle/pill/square), `fill` (accent) + typography |
| `quote` | `text`, `author`, `fill` (surface), `accent`, `padding` (72) + typography |
| `cta` | `text`, `fill` (primary), `arrow` (true) + typography (`color` defaults to background) |

## Layout templates (`pnpm draft …`)

`connected-headline`, `product-hero-split`, `timeline`, `quote-thread`, `educational`, `puzzle-grid`. They read `brand`, `copyPlan.posts`, and the first `product`/`logo` asset, and size everything relative to the post, so they work for any preset and grid.

## How export works

`ExportStage` renders the whole canvas at 1:1 off-screen (no guides). For each post, `html-to-image` captures the stage translated by `(-x, -y)` into an exact `post.width × post.height` canvas, so seam-crossing elements crop pixel-perfectly and huge canvases never hit browser canvas limits. Images are inlined as data URLs first; fonts are embedded once. The editor canvas uses the same renderer, so what you see is what exports.

## Limitations / TODO

- Inline text editing on canvas (edit in the inspector for now; double-click is not wired).
- Multi-select, grouping, alignment/distribute tools.
- Rotated elements snap by their unrotated bounding box.
- Custom font upload (add a `next/font` entry in `app/layout.tsx` + `FONT_OPTIONS`).
- Image cropping UI beyond fit + focus point; background removal for product shots.
- Drag-reorder of posts (would shift elements between frames).
- Export at 2× / JPG / WebP options.
