---
name: threads-grid
description: Scaffold a real visual editor (Next.js) for connected multi-post social grids — Threads / Instagram carousels, 2×2 / 3×3 puzzle grids, story sequences — where headlines, products, backgrounds and decorative lines flow across adjacent posts and are cropped per post on export. Use when the user wants a Threads grid, connected carousel, puzzle grid, product launch carousel, educational carousel, or "posts that connect", in English or Vietnamese.
metadata:
  version: "1.0.0"
---

# threads-grid

You build **one large canvas divided into post frames**, not N separate images. Elements may span seams; export crops the canvas into exact platform-sized PNGs. The deliverable is a working editor the user keeps using, preloaded with a strong first draft — never a one-off static HTML file.

Skill files — paths are relative to **the directory containing this SKILL.md** (`<skill-dir>`). It differs per agent and install scope, e.g. `~/.claude/skills/threads-grid`, `.claude/skills/threads-grid`, `.agents/skills/threads-grid`; resolve it before running anything.

| Path | Use |
|---|---|
| `scripts/scaffold.mjs <dir>` | Copy the editor template and install deps (cross-platform Node script) |
| `template/` | The Next.js editor (do not edit in place; scaffold a copy) |
| `style-prompts/*.md` | Art direction per style. **Read the chosen one before drafting.** |
| `copy-ideas.md` | Post-by-post copy structures, hook formulas, Vietnamese copy rules |
| `template/README.md` | Editor usage + full `threads-grid.json` reference |

## Workflow

### 1. Gather the brief (ask only what is missing)

Needed: **brand/product**, **campaign message**, **number of posts**, **format** (square / portrait / story / landscape / custom), **assets** (logo, product images), **visual style**, **copy or rough idea**, **language**.

- If the user's prompt already covers these (e.g. "6 square posts, premium Vietnamese style, green and champagne, product-centered"), **do not ask — build immediately** and state the assumptions you made.
- Otherwise ask one compact message with only the missing items, offering defaults: "6 square posts, carousel, style X, I'll draft the copy". Use AskUserQuestion if available.
- Map vague style words to a preset (see table below). Brand colors given by the user override preset colors.

| User says… | Style preset |
|---|---|
| premium product, skincare, tea, supplements, yến sào, đông trùng | `luxury-product-launch` (or `vietnamese-brand-campaign` for VN social commerce) |
| founder, SaaS, build in public, dev, personal brand | `clean-founder-thread` |
| viral, hook, mistakes, bold, high contrast | `bold-viral-carousel` |
| wellness, health, beauty, calm, cream | `premium-wellness-brand` |
| fintech, crypto, banking, dashboard, dark | `fintech-dark-grid` |
| essay, story, editorial, magazine, campaign | `editorial-magazine` |
| Vietnamese local brand, Tết, quà biếu, approachable | `vietnamese-brand-campaign` |

| Goal | Layout template | Grid |
|---|---|---|
| Hook that pulls the swipe | `connected-headline` | carousel 5–8 |
| Product launch / hero | `product-hero-split` | carousel 4–6 |
| Steps, process, history | `timeline` | carousel 4–8 |
| Quotes, testimonials, lessons | `quote-thread` | carousel 3–6 |
| Teach something | `educational` | carousel 6–8, portrait recommended |
| Profile-grid campaign | `puzzle-grid` | `grid-3x3` (or 2×2) |

### 2. Scaffold

```bash
node <skill-dir>/scripts/scaffold.mjs ./<project-slug>-grid
```
Default target: a new folder in the user's current working directory. Never scaffold into a non-empty directory. Requires Node 20+ and pnpm (falls back to npm).

### 3. Write the brief into `threads-grid.json`

Create `<project>/threads-grid.json` with brand, style, preset, layout, assets and **copyPlan** (one entry per post). Everything not given gets a schema default — keep it short:

```json
{
  "name": "Dương Gia — Đông trùng hạ thảo Tây Tạng",
  "style": "luxury-product-launch",
  "preset": "square",
  "layout": { "mode": "carousel", "rows": 1, "cols": 6 },
  "brand": {
    "name": "Dương Gia",
    "logo": "/uploads/logo.png",
    "colors": { "primary": "#1f4d3a", "accent": "#d8c08a", "background": "#14261e", "text": "#f3ecdf" },
    "fonts": { "heading": "cormorant", "body": "be-vietnam" }
  },
  "assets": [{ "id": "hero", "path": "/uploads/product.png", "name": "Hộp đông trùng", "role": "product" }],
  "copyPlan": {
    "structure": "product-launch",
    "language": "vi",
    "caption": "…",
    "posts": [
      { "role": "promise", "headline": "Tinh hoa từ cao nguyên Tây Tạng" },
      { "role": "problem", "headline": "…", "body": "…" }
    ]
  }
}
```

- User-provided images: copy them into `<project>/public/uploads/` (keep or hash the name) and reference them as `/uploads/<file>`. Product images should be transparent PNG cut-outs whenever possible — say so if they aren't.
- Write copy using `copy-ideas.md`. Headlines ≤ 8 words (EN) / ≤ 10 words (VI). One idea per post.
- Number of copyPlan posts must equal rows × cols.

### 4. Generate the first draft

```bash
cd <project>
pnpm draft <layout-template> --style <style-id>   # --style overwrites brand colors/fonts with the preset
pnpm draft --list                                  # list templates
pnpm validate                                      # schema + readability warnings
```
If the user gave brand colors, run `pnpm draft <template>` **without** `--style` (style is already set in the JSON), or re-apply their colors afterwards.

