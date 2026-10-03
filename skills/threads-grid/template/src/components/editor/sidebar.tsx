"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Circle, GripVertical, Image as ImageIcon, Minus, MousePointerClick, Quote, Square, SquareStack, Type, Upload, Hash, Sparkles, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { BRAND_COLOR_KEYS, LAYOUT_MODES, PLATFORM_PRESETS, STYLE_PRESETS, allFontOptions } from "@/lib/constants";
import { applyLayout, applyPreset, applyStyle } from "@/lib/defaults";
import { canvasSize, customFontFamily } from "@/lib/geometry";
import { uploadAsset } from "@/lib/storage";
import { useEditor, useProject } from "@/lib/store";
import { LAYOUT_TEMPLATES, buildTemplate, type LayoutTemplateId } from "@/lib/templates";
import type { CopyPost, ElementType, LayoutMode, PlatformPreset, Project } from "@/lib/types";
import { Button, ColorInput, Field, NumberInput, Section, Select, TextInput, Toggle, cn } from "../ui/controls";

type Tab = "design" | "brand" | "posts";

export function Sidebar() {
  const [tab, setTab] = useState<Tab>("design");
  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/60">
      <div className="flex border-b border-zinc-800 px-2 pt-2">
        {(["design", "brand", "posts"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("flex-1 border-b-2 pb-2 text-xs font-medium capitalize", tab === t ? "border-sky-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300")}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "design" ? <DesignTab /> : tab === "brand" ? <BrandTab /> : <PostsTab />}
      </div>
    </aside>
  );
}

const ADDABLE: { type: ElementType; label: string; icon: ReactNode; extra?: Record<string, unknown> }[] = [
  { type: "text", label: "Text", icon: <Type size={14} /> },
  { type: "image", label: "Image", icon: <ImageIcon size={14} /> },
  { type: "image", label: "Product", icon: <SquareStack size={14} />, extra: { role: "product", fit: "contain" } },
  { type: "shape", label: "Shape", icon: <Square size={14} /> },
  { type: "gradient", label: "Gradient", icon: <Sparkles size={14} /> },
  { type: "line", label: "Line", icon: <Minus size={14} /> },
  { type: "badge", label: "Badge", icon: <Hash size={14} /> },
  { type: "quote", label: "Quote", icon: <Quote size={14} /> },
  { type: "cta", label: "CTA", icon: <MousePointerClick size={14} /> },
  { type: "image", label: "Mockup", icon: <Circle size={14} />, extra: { role: "screenshot", frame: "phone", fit: "cover" } },
];

