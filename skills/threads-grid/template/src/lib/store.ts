"use client";

import { create } from "zustand";
import { createElement } from "./defaults";
import { containingPost, postRects, rotatedBounds, uid } from "./geometry";
import type { ElementType, GridElement, Project } from "./types";

type View = { kind: "grid" } | { kind: "post"; index: number };
export type AlignMode = "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom";

type State = {
  project: Project | null;
  /** Primary selection (inspector target). Always the last item of selectedIds. */
  selectedId: string | null;
  selectedIds: string[];
  /** Text element being edited inline on the canvas. */
  editingId: string | null;
  zoom: number;
  view: View;
  /** Visual gap between posts, to preview how the feed/profile splits them. */
  gapPreview: boolean;
  past: Project[];
  future: Project[];
  saveState: "idle" | "saving" | "saved" | "error";

  load: (p: Project) => void;
  /** Replace the project. `record: false` for continuous gestures (drag frames). */
  setProject: (fn: (p: Project) => Project, opts?: { record?: boolean }) => void;
  /** Push the current project onto history without changing it (call at gesture start). */
  checkpoint: () => void;
  updateElement: (id: string, patch: Partial<GridElement>, opts?: { record?: boolean }) => void;
  /** Apply per-element patches in one update. */
  updateElements: (patches: Record<string, Partial<GridElement>>, opts?: { record?: boolean }) => void;
  addElement: (type: ElementType, postIndex?: number, extra?: Record<string, unknown>) => string;
  removeElement: (id: string) => void;
  removeSelected: () => void;
  duplicateElement: (id: string) => void;
  duplicateSelected: () => void;
  nudgeSelected: (dx: number, dy: number) => void;
  reorder: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  /** `additive` toggles the id in a multi-selection (Shift/⌘-click). */
  select: (id: string | null, opts?: { additive?: boolean }) => void;
  selectMany: (ids: string[]) => void;
  setEditing: (id: string | null) => void;
  alignSelected: (mode: AlignMode, to: "selection" | "post") => void;
  distributeSelected: (axis: "x" | "y") => void;
  /** Move post `from` to position `to` (reading order); elements fully inside a post travel with it. */
  movePost: (from: number, to: number) => void;
  setZoom: (z: number) => void;
  setView: (v: View) => void;
  setGapPreview: (on: boolean) => void;
  setSaveState: (s: State["saveState"]) => void;
  undo: () => void;
  redo: () => void;
};

const HISTORY_LIMIT = 100;

const sel = (ids: string[]) => ({ selectedIds: ids, selectedId: ids.length ? ids[ids.length - 1] : null });

