"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Rnd } from "react-rnd";
import { canvasSize, exportNumber, postRects, rotatedBounds } from "@/lib/geometry";
import { uploadAsset } from "@/lib/storage";
import { useEditor, useProject } from "@/lib/store";
import type { GridElement, Project } from "@/lib/types";
import { CanvasBackground } from "./canvas-background";
import { ElementContent, typo } from "./element-view";

type Guide = { axis: "x" | "y"; at: number };

/** The visual layer: identical to the export stage, so what you see is what exports. */
function VisualLayer({ project, editingId }: { project: Project; editingId?: string | null }) {
  const { width, height } = canvasSize(project);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, overflow: "hidden" }}>
      <CanvasBackground project={project} />
      {project.elements
        .filter((el) => !el.hidden)
        .map((el) => (
          <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h, mixBlendMode: el.blendMode, visibility: el.id === editingId ? "hidden" : undefined }}>
            <ElementContent el={el} brand={project.brand} mode="editor" />
          </div>
        ))}
    </div>
  );
}

/** Snap targets: canvas edges/center, every post edge, post center and safe-area line. */
function snapTargets(p: Project) {
  const { width: W, height: H } = canvasSize(p);
  const xs = new Set<number>([0, W / 2, W]);
  const ys = new Set<number>([0, H / 2, H]);
  for (const r of postRects(p)) {
    const s = (Math.min(r.w, r.h) * p.guides.safeArea) / 100;
    [r.x, r.x + r.w / 2, r.x + r.w, r.x + s, r.x + r.w - s].forEach((v) => xs.add(v));
    [r.y, r.y + r.h / 2, r.y + r.h, r.y + s, r.y + r.h - s].forEach((v) => ys.add(v));
  }
  return { xs: [...xs], ys: [...ys] };
}

function snapAxis(start: number, size: number, targets: number[], threshold: number): { value: number; guide: number | null } {
  let best: { d: number; value: number; guide: number } | null = null;
  for (const t of targets) {
    for (const [edge, offset] of [[start, 0], [start + size / 2, size / 2], [start + size, size]] as const) {
      const d = Math.abs(edge - t);
      if (d <= threshold && (!best || d < best.d)) best = { d, value: t - offset, guide: t };
    }
  }
  return best ? { value: Math.round(best.value), guide: best.guide } : { value: start, guide: null };
}

const TEXT_TYPES = new Set(["text", "quote", "cta", "badge"]);

/** Inline editor shown over a text-like element on double-click. */
function InlineTextEditor({ el, project }: { el: GridElement; project: Project }) {
  const updateElement = useEditor((s) => s.updateElement);
  const setEditing = useEditor((s) => s.setEditing);
  const checkpoint = useEditor((s) => s.checkpoint);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    checkpoint();
    const t = ref.current;
    if (t) {
      t.focus();
      t.select();
    }
  }, [checkpoint]);
  if (!("text" in el) || !("fontFamily" in el)) return null;
  const pad = el.type === "quote" ? el.padding : el.type === "text" ? el.padding : 0;
  return (
    <textarea
      ref={ref}
      value={el.text}
      spellCheck={false}
      onChange={(e) => updateElement(el.id, { text: e.target.value } as Partial<GridElement>, { record: false })}
      onBlur={() => setEditing(null)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) (e.target as HTMLTextAreaElement).blur();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        ...typo(el, project.brand),
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        padding: pad,
        resize: "none",
        border: "none",
        outline: "none",
        overflow: "hidden",
        background: "rgba(14,165,233,0.06)",
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        cursor: "text",
        zIndex: 5,
      }}
    />
  );
}

type DragGroup = { start: { x: number; y: number }; others: { id: string; x: number; y: number }[] };

