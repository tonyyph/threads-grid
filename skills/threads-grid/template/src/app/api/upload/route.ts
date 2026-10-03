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

/** Stores uploads content-addressed in public/uploads/<sha1>.<ext> so re-uploads dedupe. */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  const ext = EXT[file.type];
  if (!ext) return Response.json({ error: `Unsupported type ${file.type}` }, { status: 415 });
  const buf = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha1").update(buf).digest("hex").slice(0, 16);
  const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const name = `${hash}.${ext}`;
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, name), buf);
  return Response.json({ path: `/uploads/${name}`, name: file.name });
}
