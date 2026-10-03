#!/usr/bin/env node
/**
 * Scaffold a threads-grid editor project from this skill's template.
 *
 *   node <skill-dir>/scripts/scaffold.mjs <target-dir> [--no-install]
 *
 * Cross-platform (macOS, Linux, Windows); needs only Node 20+.
 * Installs dependencies with pnpm when available, otherwise npm.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(SKILL_DIR, "template");
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
const noInstall = args.includes("--no-install");

if (!target) {
  console.error("usage: node scaffold.mjs <target-dir> [--no-install]");
  process.exit(1);
}
const [major] = process.versions.node.split(".").map(Number);
if (major < 20) {
  console.error(`✗ Node 20+ required (found ${process.versions.node})`);
  process.exit(1);
}

const dest = path.resolve(target);
if (existsSync(dest) && readdirSync(dest).length > 0) {
  console.error(`✗ ${dest} exists and is not empty`);
  process.exit(1);
}

// Local build artifacts and per-project state never leave the template.
const SKIP_DIRS = new Set(["node_modules", ".next", "exports"]);
const SKIP_FILES = new Set(["threads-grid.json", "next-env.d.ts", "pnpm-lock.yaml", "package-lock.json"]);
const uploads = path.join(TEMPLATE, "public", "uploads");

cpSync(TEMPLATE, dest, {
  recursive: true,
  filter: (src) => {
    const name = path.basename(src);
    if (SKIP_DIRS.has(name) || SKIP_FILES.has(name) || name.endsWith(".tsbuildinfo")) return false;
    if (src.startsWith(uploads + path.sep)) return false; // keep public/uploads empty
    return true;
  },
});
mkdirSync(path.join(dest, "public", "uploads"), { recursive: true });
writeFileSync(path.join(dest, "public", "uploads", ".gitkeep"), "");
console.log(`✓ Scaffolded threads-grid editor into ${dest}`);

if (!noInstall) {
  const hasPnpm = spawnSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["--version"], { stdio: "ignore" }).status === 0;
  const pm = hasPnpm ? "pnpm" : "npm";
  console.log(`→ Installing dependencies with ${pm}…`);
  const res = spawnSync(process.platform === "win32" ? `${pm}.cmd` : pm, ["install"], { cwd: dest, stdio: "inherit", shell: process.platform === "win32" });
  if (res.status !== 0) {
    console.error(`✗ ${pm} install failed — run it manually in ${dest}`);
    process.exit(res.status ?? 1);
  }
}

const run = noInstall ? "pnpm install && " : "";
console.log(`Next: write ${path.join(dest, "threads-grid.json")}, then: cd "${dest}" && ${run}pnpm draft <template> && pnpm dev`);
