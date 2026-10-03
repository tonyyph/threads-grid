"use client";

import { Download, Grid3x3, HardDriveDownload, LayoutGrid, Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { ZOOM_STEPS } from "@/lib/constants";
import { useEditor, useProject } from "@/lib/store";
import { Button, Select, cn } from "../ui/controls";
import type { ExportTarget } from "./editor";

export function Toolbar({ onExport, progress }: { onExport: (t: ExportTarget) => void; progress: string | null }) {
  const project = useProject();
  const setProject = useEditor((s) => s.setProject);
  const zoom = useEditor((s) => s.zoom);
  const setZoom = useEditor((s) => s.setZoom);
  const view = useEditor((s) => s.view);
  const setView = useEditor((s) => s.setView);
  const gapPreview = useEditor((s) => s.gapPreview);
  const setGapPreview = useEditor((s) => s.setGapPreview);
  const saveState = useEditor((s) => s.saveState);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const total = project.layout.rows * project.layout.cols;

  const step = (dir: 1 | -1) => {
    const next = dir > 0 ? ZOOM_STEPS.find((z) => z > zoom + 0.001) : [...ZOOM_STEPS].reverse().find((z) => z < zoom - 0.001);
    if (next) setZoom(next);
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-800 px-3">
      <div className="mr-2 flex items-center gap-2">
        <div className="grid h-6 w-6 place-items-center rounded bg-white text-[10px] font-black text-black">TG</div>
        <span className="text-sm font-semibold">threads-grid</span>
        <span className="hidden text-xs text-zinc-500 lg:inline">· {project.name}</span>
      </div>

      <Button size="icon" variant="ghost" disabled={!canUndo} onClick={undo} title="Undo (⌘Z)">
        <Undo2 size={15} />
      </Button>
      <Button size="icon" variant="ghost" disabled={!canRedo} onClick={redo} title="Redo (⇧⌘Z)">
        <Redo2 size={15} />
      </Button>

      <div className="mx-2 h-5 w-px bg-zinc-800" />

      <div className="flex rounded-md bg-zinc-900 p-0.5">
        <button onClick={() => { setView({ kind: "grid" }); setGapPreview(false); }} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs", view.kind === "grid" && !gapPreview ? "bg-zinc-700 text-white" : "text-zinc-400")}>
          <LayoutGrid size={13} /> Connected
        </button>
        <button onClick={() => { setView({ kind: "grid" }); setGapPreview(true); }} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs", view.kind === "grid" && gapPreview ? "bg-zinc-700 text-white" : "text-zinc-400")}>
          <Grid3x3 size={13} /> Feed split
        </button>
      </div>
      <div className="w-28">
        <Select
          value={view.kind === "post" ? String(view.index) : "grid"}
          onChange={(v) => setView(v === "grid" ? { kind: "grid" } : { kind: "post", index: Number(v) })}
          options={[{ value: "grid", label: "All posts" }, ...Array.from({ length: total }, (_, i) => ({ value: String(i), label: `Post ${String(i + 1).padStart(2, "0")}` }))]}
        />
      </div>

      <div className="mx-2 h-5 w-px bg-zinc-800" />

      <Button size="icon" variant="ghost" onClick={() => step(-1)} title="Zoom out (⌘ + scroll)">
        <ZoomOut size={15} />
      </Button>
      <span className="w-11 text-center text-xs tabular-nums text-zinc-400">{Math.round(zoom * 100)}%</span>
      <Button size="icon" variant="ghost" onClick={() => step(1)} title="Zoom in">
        <ZoomIn size={15} />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => window.dispatchEvent(new Event("threads-grid:fit"))} title="Fit">
        <Maximize size={15} />
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <span className={cn("text-[11px]", saveState === "error" ? "text-red-400" : "text-zinc-500")}>
          {progress ?? (saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved to threads-grid.json" : saveState === "error" ? "Save failed" : "")}
        </span>
        <div className="w-36">
          <Select
            value={project.export.order}
            onChange={(v) => setProject((p) => ({ ...p, export: { ...p.export, order: v } }))}
            options={[
              { value: "reading", label: "Reading order" },
              { value: "posting", label: "Posting order" },
            ]}
          />
        </div>
        <Button size="md" variant="secondary" disabled={!!progress} onClick={() => onExport({ zip: false, disk: true })} title="Write PNGs to ./exports/latest">
          <HardDriveDownload size={14} /> Save to exports/
        </Button>
        <Button size="md" variant="primary" disabled={!!progress} onClick={() => onExport({ zip: true, disk: true })}>
          <Download size={14} /> Export ZIP
        </Button>
      </div>
    </header>
  );
}
