import { ProjectSchema, type Project } from "./types";

export const PROJECT_FILE = "threads-grid.json";

export type ParseResult = { ok: true; project: Project } | { ok: false; errors: string[] };

/** Validate + fill defaults. Used by the API route, the editor and scripts/validate.ts. */
export function parseProject(input: unknown): ParseResult {
  const res = ProjectSchema.safeParse(input);
  if (res.success) return { ok: true, project: res.data };
  return {
    ok: false,
    errors: res.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
  };
}

export function serializeProject(p: Project): string {
  return JSON.stringify(p, null, 2) + "\n";
}

export async function loadProjectFromServer(): Promise<ParseResult & { missing?: boolean }> {
  const res = await fetch("/api/project", { cache: "no-store" });
  if (res.status === 404) return { ok: false, errors: [], missing: true };
  const body = await res.json();
  if (!res.ok) return { ok: false, errors: body.errors ?? [String(body.error ?? res.statusText)] };
  return parseProject(body);
}

export async function saveProjectToServer(p: Project): Promise<void> {
  const res = await fetch("/api/project", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: serializeProject(p),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
}

export async function uploadAsset(file: File): Promise<{ path: string; name: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}
