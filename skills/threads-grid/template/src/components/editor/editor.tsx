"use client";

import { useEffect, useRef, useState } from "react";
import { ExportStage } from "@/components/canvas/export-stage";
import { CanvasView } from "@/components/canvas/canvas-view";
import { Inspector } from "@/components/inspector/inspector";
import { defaultProject } from "@/lib/defaults";
import { buildBundle, bundleToZip, downloadBlob, saveBundleToDisk } from "@/lib/export-render";
import { inlineImages } from "@/lib/image-cache";
import { customFontFamily, postRects } from "@/lib/geometry";
import { loadProjectFromServer, saveProjectToServer } from "@/lib/storage";
import { useEditor } from "@/lib/store";
import type { Project } from "@/lib/types";
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";

declare global {
  interface Window {
    __THREADS_GRID_EXPORT__?: { status: "running" | "done" | "error"; dir?: string; files?: string[]; error?: string; missing?: string[] };
  }
}

export type ExportTarget = { zip: boolean; disk: boolean };

export function Editor() {
  const project = useEditor((s) => s.project);
  const load = useEditor((s) => s.load);
  const setSaveState = useEditor((s) => s.setSaveState);
  const [loadErrors, setLoadErrors] = useState<string[] | null>(null);
  const [srcMap, setSrcMap] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastSaved = useRef<Project | null>(null);

  // Load threads-grid.json (create it from defaults on first run).
  useEffect(() => {
    loadProjectFromServer().then(async (res) => {
      if (res.ok) {
        lastSaved.current = res.project;
        load(res.project);
      } else if (res.missing) {
        const p = defaultProject();
        await saveProjectToServer(p);
        lastSaved.current = p;
        load(p);
      } else setLoadErrors(res.errors);
    });
  }, [load]);

  // Debounced autosave.
  useEffect(() => {
    if (!project || project === lastSaved.current) return;
    setSaveState("saving");
    const t = setTimeout(() => {
      saveProjectToServer(project)
        .then(() => {
          lastSaved.current = project;
          setSaveState("saved");
        })
        .catch(() => setSaveState("error"));
    }, 500);
    return () => clearTimeout(t);
  }, [project, setSaveState]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      const s = useEditor.getState();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (s.project) saveProjectToServer(s.project).then(() => s.setSaveState("saved"));
        return;
      }
      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const p = s.project;
        if (!p) return;
        // In single-post view, select only that post's elements.
        const r = s.view.kind === "post" ? postRects(p)[s.view.index] : null;
        s.selectMany(p.elements.filter((x) => !x.hidden && !x.locked && (!r || (x.x < r.x + r.w && x.x + x.w > r.x && x.y < r.y + r.h && x.y + x.h > r.y))).map((x) => x.id));
        return;
      }
      if (e.key === "Escape") return s.select(null);
      if (!s.selectedIds.length) return;
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        s.duplicateSelected();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        s.removeSelected();
      } else if (e.key === "Enter" && s.selectedId) {
        const el = s.project?.elements.find((x) => x.id === s.selectedId);
        if (el && "text" in el && !el.locked) {
          e.preventDefault();
          s.setEditing(el.id);
        }
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        s.nudgeSelected(dx, dy);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const runExport = async (target: ExportTarget) => {
    const p = useEditor.getState().project;
    if (!p || !stageRef.current) return;
    window.__THREADS_GRID_EXPORT__ = { status: "running" };
    try {
      setProgress("Preparing images…");
      const srcs = [...p.elements.flatMap((e) => (e.type === "image" && !e.hidden ? [e.src] : [])), p.background.type === "image" ? p.background.image : ""];
      const { map, missing } = await inlineImages(srcs);
      setSrcMap(map);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const bundle = await buildBundle(stageRef.current, p, (done, total) => setProgress(`Rendering post ${done}/${total}…`));
      let dir: string | undefined;
      let files: string[] | undefined;
      if (target.disk) {
        setProgress("Saving to ./exports…");
        ({ dir, files } = await saveBundleToDisk(p, bundle));
      }
      if (target.zip) {
        setProgress("Zipping…");
        downloadBlob(await bundleToZip(p, bundle), `${p.export.fileBase}.zip`);
      }
      window.__THREADS_GRID_EXPORT__ = { status: "done", dir, files, missing };
      setProgress(missing.length ? `Done — ${missing.length} missing image(s) skipped` : dir ? `Done — saved to ${dir}` : "Done");
    } catch (e) {
      console.error(e);
      window.__THREADS_GRID_EXPORT__ = { status: "error", error: String(e) };
      setProgress(`Export failed: ${String(e)}`);
    } finally {
      setTimeout(() => setProgress(null), 4000);
    }
  };

  // Headless export hook used by `pnpm export` (scripts/export.ts): /?export=disk
  const autoExported = useRef(false);
  useEffect(() => {
    if (!project || autoExported.current) return;
    const mode = new URLSearchParams(window.location.search).get("export");
    if (!mode) return;
    autoExported.current = true;
    setTimeout(() => runExport({ disk: true, zip: mode === "zip" }), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  if (loadErrors) {
    return (
      <div className="grid h-screen place-items-center bg-zinc-950 p-8 text-zinc-200">
        <div className="max-w-2xl">
          <h1 className="mb-2 text-lg font-semibold text-red-300">threads-grid.json has schema errors</h1>
          <p className="mb-4 text-sm text-zinc-400">Fix the file (or run <code>pnpm validate</code>) and reload.</p>
          <pre className="overflow-auto rounded bg-zinc-900 p-4 text-xs">{loadErrors.join("\n")}</pre>
        </div>
      </div>
    );
  }
  if (!project) return <div className="grid h-screen place-items-center bg-zinc-950 text-sm text-zinc-500">Loading threads-grid.json…</div>;

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <Toolbar onExport={runExport} progress={progress} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <CanvasView />
        <Inspector />
      </div>
      <ExportStage ref={stageRef} project={project} srcMap={srcMap} />
      <CustomFontFaces fonts={project.brand.customFonts} />
    </div>
  );
}

/** @font-face rules for uploaded fonts. Inline <style> is picked up by html-to-image's font embedding. */
function CustomFontFaces({ fonts }: { fonts: Project["brand"]["customFonts"] }) {
  if (!fonts.length) return null;
  const css = fonts
    .map((f) => `@font-face{font-family:"${customFontFamily(f.id)}";src:url("${f.path}");font-weight:${f.weight};font-style:${f.style};font-display:block;}`)
    .join("\n");
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