function InteractionBox({ el, zoom, project, onGuides }: { el: GridElement; zoom: number; project: Project; onGuides: (g: Guide[]) => void }) {
  const selected = useEditor((s) => s.selectedIds.includes(el.id));
  const multi = useEditor((s) => s.selectedIds.length > 1);
  const editing = useEditor((s) => s.editingId === el.id);
  const select = useEditor((s) => s.select);
  const setEditing = useEditor((s) => s.setEditing);
  const updateElement = useEditor((s) => s.updateElement);
  const updateElements = useEditor((s) => s.updateElements);
  const checkpoint = useEditor((s) => s.checkpoint);
  const single = selected && !multi;
  const hs = 12 / zoom; // handle size in canvas px, constant on screen
  const targets = useRef<ReturnType<typeof snapTargets> | null>(null);
  const group = useRef<DragGroup | null>(null);

  const snap = (x: number, y: number) => {
    if (!project.guides.snap) return { x: Math.round(x), y: Math.round(y), guides: [] as Guide[] };
    const t = (targets.current ??= snapTargets(project));
    const th = 8 / zoom;
    // Snap the visible (rotated) bounds, then convert back to the element's box.
    const b = rotatedBounds({ ...el, x, y });
    const sx = snapAxis(b.x, b.w, t.xs, th);
    const sy = snapAxis(b.y, b.h, t.ys, th);
    const g = project.guides.gridSize;
    const guides: Guide[] = [];
    if (sx.guide !== null) guides.push({ axis: "x", at: sx.guide });
    if (sy.guide !== null) guides.push({ axis: "y", at: sy.guide });
    return {
      x: sx.guide !== null ? Math.round(sx.value - (b.x - x)) : Math.round(x / g) * g,
      y: sy.guide !== null ? Math.round(sy.value - (b.y - y)) : Math.round(y / g) * g,
      guides,
    };
  };

  const corner = (pos: Partial<CSSProperties>): CSSProperties => ({ width: hs, height: hs, ...pos });
  const handleStyles = {
    topLeft: corner({ left: -hs / 2, top: -hs / 2 }),
    topRight: corner({ right: -hs / 2, top: -hs / 2 }),
    bottomLeft: corner({ left: -hs / 2, bottom: -hs / 2 }),
    bottomRight: corner({ right: -hs / 2, bottom: -hs / 2 }),
    top: { height: hs, top: -hs / 2 },
    bottom: { height: hs, bottom: -hs / 2 },
    left: { width: hs, left: -hs / 2 },
    right: { width: hs, right: -hs / 2 },
  };
  const knob = <div style={{ width: "100%", height: "100%", background: "#fff", border: `${1.5 / zoom}px solid #0ea5e9`, borderRadius: 2 / zoom }} />;

  const startRotate = (e: ReactPointerEvent) => {
    e.stopPropagation();
    const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    checkpoint();
    const move = (ev: PointerEvent) => {
      let deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
      deg = ((Math.round(deg) % 360) + 360) % 360;
      updateElement(el.id, { rotation: deg > 180 ? deg - 360 : deg }, { record: false });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <Rnd
      scale={zoom}
      position={{ x: el.x, y: el.y }}
      size={{ width: el.w, height: el.h }}
      disableDragging={el.locked || editing}
      enableResizing={single && !el.locked && !editing}
      lockAspectRatio={el.type === "badge" && el.shape === "circle"}
      resizeHandleStyles={handleStyles}
      resizeHandleComponent={single && !el.locked ? { topLeft: knob, topRight: knob, bottomLeft: knob, bottomRight: knob } : undefined}
      onMouseDown={(e) => {
        e.stopPropagation();
        select(el.id, { additive: e.shiftKey || e.metaKey || e.ctrlKey });
      }}
      onDoubleClick={() => {
        if (TEXT_TYPES.has(el.type) && !el.locked) {
          select(el.id);
          setEditing(el.id);
        }
      }}
      onDragStart={() => {
        targets.current = null;
        checkpoint();
        const st = useEditor.getState();
        const ids = st.selectedIds.includes(el.id) ? st.selectedIds : [el.id];
        group.current = {
          start: { x: el.x, y: el.y },
          others: (st.project?.elements ?? []).filter((o) => o.id !== el.id && ids.includes(o.id) && !o.locked).map((o) => ({ id: o.id, x: o.x, y: o.y })),
        };
      }}
      onDrag={(_e, d) => {
        const s = snap(d.x, d.y);
        onGuides(s.guides);
        const g = group.current;
        const patches: Record<string, Partial<GridElement>> = { [el.id]: { x: s.x, y: s.y } };
        if (g) for (const o of g.others) patches[o.id] = { x: o.x + s.x - g.start.x, y: o.y + s.y - g.start.y };
        updateElements(patches, { record: false });
      }}
      onDragStop={() => {
        onGuides([]);
        group.current = null;
      }}
      onResizeStart={() => checkpoint()}
      onResize={(_e, _dir, ref, _delta, pos) => {
        updateElement(el.id, { w: Math.max(4, Math.round(ref.offsetWidth)), h: Math.max(4, Math.round(ref.offsetHeight)), x: Math.round(pos.x), y: Math.round(pos.y) }, { record: false });
      }}
      style={{
        outline: selected ? `${(single ? 2 : 1.5) / zoom}px ${single ? "solid" : "dashed"} #0ea5e9` : undefined,
        cursor: el.locked ? "default" : editing ? "text" : "move",
        zIndex: editing ? 4 : selected ? 2 : 1,
      }}
      className="group"
      data-element-id={el.id}
    >
      {/* Always mounted: unmounting the click target between clicks would swallow dblclick. */}
      <div className={selected ? "h-full w-full" : "h-full w-full group-hover:outline group-hover:outline-sky-400/60"} style={{ outlineWidth: 1 / zoom }} />
      {editing ? <InlineTextEditor el={el} project={project} /> : null}
      {single && !el.locked && !editing ? (
        <div
          onPointerDown={startRotate}
          title="Rotate (Shift = 15° steps)"
          style={{ position: "absolute", left: "50%", top: -hs * 3, width: hs * 1.2, height: hs * 1.2, marginLeft: -hs * 0.6, borderRadius: "50%", background: "#fff", border: `${1.5 / zoom}px solid #0ea5e9`, cursor: "grab" }}
        />
      ) : null}
      {selected && el.rotation !== 0 && !editing ? (
        <div style={{ position: "absolute", inset: 0, transform: `rotate(${el.rotation}deg)`, outline: `${1 / zoom}px dashed #0ea5e9`, pointerEvents: "none" }} />
      ) : null}
    </Rnd>
  );
}

function GuidesOverlay({ project, zoom, active }: { project: Project; zoom: number; active: Guide[] }) {
  const line = 1 / zoom;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {postRects(project).map((r) => {
        const s = (Math.min(r.w, r.h) * project.guides.safeArea) / 100;
        return (
          <div key={r.index}>
            {project.guides.showBoundaries ? <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, outline: `${line}px dashed rgba(14,165,233,0.75)`, outlineOffset: -line / 2 }} /> : null}
            {project.guides.showSafeArea && s > 0 ? <div style={{ position: "absolute", left: r.x + s, top: r.y + s, width: r.w - 2 * s, height: r.h - 2 * s, outline: `${line}px dashed rgba(236,72,153,0.45)` }} /> : null}
          </div>
        );
      })}
      {active.map((g, i) =>
        g.axis === "x" ? (
          <div key={i} style={{ position: "absolute", left: g.at - line / 2, top: 0, bottom: 0, width: line, background: "#f43f5e" }} />
        ) : (
          <div key={i} style={{ position: "absolute", top: g.at - line / 2, left: 0, right: 0, height: line, background: "#f43f5e" }} />
        ),
      )}
    </div>
  );
}

