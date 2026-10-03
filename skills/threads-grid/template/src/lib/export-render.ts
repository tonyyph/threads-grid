import { getFontEmbedCSS, toCanvas } from "html-to-image";
import JSZip from "jszip";
import { canvasSize, exportNumber, postRects } from "./geometry";
import { waitForImages } from "./image-cache";
import { serializeProject } from "./storage";
import type { Project } from "./types";

export type RenderedPost = { index: number; number: number; fileName: string; blob: Blob; canvas: HTMLCanvasElement };
export type ExportBundle = { posts: RenderedPost[]; preview: Blob | null; projectJson: string };

export function fileExt(p: Project) {
  return p.export.format === "jpeg" ? "jpg" : p.export.format;
}

export function postFileName(p: Project, n: number) {
  return `${p.export.fileBase}-${String(n).padStart(2, "0")}.${fileExt(p)}`;
}

function canvasToBlob(c: HTMLCanvasElement, p: Project): Promise<Blob> {
  const type = `image/${p.export.format}`;
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error(`${type} encode failed`))), type, p.export.quality));
}

/** Force-load every font face the stage uses (lazy fonts would otherwise render as fallback). */
async function loadStageFonts(stage: HTMLElement) {
  const families = new Set<string>();
  stage.querySelectorAll<HTMLElement>("*").forEach((n) => families.add(getComputedStyle(n).fontFamily));
  await Promise.all([...families].map((f) => document.fonts.load(`16px ${f}`).catch(() => undefined)));
  await document.fonts.ready;
}

/**
 * Crop the connected stage into one PNG per post at exact platform pixels.
 * Each post is rendered separately (stage translated by -x,-y) so huge canvases
 * never hit browser canvas-area limits (Safari caps at ~16.7M px).
 */
export async function renderPosts(stage: HTMLElement, p: Project, onProgress?: (done: number, total: number) => void): Promise<RenderedPost[]> {
  await loadStageFonts(stage);
  await waitForImages(stage);
  const { width: W, height: H } = canvasSize(p);
  const fontEmbedCSS = await getFontEmbedCSS(stage);
  const rects = postRects(p);
  const out: RenderedPost[] = [];
  for (const r of rects) {
    const opts = {
      width: r.w,
      height: r.h,
      canvasWidth: r.w,
      canvasHeight: r.h,
      pixelRatio: p.export.scale,
      backgroundColor: p.export.format === "jpeg" ? "#ffffff" : undefined,
      fontEmbedCSS,
      style: { transform: `translate(${-r.x}px, ${-r.y}px)`, transformOrigin: "0 0", width: `${W}px`, height: `${H}px` },
    };
    let canvas = await toCanvas(stage, opts);
    // First capture in a session can miss decoded images in WebKit; one retry is cheap.
    if (r.index === 0) canvas = await toCanvas(stage, opts);
    const n = exportNumber(p, r.index);
    out.push({ index: r.index, number: n, fileName: postFileName(p, n), blob: await canvasToBlob(canvas, p), canvas });
    onProgress?.(out.length, rects.length);
  }
  return out.sort((a, b) => a.number - b.number);
}

/** Stitch rendered posts into one scaled-down overview (optionally with gaps like a profile grid). */
export async function renderPreview(p: Project, posts: RenderedPost[], gap = 0): Promise<Blob> {
  const { width: W, height: H } = canvasSize(p);
  const fullW = W + gap * (p.layout.cols - 1);
  const fullH = H + gap * (p.layout.rows - 1);
  const scale = Math.min(1, p.export.previewMaxSize / Math.max(fullW, fullH));
  const c = document.createElement("canvas");
  c.width = Math.round(fullW * scale);
  c.height = Math.round(fullH * scale);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = "high";
  const rects = postRects(p);
  for (const post of posts) {
    const r = rects[post.index];
    ctx.drawImage(post.canvas, (r.x + r.col * gap) * scale, (r.y + r.row * gap) * scale, r.w * scale, r.h * scale);
  }
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))), "image/png"));
}

export async function buildBundle(stage: HTMLElement, p: Project, onProgress?: (done: number, total: number) => void): Promise<ExportBundle> {
  const posts = await renderPosts(stage, p, onProgress);
  const preview = p.export.includePreview ? await renderPreview(p, posts, p.layout.rows > 1 ? Math.round(p.post.width * 0.01) : 0) : null;
  return { posts, preview, projectJson: serializeProject(p) };
}

export function postingNotes(p: Project): string {
  const total = p.layout.rows * p.layout.cols;
  const lines = [
    `${p.name} — ${total} posts, ${p.post.width}×${p.post.height}, layout ${p.layout.rows}×${p.layout.cols}`,
    "",
    p.export.order === "posting" && p.layout.rows > 1 && p.layout.cols > 1
      ? "Files are numbered in POSTING order: publish 01 first, the highest number last. The profile grid then shows the composition correctly."
      : "Files are numbered in READING order (01 = top-left). For a profile-grid puzzle, publish in reverse: the highest number first.",
  ];
  if (p.copyPlan.caption) lines.push("", "Caption:", p.copyPlan.caption);
  p.copyPlan.posts.forEach((cp, i) => {
    if (cp.headline || cp.body || cp.notes) lines.push("", `Post ${i + 1} (${cp.role}): ${cp.headline}`, cp.body, cp.notes ? `Notes: ${cp.notes}` : "");
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

export async function bundleToZip(p: Project, b: ExportBundle): Promise<Blob> {
  const zip = new JSZip();
  for (const post of b.posts) zip.file(post.fileName, post.blob);
  if (b.preview) zip.file(`${p.export.fileBase}-preview.png`, b.preview);
  if (p.export.includeProjectJson) zip.file(`${p.export.fileBase}-project.json`, b.projectJson);
  zip.file("POSTING-ORDER.txt", postingNotes(p));
  return zip.generateAsync({ type: "blob" });
}

/** Also write the bundle to ./exports/<timestamp>/ through the dev server (agent-friendly). */
export async function saveBundleToDisk(p: Project, b: ExportBundle): Promise<{ dir: string; files: string[] }> {
  const form = new FormData();
  for (const post of b.posts) form.append("files", post.blob, post.fileName);
  if (b.preview) form.append("files", b.preview, `${p.export.fileBase}-preview.png`);
  if (p.export.includeProjectJson) form.append("files", new Blob([b.projectJson], { type: "application/json" }), `${p.export.fileBase}-project.json`);
  form.append("files", new Blob([postingNotes(p)], { type: "text/plain" }), "POSTING-ORDER.txt");
  const res = await fetch("/api/export", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Export save failed: ${res.status}`);
  return res.json();
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
