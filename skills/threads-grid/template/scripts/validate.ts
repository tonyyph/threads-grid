/**
 * Validate threads-grid.json against the schema and print a short summary.
 *   pnpm validate            # checks ./threads-grid.json
 *   pnpm validate --write    # also writes back the normalized file (all defaults filled)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { canvasSize, postsTouchedBy } from "../src/lib/geometry";
import { PROJECT_FILE, parseProject, serializeProject } from "../src/lib/storage";

const file = path.join(process.cwd(), PROJECT_FILE);
const raw = JSON.parse(readFileSync(file, "utf8"));
const res = parseProject(raw);
if (!res.ok) {
  console.error(`✗ ${PROJECT_FILE} is invalid:\n  ` + res.errors.join("\n  "));
  process.exit(1);
}
const p = res.project;
const { width, height } = canvasSize(p);
const warnings: string[] = [];
for (const el of p.elements) {
  if (el.type === "image" && el.src && el.src.startsWith("/") && !existsSync(path.join(process.cwd(), "public", el.src))) warnings.push(`${el.id}: image not found at public${el.src}`);
  if (!postsTouchedBy(p, el).length) warnings.push(`${el.id}: entirely outside the canvas`);
  if ("fontSize" in el && el.type === "text" && el.fontSize < Math.min(p.post.width, p.post.height) * 0.024) warnings.push(`${el.id}: font ${el.fontSize}px is likely unreadable on a phone (min ≈ ${Math.ceil(Math.min(p.post.width, p.post.height) * 0.024)}px)`);
}
if (p.copyPlan.posts.length && p.copyPlan.posts.length !== p.layout.rows * p.layout.cols) warnings.push(`copyPlan has ${p.copyPlan.posts.length} posts but layout has ${p.layout.rows * p.layout.cols}`);

console.log(`✓ ${PROJECT_FILE} valid — "${p.name}", ${p.layout.rows}×${p.layout.cols} posts of ${p.post.width}×${p.post.height} (canvas ${width}×${height}), ${p.elements.length} elements, style ${p.style}`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
if (process.argv.includes("--write")) {
  writeFileSync(file, serializeProject(p));
  console.log("  normalized file written");
}
