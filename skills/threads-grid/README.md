# threads-grid skill

An agent skill for designing **connected** multi-post grids for Threads, Instagram and Facebook. You design one canvas, and each post is exported at exact platform size. Elements can cross from one post into the next.

The full documentation, with screenshots, is in the [repository README](../../README.md).

## Install

```bash
ln -s "$(pwd)" ~/.claude/skills/threads-grid          # all projects
ln -s "$(pwd)" <project>/.claude/skills/threads-grid  # one project
```

Other agents: load [`SKILL.md`](SKILL.md).

## Use

Ask in plain language:

```text
Create a Threads grid for Dương Gia launching Đông trùng hạ thảo Tây Tạng.
Premium Vietnamese brand style, green and champagne, 6 square posts.
```

Or run it manually:

```bash
scripts/scaffold.sh ./my-grid && cd my-grid
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
| [`scripts/scaffold.sh`](scripts/scaffold.sh) | Creates a new editor project from the template |
| [`template/`](template) | The Next.js editor ([reference](template/README.md)) |

**Requirements:** Node.js 20+ and pnpm (npm also works). `pnpm export` additionally needs a Chromium.