export function CanvasView() {
  const project = useProject();
  const zoom = useEditor((s) => s.zoom);
  const setZoom = useEditor((s) => s.setZoom);
  const view = useEditor((s) => s.view);
  const setView = useEditor((s) => s.setView);
  const gapPreview = useEditor((s) => s.gapPreview);
  const select = useEditor((s) => s.select);
  const setProject = useEditor((s) => s.setProject);
  const addElement = useEditor((s) => s.addElement);
  const selectMany = useEditor((s) => s.selectMany);
  const editingId = useEditor((s) => s.editingId);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { width: W, height: H } = canvasSize(project);
  const rects = postRects(project);
  const focus = view.kind === "post" ? rects[view.index] ?? null : null;
  const shownW = focus ? focus.w : W;
  const shownH = focus ? focus.h : H;

  const fit = useCallback(() => {
    const v = viewport.current;
    if (!v) return;
    setZoom(Math.min((v.clientWidth - 120) / shownW, (v.clientHeight - 120) / shownH));
  }, [setZoom, shownW, shownH]);

  useEffect(() => {
    fit();
  }, [fit, project.layout.rows, project.layout.cols, project.post.width, project.post.height]);

  useEffect(() => {
    const onFit = () => fit();
    window.addEventListener("threads-grid:fit", onFit);
    return () => window.removeEventListener("threads-grid:fit", onFit);
  }, [fit]);

  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(useEditor.getState().zoom * Math.exp(-e.deltaY * 0.0015));
    };
    v.addEventListener("wheel", onWheel, { passive: false });
    return () => v.removeEventListener("wheel", onWheel);
  }, [setZoom]);

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (!files.length || !stageRef.current) return;
    const box = stageRef.current.getBoundingClientRect();
    const cx = (e.clientX - box.left) / zoom + (focus?.x ?? 0);
    const cy = (e.clientY - box.top) / zoom + (focus?.y ?? 0);
    const postIndex = Math.max(0, rects.findIndex((r) => cx >= r.x && cx < r.x + r.w && cy >= r.y && cy < r.y + r.h));
    for (const [i, f] of files.entries()) {
      const up = await uploadAsset(f);
      const size = await imageSize(up.path);
      const u = Math.min(project.post.width, project.post.height) * 0.6;
      const k = Math.min(u / size.w, u / size.h);
      const w = Math.round(size.w * k);
      const h = Math.round(size.h * k);
      setProject((p) => (p.assets.some((a) => a.path === up.path) ? p : { ...p, assets: [...p.assets, { id: up.path, path: up.path, name: up.name, role: "image" }] }));
      addElement("image", postIndex, { src: up.path, fit: "contain", x: Math.round(cx - w / 2 + i * 40), y: Math.round(cy - h / 2 + i * 40), w, h, name: up.name });
    }
  };

  /** Drag on empty canvas = marquee select (Shift adds to the selection). */
  const startMarquee = (e: ReactPointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("[data-element-id]") || !stageRef.current) return;
    e.stopPropagation();
    const box = stageRef.current.getBoundingClientRect();
    const toCanvas = (cx: number, cy: number) => ({ x: (cx - box.left) / zoom + (focus?.x ?? 0), y: (cy - box.top) / zoom + (focus?.y ?? 0) });
    const a = toCanvas(e.clientX, e.clientY);
    const base = e.shiftKey ? useEditor.getState().selectedIds : [];
    if (!e.shiftKey) select(null);
    let rect = { x: a.x, y: a.y, w: 0, h: 0 };
    const move = (ev: PointerEvent) => {
      const b = toCanvas(ev.clientX, ev.clientY);
      rect = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
      setMarquee(rect);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setMarquee(null);
      if (rect.w < 4 / zoom && rect.h < 4 / zoom) return;
      const hits = useEditor
        .getState()
        .project!.elements.filter((el) => {
          if (el.hidden || el.locked) return false;
          const b = rotatedBounds(el);
          return b.x < rect.x + rect.w && b.x + b.w > rect.x && b.y < rect.y + rect.h && b.y + b.h > rect.y;
        })
        .map((el) => el.id);
      selectMany([...new Set([...base, ...hits])]);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const scaled: CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transform: `scale(${zoom})`, transformOrigin: "0 0" };

  if (gapPreview && !focus) {
    const gap = 14;
    return (
      <div ref={viewport} className="relative flex-1 overflow-auto bg-zinc-950" onPointerDown={() => select(null)}>
        <div className="p-14" style={{ width: "max-content" }}>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${project.layout.cols}, ${project.post.width * zoom}px)`, gap }}>
            {rects.map((r) => (
              <button key={r.index} onClick={() => setView({ kind: "post", index: r.index })} className="relative overflow-hidden rounded-sm shadow-lg ring-1 ring-white/5" style={{ width: r.w * zoom, height: r.h * zoom }}>
                <div style={{ ...scaled, left: -r.x * zoom, top: -r.y * zoom }}>
                  <VisualLayer project={project} />
                </div>
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 text-[10px] text-white">{String(exportNumber(project, r.index)).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewport}
      className="relative flex-1 overflow-auto bg-zinc-950"
      onPointerDown={(e) => {
        // pointerdown fires before the element's mousedown: never clear a selection the click is about to extend.
        if (!(e.target as HTMLElement).closest("[data-element-id]")) select(null);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="flex min-h-full items-center p-14" style={{ width: "max-content", minWidth: "100%" }}>
       <div className="mx-auto">
        {/* Post number rail */}
        <div className="relative mb-2 h-5" style={{ width: shownW * zoom }}>
          {(focus ? [focus] : rects.filter((r) => r.row === 0)).map((r) => (
            <button
              key={r.index}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setView(focus ? { kind: "grid" } : { kind: "post", index: r.index })}
              className="absolute text-[11px] font-medium text-zinc-500 hover:text-sky-400"
              style={{ left: focus ? 0 : r.x * zoom }}
            >
              {focus ? `← Post ${String(r.index + 1).padStart(2, "0")} · back to grid` : project.layout.rows > 1 ? `Col ${r.col + 1}` : `Post ${String(r.index + 1).padStart(2, "0")}`}
            </button>
          ))}
        </div>
        <div ref={stageRef} onPointerDown={startMarquee} className={dragOver ? "ring-2 ring-sky-500" : "shadow-2xl"} style={{ position: "relative", width: shownW * zoom, height: shownH * zoom, overflow: focus ? "hidden" : "visible" }}>
          <div style={{ ...scaled, left: focus ? -focus.x * zoom : 0, top: focus ? -focus.y * zoom : 0 }}>
            <VisualLayer project={project} editingId={editingId} />
            <GuidesOverlay project={project} zoom={zoom} active={guides} />
            {marquee ? <div style={{ position: "absolute", left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, background: "rgba(14,165,233,0.12)", outline: `${1 / zoom}px solid #0ea5e9`, zIndex: 10, pointerEvents: "none" }} /> : null}
            {project.elements
              .filter((el) => !el.hidden)
              .map((el) => (
                <InteractionBox key={el.id} el={el} zoom={zoom} project={project} onGuides={setGuides} />
              ))}
          </div>
        </div>
       </div>
      </div>
    </div>
  );
}

function imageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 800, h: img.naturalHeight || 800 });
    img.onerror = () => resolve({ w: 800, h: 800 });
    img.src = src;
  });
}