function DesignTab() {
  const project = useProject();
  const setProject = useEditor((s) => s.setProject);
  const addElement = useEditor((s) => s.addElement);
  const view = useEditor((s) => s.view);
  const [template, setTemplate] = useState<LayoutTemplateId>("connected-headline");
  const total = project.layout.rows * project.layout.cols;
  const { width: W, height: H } = canvasSize(project);
  const targetPost = view.kind === "post" ? view.index : 0;

  return (
    <>
      <Section title="Project">
        <Field label="Project name">
          <TextInput value={project.name} onChange={(v) => setProject((p) => ({ ...p, name: v }), { record: false })} />
        </Field>
      </Section>

      <Section title="Platform">
        <Select
          value={project.preset}
          onChange={(v: PlatformPreset) => setProject((p) => applyPreset(p, v))}
          options={(Object.keys(PLATFORM_PRESETS) as PlatformPreset[]).map((k) => ({ value: k, label: `${PLATFORM_PRESETS[k].label} — ${k === "custom" ? "custom" : `${PLATFORM_PRESETS[k].width}×${PLATFORM_PRESETS[k].height}`}` }))}
        />
        {project.preset === "custom" ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Width">
              <NumberInput value={project.post.width} min={100} max={4000} onChange={(v) => setProject((p) => applyPreset(p, "custom", { width: v, height: p.post.height }))} suffix="px" />
            </Field>
            <Field label="Height">
              <NumberInput value={project.post.height} min={100} max={4000} onChange={(v) => setProject((p) => applyPreset(p, "custom", { width: p.post.width, height: v }))} suffix="px" />
            </Field>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500">{PLATFORM_PRESETS[project.preset].hint}</p>
        )}
      </Section>

      <Section title="Grid layout">
        <Select value={project.layout.mode} onChange={(v: LayoutMode) => setProject((p) => applyLayout(p, v))} options={(Object.keys(LAYOUT_MODES) as LayoutMode[]).map((k) => ({ value: k, label: LAYOUT_MODES[k].label }))} />
        {project.layout.mode === "carousel" ? (
          <Field label="Number of posts (3–10)">
            <NumberInput value={project.layout.cols} min={3} max={10} onChange={(v) => setProject((p) => applyLayout(p, "carousel", { cols: v }))} />
          </Field>
        ) : null}
        {project.layout.mode === "vertical" ? (
          <Field label="Number of posts">
            <NumberInput value={project.layout.rows} min={2} max={10} onChange={(v) => setProject((p) => applyLayout(p, "vertical", { rows: v }))} />
          </Field>
        ) : null}
        {project.layout.mode === "custom" ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Rows">
              <NumberInput value={project.layout.rows} min={1} max={10} onChange={(v) => setProject((p) => applyLayout(p, "custom", { rows: v, cols: p.layout.cols }))} />
            </Field>
            <Field label="Columns">
              <NumberInput value={project.layout.cols} min={1} max={10} onChange={(v) => setProject((p) => applyLayout(p, "custom", { rows: p.layout.rows, cols: v }))} />
            </Field>
          </div>
        ) : null}
        <p className="text-[11px] text-zinc-500">
          {total} posts · canvas {W}×{H}px
        </p>
      </Section>

      <Section title="Style preset">
        <div className="grid grid-cols-1 gap-1">
          {STYLE_PRESETS.map((s) => (
            <button
              key={s.id}
              onClick={() => setProject((p) => applyStyle(p, s.id))}
              className={cn("flex items-center gap-2 rounded-md border px-2 py-1.5 text-left", project.style === s.id ? "border-sky-500 bg-sky-500/10" : "border-zinc-800 hover:border-zinc-600")}
            >
              <span className="flex shrink-0">
                {(["background", "primary", "accent", "text"] as const).map((k) => (
                  <span key={k} className="-ml-1 h-4 w-4 rounded-full border border-zinc-900 first:ml-0" style={{ background: s.colors[k] }} />
                ))}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs text-zinc-100">{s.label}</span>
                <span className="block truncate text-[10px] text-zinc-500">{s.description}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">Applies palette, fonts and background. Elements using brand tokens re-theme automatically.</p>
      </Section>

      <Section title="Layout template">
        <Select value={template} onChange={setTemplate} options={LAYOUT_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))} />
        <p className="text-[11px] text-zinc-500">{LAYOUT_TEMPLATES.find((t) => t.id === template)?.hint}</p>
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            if (project.elements.length && !confirm("Replace all elements with this template? (Undo with ⌘Z)")) return;
            setProject((p) => ({ ...p, elements: buildTemplate(p, template) }));
          }}
        >
          Apply template
        </Button>
      </Section>

      <Section title={`Add element → post ${targetPost + 1}`}>
        <div className="grid grid-cols-2 gap-1">
          {ADDABLE.map((a) => (
            <Button key={a.label} size="sm" variant="secondary" className="justify-start" onClick={() => addElement(a.type, targetPost, a.extra)}>
              {a.icon}
              {a.label}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Guides">
        <Toggle label="Post boundaries" checked={project.guides.showBoundaries} onChange={(v) => setProject((p) => ({ ...p, guides: { ...p.guides, showBoundaries: v } }))} />
        <Toggle label="Safe area" checked={project.guides.showSafeArea} onChange={(v) => setProject((p) => ({ ...p, guides: { ...p.guides, showSafeArea: v } }))} />
        <Toggle label="Snap (seams, centers, safe area, grid)" checked={project.guides.snap} onChange={(v) => setProject((p) => ({ ...p, guides: { ...p.guides, snap: v } }))} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Safe inset">
            <NumberInput value={project.guides.safeArea} min={0} max={30} onChange={(v) => setProject((p) => ({ ...p, guides: { ...p.guides, safeArea: v } }))} suffix="%" />
          </Field>
          <Field label="Grid">
            <NumberInput value={project.guides.gridSize} min={1} max={200} onChange={(v) => setProject((p) => ({ ...p, guides: { ...p.guides, gridSize: v } }))} suffix="px" />
          </Field>
        </div>
      </Section>

      <ExportSettings />
    </>
  );
}

function ExportSettings() {
  const project = useProject();
  const setProject = useEditor((s) => s.setProject);
  const ex = project.export;
  const setEx = (patch: Partial<Project["export"]>) => setProject((p) => ({ ...p, export: { ...p.export, ...patch } }));
  return (
    <Section title="Export">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Format">
          <Select value={ex.format} onChange={(v) => setEx({ format: v })} options={[{ value: "png", label: "PNG (lossless)" }, { value: "jpeg", label: "JPG" }, { value: "webp", label: "WebP" }]} />
        </Field>
        <Field label="Scale">
          <Select value={String(ex.scale)} onChange={(v) => setEx({ scale: Number(v) })} options={[1, 2, 3].map((n) => ({ value: String(n), label: n === 1 ? "1× (exact)" : `${n}× master` }))} />
        </Field>
        {ex.format !== "png" ? (
          <Field label="Quality">
            <NumberInput value={Math.round(ex.quality * 100)} min={10} max={100} onChange={(v) => setEx({ quality: v / 100 })} suffix="%" />
          </Field>
        ) : null}
        <Field label="File name" className={ex.format !== "png" ? "" : "col-span-2"}>
          <TextInput value={ex.fileBase} onChange={(v) => setEx({ fileBase: v.replace(/[^\w.-]+/g, "-") || "threads-grid" })} />
        </Field>
      </div>
      <Select
        value={ex.order}
        onChange={(v) => setEx({ order: v })}
        options={[
          { value: "reading", label: "Numbering: reading order (01 = top-left)" },
          { value: "posting", label: "Numbering: posting order (profile grids)" },
        ]}
      />
      <Toggle label="Include stitched preview" checked={ex.includePreview} onChange={(v) => setEx({ includePreview: v })} />
      <Toggle label="Include project JSON" checked={ex.includeProjectJson} onChange={(v) => setEx({ includeProjectJson: v })} />
      <p className="text-[11px] text-zinc-500">
        Output: {ex.fileBase}-01.{ex.format === "jpeg" ? "jpg" : ex.format} … at {project.post.width * ex.scale}×{project.post.height * ex.scale}px
      </p>
    </Section>
  );
}

function BrandTab() {
  const project = useProject();
  const setProject = useEditor((s) => s.setProject);
  const [busy, setBusy] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const assetInput = useRef<HTMLInputElement>(null);
  const fontInput = useRef<HTMLInputElement>(null);
  const [assetRole, setAssetRole] = useState("product");
  const setBrand = (patch: Partial<Project["brand"]>) => setProject((p) => ({ ...p, brand: { ...p.brand, ...patch } }), { record: false });

  const upload = async (files: FileList | null, role: string) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const up = await uploadAsset(f);
        setProject((p) => ({
          ...p,
          brand: role === "logo" ? { ...p.brand, logo: up.path } : p.brand,
          assets: p.assets.some((a) => a.path === up.path) ? p.assets : [...p.assets, { id: up.path, path: up.path, name: up.name, role }],
        }));
      }
    } finally {
      setBusy(false);
    }
  };

  const uploadFonts = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const up = await uploadAsset(f);
        const label = f.name.replace(/\.(ttf|otf|woff2?)$/i, "").replace(/[-_]+/g, " ");
        const id = `custom-${up.path.split("/").pop()!.split(".")[0].slice(0, 8)}`;
        const italic = /italic/i.test(f.name);
        const vietnamese = await coversVietnamese(up.path);
        setProject((p) =>
          p.brand.customFonts.some((c) => c.id === id)
            ? p
            : { ...p, brand: { ...p.brand, customFonts: [...p.brand.customFonts, { id, label, path: up.path, weight: "100 900", style: italic ? "italic" : "normal", vietnamese }] } },
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Section title="Brand">
        <Field label="Brand name">
          <TextInput value={project.brand.name} onChange={(v) => setBrand({ name: v })} />
        </Field>
        <div className="flex items-center gap-2">
          <div className="grid h-12 w-20 place-items-center rounded border border-zinc-800 bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[length:12px_12px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {project.brand.logo ? <img src={project.brand.logo} alt="logo" className="max-h-10 max-w-18 object-contain" /> : <span className="text-[10px] text-zinc-500">no logo</span>}
          </div>
          <Button size="sm" onClick={() => logoInput.current?.click()} disabled={busy}>
            <Upload size={13} /> Logo
          </Button>
          <input ref={logoInput} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files, "logo")} />
        </div>
      </Section>

      <Section title="Brand colors">
        {BRAND_COLOR_KEYS.map((k) => (
          <Field key={k} label={k}>
            <ColorInput value={project.brand.colors[k]} resolved={project.brand.colors[k]} onChange={(v) => setBrand({ colors: { ...project.brand.colors, [k]: v } })} />
          </Field>
        ))}
      </Section>

      <Section title="Brand fonts">
        {(["heading", "body"] as const).map((k) => (
          <Field key={k} label={k}>
            <Select value={project.brand.fonts[k]} onChange={(v) => setBrand({ fonts: { ...project.brand.fonts, [k]: v } })} options={allFontOptions(project.brand).map((f) => ({ value: f.id, label: f.label }))} />
          </Field>
        ))}
        <p className="text-[11px] text-zinc-500">All bundled fonts include full Vietnamese glyphs. Uploaded fonts must contain them too.</p>
        <Button size="sm" className="w-full" onClick={() => fontInput.current?.click()} disabled={busy}>
          <Upload size={13} /> Upload brand font (.ttf .otf .woff .woff2)
        </Button>
        <input ref={fontInput} type="file" accept=".ttf,.otf,.woff,.woff2" multiple hidden onChange={(e) => uploadFonts(e.target.files)} />
        {project.brand.customFonts.map((f) => (
          <div key={f.id} className="flex items-center gap-2 rounded border border-zinc-800 px-2 py-1">
            <span className="flex-1 truncate text-sm" style={{ fontFamily: `"${customFontFamily(f.id)}"` }}>
              {f.label} — Tinh hoa Việt
            </span>
            {f.vietnamese === false ? (
              <span title="This font is missing Vietnamese glyphs (ầ ữ ợ đ…). They will render in a fallback font." className="rounded bg-amber-500/15 px-1 text-[10px] text-amber-300">
                no VI
              </span>
            ) : null}
            <button
              title="Remove font"
              className="text-zinc-500 hover:text-red-300"
              onClick={() => setProject((p) => ({ ...p, brand: { ...p.brand, customFonts: p.brand.customFonts.filter((c) => c.id !== f.id) } }))}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </Section>

      <Section title={`Assets (${project.assets.length})`}>
        <div className="flex gap-2">
          <Select value={assetRole} onChange={setAssetRole} options={["product", "image", "screenshot", "texture", "logo"].map((r) => ({ value: r, label: r }))} />
          <Button size="sm" className="shrink-0" onClick={() => assetInput.current?.click()} disabled={busy}>
            <Upload size={13} /> {busy ? "Uploading…" : "Upload"}
          </Button>
          <input ref={assetInput} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files, assetRole)} />
        </div>
        <p className="text-[11px] text-zinc-500">Or drag images straight onto the canvas. Saved to public/uploads/.</p>
        <AssetGrid />
      </Section>
    </>
  );
}

