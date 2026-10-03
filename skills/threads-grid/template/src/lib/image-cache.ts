/**
 * Export reliability: html-to-image re-fetches every <img> while cloning, and a
 * slow or uncached fetch can produce a blank image in the PNG. Before export we
 * inline every image as a data URL once and render the export stage from that.
 */
const dataUrls = new Map<string, string>();

async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  const hit = dataUrls.get(src);
  if (hit) return hit;
  const res = await fetch(src, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Image not found: ${src}`);
  const blob = await res.blob();
  const url = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
  dataUrls.set(src, url);
  return url;
}

/** Resolve all sources to data URLs; missing images are reported, not fatal. */
export async function inlineImages(srcs: string[]): Promise<{ map: Record<string, string>; missing: string[] }> {
  const map: Record<string, string> = {};
  const missing: string[] = [];
  await Promise.all(
    [...new Set(srcs.filter(Boolean))].map(async (src) => {
      try {
        map[src] = await toDataUrl(src);
      } catch {
        missing.push(src);
      }
    }),
  );
  return { map, missing };
}

/** Wait until every <img> under `root` has decoded. */
export async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(imgs.map((img) => (img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode().catch(() => undefined))));
}

export function invalidateImage(src: string) {
  dataUrls.delete(src);
}
