import { canvasSize, postRects } from "./geometry";
import { createElement } from "./defaults";
import type { CopyPost, GridElement, PostRect, Project } from "./types";

/**
 * Layout recipes. Each one turns (project + copyPlan + assets) into a full set of elements.
 * They are starting points: the agent or the user refines the result in the editor.
 * All sizes are relative to the post size, so every recipe works for every preset and grid.
 */
export const LAYOUT_TEMPLATES = [
  { id: "connected-headline", label: "Connected headline", hint: "One big hook crosses posts 1→2, a rule line runs through everything." },
  { id: "product-hero-split", label: "Product hero split", hint: "Product sits on the seam between posts 1 and 2." },
  { id: "timeline", label: "Timeline carousel", hint: "One line, one step per post." },
  { id: "quote-thread", label: "Quote thread", hint: "Connected quote cards with the same rhythm." },
  { id: "educational", label: "Educational breakdown", hint: "Hook → problem → insight → framework → example → CTA." },
  { id: "puzzle-grid", label: "Puzzle / campaign grid", hint: "One composition across the whole grid, product in the center." },
] as const;

export type LayoutTemplateId = (typeof LAYOUT_TEMPLATES)[number]["id"];

const FALLBACK: Record<string, CopyPost[]> = {
  carousel: [
    { role: "hook", headline: "Most people get this wrong.", body: "", notes: "" },
    { role: "problem", headline: "The problem", body: "Name the pain in one sentence your reader would say out loud.", notes: "" },
    { role: "insight", headline: "The insight", body: "The non-obvious idea that reframes the problem.", notes: "" },
    { role: "proof", headline: "Proof", body: "A number, a result, a before/after.", notes: "" },
    { role: "method", headline: "The method", body: "Three steps anyone can follow today.", notes: "" },
    { role: "cta", headline: "Save this for later.", body: "Follow for the next one.", notes: "" },
  ],
  "product-launch": [
    { role: "promise", headline: "Something new is coming.", body: "", notes: "" },
    { role: "problem", headline: "You deserve better than this.", body: "The everyday frustration your product removes.", notes: "" },
    { role: "reveal", headline: "Meet the product.", body: "", notes: "" },
    { role: "benefit", headline: "Why it matters", body: "One benefit, stated as an outcome.", notes: "" },
    { role: "how", headline: "How to use it", body: "Three simple steps.", notes: "" },
    { role: "cta", headline: "Available now", body: "Link in bio", notes: "" },
  ],
  educational: [
    { role: "hook", headline: "5 mistakes everyone makes", body: "", notes: "" },
    { role: "mistake", headline: "The common mistake", body: "What it looks like in real life.", notes: "" },
    { role: "missed", headline: "What most people miss", body: "The underlying cause.", notes: "" },
    { role: "framework", headline: "The framework", body: "A simple model to remember.", notes: "" },
    { role: "example", headline: "Example", body: "Apply it to one concrete case.", notes: "" },
    { role: "cta", headline: "Save & share", body: "Send this to someone who needs it.", notes: "" },
  ],
};

function ctx(p: Project) {
  const posts = postRects(p);
  const { width: W, height: H } = canvasSize(p);
  const pw = p.post.width;
  const ph = p.post.height;
  const u = Math.min(pw, ph);
  const safe = Math.round((u * p.guides.safeArea) / 100);
  const fallback = FALLBACK[p.copyPlan.structure] ?? FALLBACK.carousel;
  const copy = (i: number): CopyPost => {
    const given = p.copyPlan.posts[i];
    if (given && (given.headline || given.body)) return given;
    // A real copy plan exists but doesn't cover this post: leave it empty rather than inject English placeholders.
    if (p.copyPlan.posts.length) return { role: given?.role ?? "", headline: "", body: "", notes: "" };
    if (i === posts.length - 1) return fallback[fallback.length - 1];
    return fallback[Math.min(i, fallback.length - 2)];
  };
  const product = p.assets.find((a) => a.role === "product")?.path ?? "";
  const logo = p.brand.logo || p.assets.find((a) => a.role === "logo")?.path || "";
  const el = (type: GridElement["type"], props: Record<string, unknown>) => createElement(type, p, 0, props);
  return { posts, W, H, pw, ph, u, safe, copy, product, logo, el, last: posts.length - 1 };
}

