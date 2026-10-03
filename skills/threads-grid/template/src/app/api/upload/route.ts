import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

// Browsers report font MIME types inconsistently (often empty), so fonts are matched by extension.
const FONT_EXT = new Set(["ttf", "otf", "woff", "woff2"]);

/**
 * Stores uploads content-addressed so re-uploads dedupe:
 * images → public/uploads/<sha1>.<ext>, fonts → public/uploads/fonts/<sha1>.<ext>.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  const nameExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isFont = FONT_EXT.has(nameExt);
  const ext = isFont ? nameExt : EXT[file.type];
  if (!ext) return Response.json({ error: `Unsupported type ${file.type || nameExt}` }, { status: 415 });
  const buf = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha1").update(buf).digest("hex").slice(0, 16);
  const sub = isFont ? "uploads/fonts" : "uploads";
  const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", sub);
  await fs.mkdir(dir, { recursive: true });
  const name = `${hash}.${ext}`;
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, name), buf);
  return Response.json({ path: `/${sub}/${name}`, name: file.name, kind: isFont ? "font" : "image" });
}
