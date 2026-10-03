"use client";

import { create } from "zustand";
import { createElement } from "./defaults";
import { uid } from "./geometry";
import type { ElementType, GridElement, Project } from "./types";

type View = { kind: "grid" } | { kind: "post"; index: number };

type State = {
  project: Project | null;
  selectedId: string | null;
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
  addElement: (type: ElementType, postIndex?: number, extra?: Record<string, unknown>) => string;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  reorder: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  select: (id: string | null) => void;
  setZoom: (z: number) => void;
  setView: (v: View) => void;
  setGapPreview: (on: boolean) => void;
  setSaveState: (s: State["saveState"]) => void;
  undo: () => void;
  redo: () => void;
};

const HISTORY_LIMIT = 100;

export const useEditor = create<State>((set, get) => ({
  project: null,
  selectedId: null,
  zoom: 0.25,
  view: { kind: "grid" },
  gapPreview: false,
  past: [],
  future: [],
  saveState: "idle",

  load: (p) => set({ project: p, past: [], future: [], selectedId: null }),

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

  updateElement: (id, patch, opts) =>
    get().setProject(
      (p) => ({ ...p, elements: p.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as GridElement) : e)) }),
      opts,
    ),

  addElement: (type, postIndex = 0, extra = {}) => {
    const p = get().project;
    if (!p) return "";
    const el = createElement(type, p, postIndex, extra);
    get().setProject((cur) => ({ ...cur, elements: [...cur.elements, el] }));
    set({ selectedId: el.id });
    return el.id;
  },

  removeElement: (id) => {
    get().setProject((p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) }));
    if (get().selectedId === id) set({ selectedId: null });
  },

  duplicateElement: (id) => {
    const p = get().project;
    const src = p?.elements.find((e) => e.id === id);
    if (!p || !src) return;
    const copy = { ...src, id: uid(src.type), name: src.name ? `${src.name} copy` : undefined, x: src.x + 40, y: src.y + 40 } as GridElement;
    const idx = p.elements.findIndex((e) => e.id === id);
    get().setProject((cur) => {
      const els = [...cur.elements];
      els.splice(idx + 1, 0, copy);
      return { ...cur, elements: els };
    });
    set({ selectedId: copy.id });
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

  select: (id) => set({ selectedId: id }),
  setZoom: (zoom) => set({ zoom: Math.max(0.03, Math.min(2, zoom)) }),
  setView: (view) => set({ view }),
  setGapPreview: (gapPreview) => set({ gapPreview }),
  setSaveState: (saveState) => set({ saveState }),

  undo: () => {
    const { past, project, future } = get();
    if (!past.length || !project) return;
    set({ project: past[past.length - 1], past: past.slice(0, -1), future: [project, ...future] });
  },
  redo: () => {
    const { past, project, future } = get();
    if (!future.length || !project) return;
    set({ project: future[0], past: [...past, project], future: future.slice(1) });
  },
}));

export function useProject(): Project {
  const p = useEditor((s) => s.project);
  if (!p) throw new Error("Project not loaded");
  return p;
}
