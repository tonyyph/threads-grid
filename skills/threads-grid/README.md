# threads-grid — AI skill

An agent skill that scaffolds a **real visual editor** for connected multi-post social grids (Threads, Instagram carousels, 3×3 profile puzzles, story sequences, Facebook/Zalo posts).

## What the agent produces

1. A Next.js + TypeScript + Tailwind editor (`template/`) with a connected canvas, drag/resize/rotate, smart snapping to seams, an inspector, brand/style presets, uploads, undo/redo and autosave.
2. `threads-grid.json`, preloaded with your brand, copy plan and a first-draft layout.
3. Export: `threads-grid-01.png …` at exact platform size, a stitched preview, a project JSON and `POSTING-ORDER.txt`, as a ZIP and in `exports/latest/`.

## Install

Claude Code (user-level):
```bash
ln -s "$(pwd)/skills/threads-grid" ~/.claude/skills/threads-grid
```
Project-level: copy or symlink into `<repo>/.claude/skills/threads-grid`. Other agents: point them at `SKILL.md`.

Requirements: Node 20+, pnpm (or npm). `pnpm export` uses Playwright's Chromium if cached, otherwise installed Chrome/Edge, or `CHROME_PATH`.

## Example prompts

```text
Create a Threads grid for Dương Gia launching Đông trùng hạ thảo Tây Tạng.
Use premium Vietnamese brand style, green and champagne colors, 6 square posts, product-centered, minimal text.
```
```text
Create a 5-post Threads carousel for my React Native app launch.
Style: clean founder thread, black and white, strong typography, technical but friendly.
```
```text
Create a 3x3 puzzle grid for a wellness brand campaign.
Use soft cream background, editorial typography, product image in the center, connected decorative lines.
```
```text
Create a bold viral carousel about "5 mistakes React Native developers make".
Use 6 portrait posts, large headlines, high contrast, modern tech style.
```

## Manual use (without an agent)

```bash
skills/threads-grid/scripts/scaffold.sh ./my-grid
cd my-grid
pnpm draft connected-headline --style bold-viral-carousel
pnpm dev     # http://localhost:3210
```

## Layout

```
SKILL.md              agent instructions (workflow, rules, element model)
copy-ideas.md         copy structures, hooks, CTAs, Vietnamese guidance
style-prompts/*.md    7 art-direction presets
scripts/scaffold.sh   copy template → new project + install
template/             the editor (see template/README.md)
```
