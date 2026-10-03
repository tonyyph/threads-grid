import { promises as fs } from "node:fs";
import path from "node:path";
import { PROJECT_FILE, parseProject, serializeProject } from "@/lib/storage";

export const dynamic = "force-dynamic";

const file = () => path.join(/*turbopackIgnore: true*/ process.cwd(), PROJECT_FILE);

export async function GET() {
  let raw: string;
  try {
    raw = await fs.readFile(file(), "utf8");
  } catch {
    return Response.json({ error: `${PROJECT_FILE} not found` }, { status: 404 });
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return Response.json({ error: "Invalid JSON", errors: [String(e)] }, { status: 422 });
  }
  const res = parseProject(json);
  if (!res.ok) return Response.json({ error: "Schema errors", errors: res.errors }, { status: 422 });
  return Response.json(res.project);
}

export async function PUT(req: Request) {
  const res = parseProject(await req.json());
  if (!res.ok) return Response.json({ error: "Schema errors", errors: res.errors }, { status: 422 });
  const tmp = file() + ".tmp";
  await fs.writeFile(tmp, serializeProject(res.project));
  await fs.rename(tmp, file());
  return Response.json({ ok: true });
}