type Ctx = ReturnType<typeof ctx>;

function pager(c: Ctx, r: PostRect): GridElement {
  return c.el("text", {
    name: `Pager ${r.index + 1}`,
    x: r.x + c.safe,
    y: r.y + c.safe,
    w: c.u * 0.3,
    h: c.u * 0.05,
    text: `${String(r.index + 1).padStart(2, "0")} / ${String(c.posts.length).padStart(2, "0")}`,
    fontFamily: "body",
    fontSize: Math.round(c.u * 0.026),
    fontWeight: 600,
    letterSpacing: 0.12,
    color: "muted",
  });
}

function brandMark(c: Ctx, r: PostRect, name: string, side: "left" | "right" = "right"): GridElement {
  const left = side === "left";
  if (c.logo) {
    return c.el("image", {
      name: "Logo",
      role: "logo",
      src: c.logo,
      fit: "contain",
      x: left ? r.x + c.safe : r.x + r.w - c.safe - c.u * 0.16,
      y: r.y + c.safe,
      w: c.u * 0.16,
      h: c.u * 0.06,
      focusX: left ? 0 : 100,
    });
  }
  return c.el("text", {
    name: "Brand",
    x: left ? r.x + c.safe : r.x + r.w - c.safe - c.u * 0.4,
    y: r.y + c.safe,
    w: c.u * 0.4,
    h: c.u * 0.05,
    text: name,
    align: left ? "left" : "right",
    fontFamily: "body",
    fontSize: Math.round(c.u * 0.026),
    fontWeight: 700,
    letterSpacing: 0.08,
    uppercase: true,
    color: "text",
  });
}

function headlineBody(c: Ctx, r: PostRect, cp: CopyPost, opts: { top?: number; size?: number; color?: string } = {}): GridElement[] {
  const top = r.y + (opts.top ?? r.h * 0.42);
  const size = opts.size ?? Math.round(c.u * 0.072);
  const out: GridElement[] = [
    c.el("text", {
      name: `Headline ${r.index + 1}`,
      x: r.x + c.safe,
      y: top,
      w: r.w - c.safe * 2,
      h: size * 3.4,
      text: cp.headline,
      fontSize: size,
      lineHeight: 1.08,
      color: opts.color ?? "text",
    }),
  ];
  if (cp.body) {
    out.push(
      c.el("text", {
        name: `Body ${r.index + 1}`,
        x: r.x + c.safe,
        y: top + size * 3.6,
        w: r.w - c.safe * 2,
        h: c.u * 0.2,
        text: cp.body,
        fontFamily: "body",
        fontSize: Math.round(c.u * 0.034),
        fontWeight: 400,
        lineHeight: 1.4,
        color: "muted",
      }),
    );
  }
  return out;
}

function cta(c: Ctx, r: PostRect, text: string): GridElement {
  return c.el("cta", {
    name: "CTA",
    x: r.x + c.safe,
    y: r.y + r.h - c.safe - c.u * 0.11,
    w: c.u * 0.56,
    h: c.u * 0.11,
    text,
    radius: c.u * 0.055,
    fontSize: Math.round(c.u * 0.034),
  });
}