Then **refine `elements` by editing the JSON directly** — the template is a starting point, not the result. Apply the chosen style prompt: adjust sizes, add one signature connected element (a seam-crossing product, a line through all posts, a headline crossing 1→2), remove anything that doesn't support the message. Run `pnpm validate` after edits.

### 5. Run and verify

```bash
pnpm dev            # http://localhost:3210 (run in background)
pnpm export         # headless render → ./exports/latest/*.png (needs the dev server)
```
**Look at `exports/latest/threads-grid-preview.png` and 2–3 individual posts** (read the images) before presenting. Check against the quality checklist below; fix and re-export. Then give the user the URL and the export folder.

### 6. Export on request

`pnpm export` (or the **Export ZIP** button) writes `threads-grid-01.png …`, `threads-grid-preview.png`, `threads-grid-project.json`, `POSTING-ORDER.txt` to `exports/<timestamp>/` and `exports/latest/`.

- For 3×3/2×2 profile grids set `"export": { "order": "posting" }` so 01 is the first post to publish (profile grids show newest top-left).
- Default is PNG at exact platform size. For smaller files use `"format": "jpeg", "quality": 0.92`; for print-quality masters `"scale": 2` (platforms downscale on upload).

## Tell the user what they can do in the editor

Double-click text to edit in place · Shift/⌘-click or drag a marquee to multi-select, then align/distribute in the inspector · drag ⋮⋮ in the Posts tab to reorder posts (content inside a post moves with it) · drop images on any post · upload a brand font in the Brand tab · "Feed split" to preview how posts look separated · Export ZIP.

## Element model (canvas coordinates)

Canvas = `cols × post.width` by `rows × post.height`. Post *i* (row-major) starts at `x = col × post.width, y = row × post.height`. Every element has `id, type, x, y, w, h` plus optional `rotation, opacity, radius, blur, blendMode, shadow{enabled,x,y,blur,color}, locked, hidden, name`. Later elements render on top.

| type | key fields |
|---|---|
| `text` | `text, fontFamily ("heading"/"body"/font id), fontSize, fontWeight, color, align, verticalAlign, lineHeight, letterSpacing (em), uppercase, italic, background, padding` |
| `image` | `src, role (image/logo/product/screenshot/texture), fit (cover/contain/fill), zoom (crop zoom 1–5), focusX/focusY (crop focus %), mask (none/circle/arch/rounded/pill), frame (none/phone/browser)` |
| `shape` | `shape (rect/ellipse/pill/arch/ring), fill, stroke, strokeWidth` |
| `gradient` | `kind (linear/radial), from, to, angle` |
| `line` | `variant (straight/arc/wave), color, thickness, dash` |
| `badge` | `text, shape (circle/pill/square), fill` + typography |
| `quote` | `text, author, fill, accent, padding` + typography |
| `cta` | `text, fill, arrow` + typography |

Colors accept brand tokens (`primary, secondary, accent, background, surface, text, muted`) or any CSS color — **prefer tokens** so restyling works. Fonts: `inter, be-vietnam, montserrat, space-grotesk, playfair, cormorant, lora, jetbrains` (all include Vietnamese), or a brand font the user uploads in the editor (Brand tab → stored in `brand.customFonts`; the editor flags fonts without Vietnamese glyphs — don't use those for VI copy). Full reference: `template/README.md`.

## Connected-design rules

1. **Each post must work alone.** Someone sees post 3 without posts 2 or 4. Every post needs one readable idea inside its safe area (default 7% inset). Seam-crossing elements are *bonus*, never the only content.
2. **Cross seams with things that crop well**: backgrounds, glows, lines, shapes, product images, very large type (≥ 18% of post width). Don't cut body text or small headlines across seams. Never place a face or a product label exactly on a seam.
3. **One signature move per grid**: a headline crossing 1→2, a product on seam 1|2, a line running through all posts, or one big composition (puzzle). Not all at once.
4. **Rhythm**: the same pager position, margins and type scale on every post. Alternate the emphasis (glow top/bottom, image left/right) to create motion.
5. **Readable on a phone**: body ≥ 3.2% of post width (≈34px at 1080), headlines ≥ 6.5%, never more than ~40 words per post. Contrast ≥ 4.5:1 for body text.
6. **Restraint**: 2 typefaces max, 1 accent color, ≤ 2 decorative motifs. No random gradients, no clip-art, no emoji as decoration.
7. **Last post = CTA** (save / follow / shop / comment), first post = hook. Read `copy-ideas.md`.
8. **Vietnamese**: use `be-vietnam` or `lora`/`playfair`/`cormorant`, line-height ≥ 1.15 for headlines (diacritics stack above and below), avoid all-caps for long VI headlines, and keep "đ/ư/ơ" legible (no ultra-light weights under 48px).

## Quality checklist (before presenting)

- [ ] Preview looks like one designed system; each single post still makes sense
- [ ] No text clipped at a seam or outside its box; no text over busy image areas without contrast
- [ ] Hook in post 1 readable in under 2 seconds; CTA in the last post
- [ ] Brand colors/logo used; product shown large enough (≥ 55% of post height when it's the hero)
- [ ] `pnpm validate` has no warnings you can't justify
- [ ] Export folder delivered with correct count and size

## Report to the user

Summarize: project path, URL (`http://localhost:3210`), style + template used, assumptions you made, export path, and 2–3 suggestions (e.g. "a transparent product PNG would let the bottle cross the seam cleanly").