export const useEditor = create<State>((set, get) => ({
  project: null,
  selectedId: null,
  selectedIds: [],
  editingId: null,
  zoom: 0.25,
  view: { kind: "grid" },
  gapPreview: false,
  past: [],
  future: [],
  saveState: "idle",

  load: (p) => set({ project: p, past: [], future: [], editingId: null, ...sel([]) }),

  setProject: (fn, opts = {}) => {
    const cur = get().project;
    if (!cur) return;
    const next = fn(cur);
    if (next === cur) return;
    if (opts.record === false) set({ project: next });
    else set({ project: next, past: [...get().past, cur].slice(-HISTORY_LIMIT), future: [] });
  },

  checkpoint: () => {
    const cur = get().project;
    const past = get().past;
    if (!cur || past[past.length - 1] === cur) return; // no-op interactions don't add undo steps
    set({ past: [...past, cur].slice(-HISTORY_LIMIT), future: [] });
  },

  updateElement: (id, patch, opts) => get().updateElements({ [id]: patch }, opts),

  updateElements: (patches, opts) =>
    get().setProject((p) => ({ ...p, elements: p.elements.map((e) => (patches[e.id] ? ({ ...e, ...patches[e.id] } as GridElement) : e)) }), opts),

  addElement: (type, postIndex = 0, extra = {}) => {
    const p = get().project;
    if (!p) return "";
    const el = createElement(type, p, postIndex, extra);
    get().setProject((cur) => ({ ...cur, elements: [...cur.elements, el] }));
    set(sel([el.id]));
    return el.id;
  },

  removeElement: (id) => {
    get().setProject((p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) }));
    set(sel(get().selectedIds.filter((x) => x !== id)));
  },

  removeSelected: () => {
    const ids = new Set(get().selectedIds);
    if (!ids.size) return;
    get().setProject((p) => ({ ...p, elements: p.elements.filter((e) => !ids.has(e.id) || e.locked) }));
    set({ editingId: null, ...sel([]) });
  },

  duplicateElement: (id) => {
    set(sel([id]));
    get().duplicateSelected();
  },

  duplicateSelected: () => {
    const p = get().project;
    const ids = new Set(get().selectedIds);
    if (!p || !ids.size) return;
    const newIds: string[] = [];
    const els: GridElement[] = [];
    for (const e of p.elements) {
      els.push(e);
      if (ids.has(e.id)) {
        const copy = { ...e, id: uid(e.type), name: e.name ? `${e.name} copy` : undefined, x: e.x + 40, y: e.y + 40, locked: false } as GridElement;
        els.push(copy);
        newIds.push(copy.id);
      }
    }
    get().setProject((cur) => ({ ...cur, elements: els }));
    set(sel(newIds));
  },

  nudgeSelected: (dx, dy) => {
    const p = get().project;
    const ids = new Set(get().selectedIds);
    if (!p) return;
    const patches: Record<string, Partial<GridElement>> = {};
    for (const e of p.elements) if (ids.has(e.id) && !e.locked) patches[e.id] = { x: e.x + dx, y: e.y + dy };
    get().updateElements(patches);
  },

  reorder: (id, dir) =>
    get().setProject((p) => {
      const els = [...p.elements];
      const i = els.findIndex((e) => e.id === id);
      if (i < 0) return p;
      const [el] = els.splice(i, 1);
      const to = dir === "top" ? els.length : dir === "bottom" ? 0 : dir === "up" ? Math.min(els.length, i + 1) : Math.max(0, i - 1);
      els.splice(to, 0, el);
      return { ...p, elements: els };
    }),

  select: (id, opts = {}) => {
    if (get().editingId && get().editingId !== id) set({ editingId: null });
    if (id === null) return set(sel([]));
    const cur = get().selectedIds;
    if (opts.additive) return set(sel(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    // Clicking a member of a multi-selection keeps the group (so it can be dragged together).
    if (cur.includes(id) && cur.length > 1) return set(sel([...cur.filter((x) => x !== id), id]));
    set(sel([id]));
  },

  selectMany: (ids) => set({ editingId: null, ...sel(ids) }),
  setEditing: (editingId) => set({ editingId }),

  alignSelected: (mode, to) => {
    const p = get().project;
    if (!p) return;
    const ids = new Set(get().selectedIds);
    const items = p.elements.filter((e) => ids.has(e.id) && !e.locked);
    if (!items.length) return;
    const bounds = items.map((e) => ({ e, b: rotatedBounds(e) }));
    const rects = postRects(p);
    const groupBox = () => {
      const x1 = Math.min(...bounds.map(({ b }) => b.x));
      const y1 = Math.min(...bounds.map(({ b }) => b.y));
      const x2 = Math.max(...bounds.map(({ b }) => b.x + b.w));
      const y2 = Math.max(...bounds.map(({ b }) => b.y + b.h));
      return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    };
    const patches: Record<string, Partial<GridElement>> = {};
    for (const { e, b } of bounds) {
      let ref = groupBox();
      if (to === "post") {
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const r = rects.find((r) => cx >= r.x && cx < r.x + r.w && cy >= r.y && cy < r.y + r.h) ?? rects[0];
        const s = (Math.min(r.w, r.h) * p.guides.safeArea) / 100;
        ref = { x: r.x + s, y: r.y + s, w: r.w - 2 * s, h: r.h - 2 * s };
      }
      const offX = b.x - e.x;
      const offY = b.y - e.y;
      if (mode === "left") patches[e.id] = { x: Math.round(ref.x - offX) };
      if (mode === "right") patches[e.id] = { x: Math.round(ref.x + ref.w - b.w - offX) };
      if (mode === "hcenter") patches[e.id] = { x: Math.round(ref.x + (ref.w - b.w) / 2 - offX) };
      if (mode === "top") patches[e.id] = { y: Math.round(ref.y - offY) };
      if (mode === "bottom") patches[e.id] = { y: Math.round(ref.y + ref.h - b.h - offY) };
      if (mode === "vcenter") patches[e.id] = { y: Math.round(ref.y + (ref.h - b.h) / 2 - offY) };
    }
    get().updateElements(patches);
  },

  distributeSelected: (axis) => {
    const p = get().project;
    if (!p) return;
    const ids = new Set(get().selectedIds);
    const items = p.elements
      .filter((e) => ids.has(e.id) && !e.locked)
      .map((e) => ({ e, b: rotatedBounds(e) }))
      .sort((a, b) => (axis === "x" ? a.b.x - b.b.x : a.b.y - b.b.y));
    if (items.length < 3) return;
    const pos = (b: { x: number; y: number }) => (axis === "x" ? b.x : b.y);
    const size = (b: { w: number; h: number }) => (axis === "x" ? b.w : b.h);
    const first = items[0].b;
    const last = items[items.length - 1].b;
    const span = pos(last) + size(last) - pos(first);
    const gap = (span - items.reduce((s, i) => s + size(i.b), 0)) / (items.length - 1);
    let cursor = pos(first);
    const patches: Record<string, Partial<GridElement>> = {};
    for (const { e, b } of items) {
      const off = pos(b) - (axis === "x" ? e.x : e.y);
      patches[e.id] = axis === "x" ? { x: Math.round(cursor - off) } : { y: Math.round(cursor - off) };
      cursor += size(b) + gap;
    }
    get().updateElements(patches);
  },

  movePost: (from, to) =>
    get().setProject((p) => {
      const rects = postRects(p);
      if (from === to || !rects[from] || !rects[to]) return p;
      const order = rects.map((r) => r.index);
      const [moved] = order.splice(from, 1);
      order.splice(to, 0, moved);
      // order[newIndex] = oldIndex → element in old post k moves to the slot where k now sits.
      const newSlotOf = new Map(order.map((oldIndex, newIndex) => [oldIndex, newIndex]));
      const elements = p.elements.map((e) => {
        const k = containingPost(p, e);
        if (k < 0) return e; // spans seams: stays put, it belongs to the connected layout
        const dst = rects[newSlotOf.get(k)!];
        return { ...e, x: e.x + dst.x - rects[k].x, y: e.y + dst.y - rects[k].y } as GridElement;
      });
      const posts = p.copyPlan.posts.length ? order.map((oldIndex) => p.copyPlan.posts[oldIndex] ?? { role: "", headline: "", body: "", notes: "" }) : p.copyPlan.posts;
      return { ...p, elements, copyPlan: { ...p.copyPlan, posts } };
    }),

  setZoom: (zoom) => set({ zoom: Math.max(0.03, Math.min(2, zoom)) }),
  setView: (view) => set({ view }),
  setGapPreview: (gapPreview) => set({ gapPreview }),
  setSaveState: (saveState) => set({ saveState }),

  undo: () => {
    const { past, project, future } = get();
    if (!past.length || !project) return;
    set({ project: past[past.length - 1], past: past.slice(0, -1), future: [project, ...future], editingId: null });
  },
  redo: () => {
    const { past, project, future } = get();
    if (!future.length || !project) return;
    set({ project: future[0], past: [...past, project], future: future.slice(1), editingId: null });
  },
}));

export function useProject(): Project {
  const p = useEditor((s) => s.project);
  if (!p) throw new Error("Project not loaded");
  return p;
}
