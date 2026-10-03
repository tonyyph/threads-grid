/**
 * Generate a first draft from the brief already in threads-grid.json
 * (brand, style, preset, layout, copyPlan, assets) using a layout template.
 *
 *   pnpm draft connected-headline
 *   pnpm draft product-hero-split --style luxury-product-launch
 *   pnpm draft --list
 *
 * Replaces `elements`. Brand colors/fonts are only overwritten when --style is passed.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { applyLayout, applyPreset, applyStyle, defaultProject } from "../src/lib/defaults";
import { PROJECT_FILE, parseProject, serializeProject } from "../src/lib/storage";
import { LAYOUT_TEMPLATES, buildTemplate, type LayoutTemplateId } from "../src/lib/templates";

const args = process.argv.slice(2);
if (args.includes("--list")) {
  for (const t of LAYOUT_TEMPLATES) console.log(`${t.id.padEnd(22)} ${t.hint}`);
  process.exit(0);
}
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const templateId = (args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--")) ?? "connected-headline") as LayoutTemplateId;
if (!LAYOUT_TEMPLATES.some((t) => t.id === templateId)) {
  console.error(`Unknown template "${templateId}". Run: pnpm draft --list`);
  process.exit(1);
}

const file = path.join(process.cwd(), PROJECT_FILE);
let p = existsSync(file)
  ? (() => {
      const r = parseProject(JSON.parse(readFileSync(file, "utf8")));
      if (!r.ok) {
        console.error(r.errors.join("\n"));
        process.exit(1);
      }
      return r.project;
    })()
  : defaultProject();

const style = flag("style");
if (style) p = applyStyle(p, style);
// Re-apply layout/preset so rows/cols/size are consistent with the declared mode.
p = applyPreset(p, p.preset, p.post);
p = applyLayout(p, p.layout.mode, { rows: p.layout.rows, cols: p.layout.cols });
p = { ...p, elements: buildTemplate(p, templateId) };
writeFileSync(file, serializeProject(p));
console.log(`✓ Drafted "${templateId}" → ${p.elements.length} elements in ${PROJECT_FILE}. The open editor reloads on refresh.`);