function AssetGrid() {
  const project = useProject();
  const addElement = useEditor((s) => s.addElement);
  const view = useEditor((s) => s.view);
  const postIndex = view.kind === "post" ? view.index : 0;
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {project.assets.map((a) => (
        <button
          key={a.id}
          title={`${a.name} (${a.role}) — click to add`}
          onClick={() => addElement("image", postIndex, { src: a.path, role: a.role === "logo" ? "logo" : a.role === "product" ? "product" : a.role === "screenshot" ? "screenshot" : "image", fit: a.role === "texture" ? "cover" : "contain", name: a.name })}
          className="relative aspect-square overflow-hidden rounded border border-zinc-800 bg-zinc-950 hover:border-sky-500"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.path} alt={a.name} className="h-full w-full object-contain" />
          <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 text-[9px] text-zinc-300">{a.role}</span>
        </button>
      ))}
    </div>
  );
}

function PostsTab() {
  const project = useProject();
  const setProject = useEditor((s) => s.setProject);
  const movePost = useEditor((s) => s.movePost);
  const total = project.layout.rows * project.layout.cols;
  const posts = Array.from({ length: total }, (_, i) => project.copyPlan.posts[i] ?? { role: "", headline: "", body: "", notes: "" });
  const ids = posts.map((_, i) => `post-${i}`);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const setPost = (i: number, patch: Partial<CopyPost>) =>
    setProject(
      (p) => {
        const next = Array.from({ length: Math.max(total, p.copyPlan.posts.length) }, (_, j) => p.copyPlan.posts[j] ?? { role: "", headline: "", body: "", notes: "" });
        next[i] = { ...next[i], ...patch };
        return { ...p, copyPlan: { ...p.copyPlan, posts: next } };
      },
      { record: false },
    );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    movePost(ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
  };

  return (
    <>
      <Section title="Copy plan">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Structure">
            <Select value={project.copyPlan.structure || "carousel"} onChange={(v) => setProject((p) => ({ ...p, copyPlan: { ...p.copyPlan, structure: v } }))} options={["carousel", "product-launch", "educational"].map((x) => ({ value: x, label: x }))} />
          </Field>
          <Field label="Language">
            <Select value={project.copyPlan.language} onChange={(v) => setProject((p) => ({ ...p, copyPlan: { ...p.copyPlan, language: v } }))} options={[{ value: "en", label: "English" }, { value: "vi", label: "Tiếng Việt" }]} />
          </Field>
        </div>
        <Field label="Caption (exported to POSTING-ORDER.txt)">
          <TextInput multiline value={project.copyPlan.caption} onChange={(v) => setProject((p) => ({ ...p, copyPlan: { ...p.copyPlan, caption: v } }), { record: false })} />
        </Field>
        <p className="text-[11px] text-zinc-500">Drag ⋮⋮ to reorder posts: elements that sit fully inside a post move with it; elements crossing seams stay in place. Layout templates read headlines from here.</p>
      </Section>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {posts.map((cp, i) => (
            <SortablePost key={ids[i]} id={ids[i]} index={i} cp={cp} setPost={setPost} />
          ))}
        </SortableContext>
      </DndContext>
    </>
  );
}

