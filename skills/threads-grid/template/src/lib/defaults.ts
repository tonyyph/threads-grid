import { LAYOUT_MODES, PLATFORM_PRESETS, STYLE_PRESETS } from "./constants";
import { postRects, uid } from "./geometry";
import { ElementSchema, ProjectSchema, type ElementType, type GridElement, type LayoutMode, type PlatformPreset, type Project } from "./types";

export function defaultProject(): Project {
  const p = ProjectSchema.parse({
    name: "New Threads grid",
    style: "clean-founder-thread",
    preset: "square",
    layout: { mode: "carousel", rows: 1, cols: 6 },
    copyPlan: { structure: "carousel" },
  });
  return applyStyle(p, "clean-founder-thread");
}

export function applyStyle(p: Project, styleId: string): Project {
  const s = STYLE_PRESETS.find((x) => x.id === styleId);
  if (!s) return p;
  return {
    ...p,
    style: s.id,
    brand: { ...p.brand, colors: { ...s.colors }, fonts: { ...s.fonts } },
    background: { ...p.background, ...s.background },
  };
}

export function applyPreset(p: Project, preset: PlatformPreset, custom?: { width: number; height: number }): Project {
  const size = preset === "custom" ? custom ?? p.post : PLATFORM_PRESETS[preset];
  return { ...p, preset, post: { width: Math.round(size.width), height: Math.round(size.height) } };
}

export function applyLayout(p: Project, mode: LayoutMode, count?: { rows?: number; cols?: number }): Project {
  const def = LAYOUT_MODES[mode];
  const total = p.layout.rows * p.layout.cols;
  let rows = def.rows ?? count?.rows ?? p.layout.rows;
  let cols = def.cols ?? count?.cols ?? p.layout.cols;
  if (mode === "carousel" && def.cols === null && count?.cols === undefined) cols = Math.min(10, Math.max(3, total));
  if (mode === "vertical" && def.rows === null && count?.rows === undefined) rows = Math.min(10, Math.max(2, total));
  return { ...p, layout: { mode, rows: clampInt(rows, 1, 10), cols: clampInt(cols, 1, 10) } };
}

const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(n)));

/** New element of `type`, centered in post `postIndex`, sized relative to the post. */
export function createElement(type: ElementType, p: Project, postIndex = 0, extra: Record<string, unknown> = {}): GridElement {
  const r = postRects(p)[postIndex] ?? postRects(p)[0];
  const u = Math.min(r.w, r.h);
  const box = (w: number, h: number) => ({ x: Math.round(r.x + (r.w - w) / 2), y: Math.round(r.y + (r.h - h) / 2), w, h });
  const seeds: Record<ElementType, Record<string, unknown>> = {
    text: { ...box(u * 0.8, u * 0.22), text: "Your headline", fontSize: Math.round(u * 0.085) },
    image: { ...box(u * 0.6, u * 0.6), src: "", role: "image" },
    shape: { ...box(u * 0.5, u * 0.5), shape: "rect", fill: "accent" },
    gradient: { ...box(u * 0.7, u * 0.7), kind: "radial", from: "accent", to: "transparent", opacity: 0.6 },
    line: { ...box(u * 0.7, Math.max(8, u * 0.01)), thickness: Math.max(3, Math.round(u * 0.004)) },
    badge: { ...box(u * 0.12, u * 0.12), text: String(postIndex + 1).padStart(2, "0"), fontSize: Math.round(u * 0.04) },
    quote: { ...box(u * 0.8, u * 0.55), fontSize: Math.round(u * 0.05), radius: Math.round(u * 0.03) },
    cta: { ...box(u * 0.55, u * 0.1), radius: Math.round(u * 0.05), fontSize: Math.round(u * 0.035) },
  };
  return ElementSchema.parse({ id: uid(type), type, ...seeds[type], ...extra });
}