const recipes: Record<LayoutTemplateId, (p: Project) => GridElement[]> = {
  "connected-headline": (p) => {
    const c = ctx(p);
    const els: GridElement[] = [];
    // Glow straddling seam 1|2 for depth.
    els.push(c.el("gradient", { name: "Seam glow", kind: "radial", from: "accent", to: "transparent", opacity: 0.35, x: c.pw - c.u * 0.6, y: c.ph * 0.1, w: c.u * 1.2, h: c.u * 1.2 }));
    // Rule line through the whole canvas, every row.
    for (let row = 0; row < p.layout.rows; row++) {
      els.push(c.el("line", { name: `Rule row ${row + 1}`, x: 0, y: row * c.ph + c.ph * 0.84, w: c.W, h: 8, thickness: Math.max(2, Math.round(c.u * 0.003)), color: "accent" }));
    }
    const first = c.posts[0];
    const second = c.posts[1];
    const spans = second && second.row === first.row;
    const hookSize = Math.round(c.u * (spans ? 0.2 : 0.13));
    els.push(
      c.el("text", {
        name: "Hook (crosses 1→2)",
        x: first.x + c.safe,
        y: first.y + c.ph * 0.2,
        w: (spans ? c.pw * 2 : c.pw) - c.safe * 2,
        h: hookSize * 3.2,
        text: c.copy(0).headline,
        fontSize: hookSize,
        lineHeight: 0.98,
        letterSpacing: -0.02,
      }),
    );
    c.posts.forEach((r) => {
      els.push(pager(c, r));
      if (r.index === 0) els.push(brandMark(c, r, p.brand.name));
      if (r.index === 0 || (spans && r.index === 1)) return;
      els.push(...headlineBody(c, r, c.copy(r.index), { top: c.ph * 0.3 }));
    });
    els.push(cta(c, c.posts[c.last], c.copy(c.last).body || "Follow for more"));
    return els;
  },

  "product-hero-split": (p) => {
    const c = ctx(p);
    const els: GridElement[] = [];
    const a = c.posts[0];
    const b = c.posts[1] ?? a;
    const seamX = b === a ? a.x + a.w / 2 : a.x + a.w;
    const heroW = c.u * 0.78;
    const heroH = c.u * 0.95;
    els.push(c.el("shape", { name: "Hero arch", shape: "arch", fill: "secondary", opacity: 0.9, x: seamX - heroW * 0.55, y: a.y + c.ph - heroH * 1.02, w: heroW * 1.1, h: heroH * 1.05 }));
    els.push(c.el("gradient", { name: "Hero glow", kind: "radial", from: "accent", to: "transparent", opacity: 0.45, x: seamX - c.u * 0.55, y: a.y + c.ph * 0.25, w: c.u * 1.1, h: c.u * 0.8 }));
    els.push(
      c.el("image", {
        name: "Product hero (on seam)",
        role: "product",
        src: c.product,
        fit: "contain",
        x: seamX - heroW / 2,
        y: a.y + c.ph - heroH - c.ph * 0.04,
        w: heroW,
        h: heroH,
        shadow: { enabled: true, x: 0, y: Math.round(c.u * 0.03), blur: Math.round(c.u * 0.06), color: "rgba(0,0,0,0.35)" },
      }),
    );
    els.push(brandMark(c, a, p.brand.name, "left"));
    els.push(c.el("text", { name: "Promise", x: a.x + c.safe, y: a.y + c.ph * 0.14, w: a.w * 0.62, h: c.u * 0.4, text: c.copy(0).headline, fontSize: Math.round(c.u * 0.09), lineHeight: 1.02 }));
    if (b !== a) {
      els.push(c.el("text", { name: "Reveal line", x: b.x + b.w * 0.42, y: b.y + c.ph * 0.14, w: b.w * 0.58 - c.safe, h: c.u * 0.4, text: c.copy(1).headline, align: "right", fontSize: Math.round(c.u * 0.06), lineHeight: 1.1 }));
    }
    c.posts.slice(b === a ? 1 : 2).forEach((r) => {
      els.push(pager(c, r));
      els.push(...headlineBody(c, r, c.copy(r.index)));
    });
    if (c.posts.length > 2) els.push(cta(c, c.posts[c.last], c.copy(c.last).body || "Shop now"));
    return els;
  },

  timeline: (p) => {
    const c = ctx(p);
    const els: GridElement[] = [];
    const lineY = c.ph * 0.36;
    for (let row = 0; row < p.layout.rows; row++) {
      els.push(c.el("line", { name: `Timeline row ${row + 1}`, x: 0, y: row * c.ph + lineY - 4, w: c.W, h: 8, thickness: Math.max(3, Math.round(c.u * 0.004)), color: "accent" }));
    }
    c.posts.forEach((r) => {
      const d = c.u * 0.13;
      els.push(c.el("badge", { name: `Step ${r.index + 1}`, x: r.x + c.safe, y: r.y + lineY - d / 2, w: d, h: d, text: String(r.index + 1).padStart(2, "0"), fontSize: Math.round(d * 0.36), fill: "accent", color: "background", fontFamily: "body" }));
      els.push(c.el("text", { name: `Step label ${r.index + 1}`, x: r.x + c.safe, y: r.y + lineY - d / 2 - c.u * 0.09, w: r.w * 0.7, h: c.u * 0.05, text: (c.copy(r.index).role || "step").toUpperCase(), fontFamily: "body", fontSize: Math.round(c.u * 0.026), fontWeight: 700, letterSpacing: 0.14, color: "muted" }));
      els.push(...headlineBody(c, r, c.copy(r.index), { top: lineY + c.u * 0.13 }));
    });
    return els;
  },

  "quote-thread": (p) => {
    const c = ctx(p);
    const els: GridElement[] = [];
    els.push(c.el("line", { name: "Thread line", x: 0, y: c.ph * 0.5 - 4, w: c.W, h: 8, thickness: Math.max(2, Math.round(c.u * 0.003)), color: "accent", opacity: 0.6 }));
    c.posts.forEach((r) => {
      const cp = c.copy(r.index);
      els.push(
        c.el("quote", {
          name: `Quote ${r.index + 1}`,
          x: r.x + c.safe,
          y: r.y + c.ph * 0.18,
          w: r.w - c.safe * 2,
          h: c.ph * 0.64,
          text: cp.headline + (cp.body ? `\n${cp.body}` : ""),
          author: r.index === 0 ? p.brand.name : "",
          fontSize: Math.round(c.u * 0.052),
          radius: Math.round(c.u * 0.035),
          padding: Math.round(c.u * 0.07),
          shadow: { enabled: true, x: 0, y: Math.round(c.u * 0.02), blur: Math.round(c.u * 0.05), color: "rgba(0,0,0,0.12)" },
        }),
      );
      els.push(pager(c, r));
    });
    return els;
  },

  educational: (p) => {
    const c = ctx(p);
    const els: GridElement[] = [];
    // Alternate glows across seams = visual rhythm that pulls the swipe.
    for (let i = 0; i < c.posts.length - 1; i++) {
      const r = c.posts[i];
      if (c.posts[i + 1].row !== r.row) continue;
      els.push(c.el("gradient", { name: `Seam ${i + 1}|${i + 2}`, kind: "radial", from: "accent", to: "transparent", opacity: 0.22, x: r.x + r.w - c.u * 0.35, y: r.y + (i % 2 ? c.ph * 0.6 : -c.u * 0.1), w: c.u * 0.7, h: c.u * 0.7 }));
    }
    c.posts.forEach((r) => {
      const cp = c.copy(r.index);
      els.push(pager(c, r));
      if (r.index === 0) {
        els.push(brandMark(c, r, p.brand.name));
        els.push(c.el("text", { name: "Hook", x: r.x + c.safe, y: r.y + c.ph * 0.24, w: r.w - c.safe * 2, h: c.ph * 0.6, text: cp.headline, fontSize: Math.round(c.u * 0.13), lineHeight: 0.98, letterSpacing: -0.02 }));
        els.push(c.el("text", { name: "Swipe", x: r.x + c.safe, y: r.y + r.h - c.safe - c.u * 0.05, w: r.w - c.safe * 2, h: c.u * 0.05, text: "Swipe →", align: "right", fontFamily: "body", fontSize: Math.round(c.u * 0.03), fontWeight: 600, color: "accent" }));
        return;
      }
      if (r.index === c.last) {
        els.push(...headlineBody(c, r, cp, { top: c.ph * 0.3, size: Math.round(c.u * 0.09) }));
        els.push(cta(c, r, "Save this post"));
        return;
      }
      const big = c.u * 0.32;
      els.push(c.el("text", { name: `Big number ${r.index}`, x: r.x + r.w - c.safe - big * 1.3, y: r.y + c.safe * 0.6, w: big * 1.3, h: big, text: String(r.index).padStart(2, "0"), align: "right", fontSize: Math.round(big * 0.9), fontWeight: 800, color: "accent", opacity: 0.18, lineHeight: 1 }));
      els.push(...headlineBody(c, r, cp));
    });
    return els;
  },

  "puzzle-grid": (p) => {
    const c = ctx(p);
    const els: GridElement[] = [];
    const d = Math.min(c.W, c.H) * 0.82;
    const cx = c.W / 2;
    const cy = c.H / 2;
    els.push(c.el("shape", { name: "Center disc", shape: "ellipse", fill: "surface", opacity: 0.9, x: cx - d / 2, y: cy - d / 2, w: d, h: d }));
    els.push(c.el("shape", { name: "Orbit ring", shape: "ring", fill: "transparent", stroke: "accent", strokeWidth: Math.max(2, Math.round(c.u * 0.004)), x: cx - d * 0.6, y: cy - d * 0.6, w: d * 1.2, h: d * 1.2 }));
    els.push(c.el("line", { name: "Arc line", variant: "arc", x: 0, y: c.H * 0.08, w: c.W, h: c.H * 0.3, thickness: Math.max(2, Math.round(c.u * 0.004)), color: "accent", opacity: 0.7 }));
    els.push(c.el("line", { name: "Wave line", variant: "wave", x: 0, y: c.H * 0.78, w: c.W, h: c.u * 0.25, thickness: Math.max(2, Math.round(c.u * 0.003)), color: "secondary", opacity: 0.5 }));
    const heroW = Math.min(c.pw, c.ph) * 0.9;
    els.push(
      c.el("image", {
        name: "Center product",
        role: "product",
        src: c.product,
        fit: "contain",
        x: cx - heroW / 2,
        y: cy - heroW / 2,
        w: heroW,
        h: heroW,
        shadow: { enabled: true, x: 0, y: Math.round(c.u * 0.03), blur: Math.round(c.u * 0.07), color: "rgba(0,0,0,0.25)" },
      }),
    );
    els.push(c.el("text", { name: "Campaign headline", x: c.safe, y: c.safe * 1.6, w: c.W - c.safe * 2, h: c.u * 0.3, text: c.copy(0).headline, align: "center", fontSize: Math.round(c.u * 0.12), lineHeight: 1 }));
    els.push(brandMark(c, c.posts[0], p.brand.name));
    c.posts.forEach((r) => {
      const isCenter = Math.abs(r.x + r.w / 2 - cx) < 1 && Math.abs(r.y + r.h / 2 - cy) < 1;
      if (isCenter || r.row === 0) return;
      const cp = c.copy(r.index);
      els.push(c.el("text", { name: `Caption ${r.index + 1}`, x: r.x + c.safe, y: r.y + r.h - c.safe - c.u * 0.18, w: r.w - c.safe * 2, h: c.u * 0.18, text: cp.headline, fontFamily: "body", fontSize: Math.round(c.u * 0.04), fontWeight: 600, lineHeight: 1.2, align: r.col === 0 ? "left" : r.col === p.layout.cols - 1 ? "right" : "center" }));
    });
    return els;
  },
};

export function buildTemplate(p: Project, id: LayoutTemplateId): GridElement[] {
  return recipes[id](p)
    .filter((e) => !(e.type === "text" && !e.text.trim()))
    .map((e) => ({ ...e, x: Math.round(e.x), y: Math.round(e.y), w: Math.round(e.w), h: Math.round(e.h) }));
}
