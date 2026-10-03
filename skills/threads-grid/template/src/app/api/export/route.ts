import { promises as fs } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

/** Writes an export bundle to ./exports/<timestamp>/ and refreshes ./exports/latest/. */
export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return Response.json({ error: "No files" }, { status: 400 });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const root = path.join(/*turbopackIgnore: true*/ process.cwd(), "exports");
  const dir = path.join(root, stamp);
  const latest = path.join(root, "latest");
  await fs.mkdir(dir, { recursive: true });
  await fs.rm(latest, { recursive: true, force: true });
  await fs.mkdir(latest, { recursive: true });
  const written: string[] = [];
  for (const f of files) {
    const name = path.basename(f.name); // no path traversal
    const buf = Buffer.from(await f.arrayBuffer());
    await fs.writeFile(path.join(dir, name), buf);
    await fs.writeFile(path.join(latest, name), buf);
    written.push(name);
  }
  return Response.json({ dir: path.relative(process.cwd(), dir), files: written });
}
