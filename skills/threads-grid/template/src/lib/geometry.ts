import { FONT_OPTIONS } from "./constants";
import type { Brand, PostRect, Project } from "./types";

export function canvasSize(p: Project) {
  return { width: p.post.width * p.layout.cols, height: p.post.height * p.layout.rows };
}

/** Posts in reading order (row-major, 0 = top-left). */
export function postRects(p: Project): PostRect[] {
  const out: PostRect[] = [];
  for (let row = 0; row < p.layout.rows; row++) {
    for (let col = 0; col < p.layout.cols; col++) {
      out.push({
        index: out.length,
        row,
        col,
        x: col * p.post.width,
        y: row * p.post.height,
        w: p.post.width,
        h: p.post.height,
      });
    }
  }
  return out;
}

/**
 * Post number used in exported file names.
 * Profile grids show the newest post top-left, so the "posting" order publishes
 * bottom-right first. For single-row carousels both orders are identical.
 */
export function exportNumber(p: Project, readingIndex: number): number {
  const total = p.layout.rows * p.layout.cols;
  if (p.export.order === "posting" && p.layout.rows > 1 && p.layout.cols > 1) return total - readingIndex;
  return readingIndex + 1;
}

export function postsTouchedBy(p: Project, el: { x: number; y: number; w: number; h: number }): number[] {
  return postRects(p)
    .filter((r) => el.x < r.x + r.w && el.x + el.w > r.x && el.y < r.y + r.h && el.y + el.h > r.y)
    .map((r) => r.index);
}

/** Resolve a brand token ("primary", "text"...) or pass a CSS color through. */
export function resolveColor(value: string, brand: Brand): string {
  if (value in brand.colors) return brand.colors[value as keyof Brand["colors"]];
  return value;
}

/** Resolve "heading" / "body" / a font id into a CSS font-family stack. */
export function resolveFont(value: string, brand: Brand): string {
  const id = value === "heading" ? brand.fonts.heading : value === "body" ? brand.fonts.body : value;
  const f = FONT_OPTIONS.find((o) => o.id === id);
  if (!f) return value; // allow raw CSS family names
  const fallback = f.kind === "serif" ? "Georgia, serif" : f.kind === "mono" ? "ui-monospace, monospace" : "system-ui, sans-serif";
  return `var(${f.cssVar}), ${fallback}`;
}

export function uid(prefix = "el"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
