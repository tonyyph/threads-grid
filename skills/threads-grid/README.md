# threads-grid skill

An agent skill for designing **connected** multi-post grids for Threads, Instagram and Facebook. You design one canvas, and each post is exported at exact platform size. Elements can cross from one post into the next.

The full documentation, with screenshots, is in the [repository README](../../README.md).

## Install

```bash
npx skills add tonyyph/threads-grid          # all detected agents, this project
npx skills add tonyyph/threads-grid -g       # all projects on this machine
```

Works with Claude Code, Codex, Cursor, OpenCode, Gemini CLI, GitHub Copilot and every other agent supported by the [`skills`](https://github.com/vercel-labs/skills) CLI. Other agents can load [`SKILL.md`](SKILL.md) directly.

## Use

Ask in plain language:

```text
Create a Threads grid for Dương Gia launching Đông trùng hạ thảo Tây Tạng.
Premium Vietnamese brand style, green and champagne, 6 square posts.
```

Or run it manually:

```bash
node scripts/scaffold.mjs ./my-grid && cd my-grid
pnpm draft product-hero-split --style luxury-product-launch
pnpm dev        # editor at http://localhost:3210
pnpm export     # PNGs in exports/latest/
```

## Contents

| Path | Purpose |
|---|---|
| [`SKILL.md`](SKILL.md) | Agent workflow, connected-design rules, quality checklist |
| [`copy-ideas.md`](copy-ideas.md) | Post-by-post copy structures, hooks, CTAs, Vietnamese guidance |
| [`style-prompts/`](style-prompts) | Seven art-direction briefs |
| [`scripts/scaffold.mjs`](scripts/scaffold.mjs) | Creates a new editor project from the template (cross-platform) |
| [`template/`](template) | The Next.js editor ([reference](template/README.md)) |

**Requirements:** Node.js 20+ and pnpm (npm also works). `pnpm export` additionally needs a Chromium.