function SortablePost({ id, index: i, cp, setPost }: { id: string; index: number; cp: CopyPost; setPost: (i: number, patch: Partial<CopyPost>) => void }) {
  const view = useEditor((s) => s.view);
  const setView = useEditor((s) => s.setView);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const active = view.kind === "post" && view.index === i;
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, position: "relative" }} className={isDragging ? "bg-zinc-900 shadow-xl" : ""}>
      <Section
        title={`Post ${String(i + 1).padStart(2, "0")}${cp.role ? ` · ${cp.role}` : ""}`}
        action={
          <div className="flex items-center gap-2">
            <button className={cn("text-[11px]", active ? "text-sky-400" : "text-zinc-500 hover:text-zinc-300")} onClick={() => setView(active ? { kind: "grid" } : { kind: "post", index: i })}>
              {active ? "viewing" : "preview"}
            </button>
            <button className="cursor-grab text-zinc-500 hover:text-zinc-200 active:cursor-grabbing" title="Drag to reorder post" {...attributes} {...listeners}>
              <GripVertical size={14} />
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          <Field label="Role">
            <TextInput value={cp.role} onChange={(v) => setPost(i, { role: v })} placeholder="hook" />
          </Field>
          <Field label="Headline" className="col-span-2">
            <TextInput value={cp.headline} onChange={(v) => setPost(i, { headline: v })} />
          </Field>
        </div>
        <Field label="Body">
          <TextInput multiline value={cp.body} onChange={(v) => setPost(i, { body: v })} />
        </Field>
      </Section>
    </div>
  );
}

const VI_SAMPLE = "ầẩẫấậằẳẵắặềểễếệồổỗốộờởỡớợừửữứựỳỷỹýỵđĐƯƠươ";

/**
 * Does the font contain Vietnamese glyphs? Measures the sample with two different
 * fallback stacks: if any glyph is missing, the fallback differs and so do the widths.
 */
async function coversVietnamese(path: string): Promise<boolean | undefined> {
  try {
    const face = new FontFace("tg-glyph-probe", `url("${path}")`);
    await face.load();
    document.fonts.add(face);
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return undefined;
    const width = (fallback: string) => {
      ctx.font = `48px "tg-glyph-probe", ${fallback}`;
      return [...VI_SAMPLE].map((ch) => ctx.measureText(ch).width);
    };
    const a = width("monospace");
    const b = width("serif");
    document.fonts.delete(face);
    return a.every((w, i) => Math.abs(w - b[i]) < 0.01);
  } catch {
    return undefined;
  }
}
