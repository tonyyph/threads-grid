"use client";

import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalSpaceAround, AlignStartHorizontal, AlignStartVertical, AlignVerticalSpaceAround, ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, Copy, Eye, EyeOff, Lock, Trash2, Unlock } from "lucide-react";
import type { ReactNode } from "react";
import { BLEND_MODES, FONT_OPTIONS, allFontOptions } from "@/lib/constants";
import { postsTouchedBy, resolveColor } from "@/lib/geometry";
import { useEditor, useProject, type AlignMode } from "@/lib/store";
import type { BlendMode, GridElement, Project } from "@/lib/types";
import { Button, ColorInput, Field, NumberInput, Section, Select, Slider, TextInput, Toggle } from "../ui/controls";

/**
 * Every inspector edit is applied with record:false; one undo checkpoint is taken
 * when an interaction starts (pointer down / focus), so a slider drag = one undo step.
 */
export function Inspector() {
  const project = useProject();
  const selectedId = useEditor((s) => s.selectedId);
  const count = useEditor((s) => s.selectedIds.length);
  const checkpoint = useEditor((s) => s.checkpoint);
  const el = project.elements.find((e) => e.id === selectedId);
  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-900/60" onPointerDownCapture={checkpoint} onFocusCapture={checkpoint}>
      {count > 1 ? <MultiInspector count={count} /> : el ? <ElementInspector el={el} project={project} /> : <CanvasInspector project={project} />}
    </aside>
  );
}

const TYPE_LABEL: Record<GridElement["type"], string> = {
  text: "Text",
  image: "Image",
  shape: "Shape",
  gradient: "Gradient block",
  line: "Decorative line",
  badge: "Number badge",
  quote: "Quote block",
  cta: "CTA block",
};

function ElementInspector({ el, project }: { el: GridElement; project: Project }) {
  const updateElement = useEditor((s) => s.updateElement);
  const reorder = useEditor((s) => s.reorder);
  const duplicate = useEditor((s) => s.duplicateElement);
  const remove = useEditor((s) => s.removeElement);
  const set = (patch: Partial<GridElement>) => updateElement(el.id, patch, { record: false });
  // Typed escape hatch for type-specific fields.
  const setAny = (patch: Record<string, unknown>) => set(patch as Partial<GridElement>);
  const tokens = project.brand.colors as unknown as Record<string, string>;
  const color = (label: string, key: string, value: string) => (
    <Field label={label}>
      <ColorInput value={value} resolved={resolveColor(value, project.brand)} tokens={tokens} onChange={(v) => setAny({ [key]: v })} />
    </Field>
  );
  const touched = postsTouchedBy(project, el);

  return (
    <>
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">{TYPE_LABEL[el.type]}</div>
          <input className="w-full truncate bg-transparent text-sm font-medium text-white outline-none" value={el.name ?? ""} placeholder="Unnamed" onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="flex gap-0.5">
          <Button size="icon" variant="ghost" title={el.locked ? "Unlock" : "Lock"} onClick={() => set({ locked: !el.locked })}>
            {el.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </Button>
          <Button size="icon" variant="ghost" title={el.hidden ? "Show" : "Hide"} onClick={() => set({ hidden: !el.hidden })}>
            {el.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </Button>
          <Button size="icon" variant="ghost" title="Duplicate (⌘D)" onClick={() => duplicate(el.id)}>
            <Copy size={14} />
          </Button>
          <Button size="icon" variant="ghost" title="Delete (⌫)" onClick={() => remove(el.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="px-4 pt-2 text-[11px] text-zinc-500">
        Spans post{touched.length > 1 ? "s" : ""} {touched.map((i) => i + 1).join(", ") || "— (off canvas)"}
        {touched.length > 1 ? " · cropped per post on export" : ""}
      </div>

      {el.type === "text" || el.type === "badge" || el.type === "quote" || el.type === "cta" ? (
        <Section title="Content">
          <TextInput multiline={el.type !== "badge" && el.type !== "cta"} value={el.text} onChange={(v) => setAny({ text: v })} />
          {el.type === "quote" ? (
            <Field label="Author">
              <TextInput value={el.author} onChange={(v) => setAny({ author: v })} />
            </Field>
          ) : null}
        </Section>
      ) : null}

      <Section title="Transform">
        <div className="grid grid-cols-2 gap-2">
          <Field label="X">
            <NumberInput value={el.x} onChange={(v) => set({ x: v })} suffix="px" />
          </Field>
          <Field label="Y">
            <NumberInput value={el.y} onChange={(v) => set({ y: v })} suffix="px" />
          </Field>
          <Field label="Width">
            <NumberInput value={el.w} min={1} onChange={(v) => set({ w: v })} suffix="px" />
          </Field>
          <Field label="Height">
            <NumberInput value={el.h} min={1} onChange={(v) => set({ h: v })} suffix="px" />
          </Field>
        </div>
        <Field label="Rotation">
          <Slider value={el.rotation} min={-180} max={180} onChange={(v) => set({ rotation: v })} />
        </Field>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" title="Bring to front" onClick={() => reorder(el.id, "top")}>
            <ChevronsUp size={14} />
          </Button>
          <Button size="sm" variant="ghost" title="Forward" onClick={() => reorder(el.id, "up")}>
            <ArrowUp size={14} />
          </Button>
          <Button size="sm" variant="ghost" title="Backward" onClick={() => reorder(el.id, "down")}>
            <ArrowDown size={14} />
          </Button>
          <Button size="sm" variant="ghost" title="Send to back" onClick={() => reorder(el.id, "bottom")}>
            <ChevronsDown size={14} />
          </Button>
          <span className="ml-auto self-center text-[11px] text-zinc-500">layer {project.elements.findIndex((e) => e.id === el.id) + 1}</span>
        </div>
      </Section>

      {"fontFamily" in el ? (
        <Section title="Typography">
          <Field label="Font">
            <Select
              value={el.fontFamily}
              onChange={(v) => setAny({ fontFamily: v })}
              options={[
                { value: "heading", label: `Brand heading (${fontLabel(project.brand.fonts.heading)})` },
                { value: "body", label: `Brand body (${fontLabel(project.brand.fonts.body)})` },
                ...allFontOptions(project.brand).map((f) => ({ value: f.id, label: f.label })),
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Size">
              <NumberInput value={el.fontSize} min={4} onChange={(v) => setAny({ fontSize: v })} suffix="px" />
            </Field>
            <Field label="Weight">
              <Select value={String(el.fontWeight)} onChange={(v) => setAny({ fontWeight: Number(v) })} options={[300, 400, 500, 600, 700, 800, 900].map((w) => ({ value: String(w), label: String(w) }))} />
            </Field>
            <Field label="Line height">
              <NumberInput value={el.lineHeight} step={0.05} onChange={(v) => setAny({ lineHeight: v })} />
            </Field>
            <Field label="Tracking">
              <NumberInput value={el.letterSpacing} step={0.01} onChange={(v) => setAny({ letterSpacing: v })} suffix="em" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Align">
              <Select value={el.align} onChange={(v) => setAny({ align: v })} options={["left", "center", "right"].map((a) => ({ value: a, label: a }))} />
            </Field>
            {el.type === "text" ? (
              <Field label="Vertical">
                <Select value={el.verticalAlign} onChange={(v) => setAny({ verticalAlign: v })} options={["top", "center", "bottom"].map((a) => ({ value: a, label: a }))} />
              </Field>
            ) : null}
          </div>
          <div className="flex gap-4">
            <Toggle label="Italic" checked={el.italic} onChange={(v) => setAny({ italic: v })} />
            <Toggle label="UPPERCASE" checked={el.uppercase} onChange={(v) => setAny({ uppercase: v })} />
          </div>
          {color("Text color", "color", el.color)}
        </Section>
      ) : null}

      <TypeSpecific el={el} setAny={setAny} color={color} />

      <Section title="Appearance">
        <Field label="Opacity">
          <Slider value={el.opacity} min={0} max={1} step={0.01} onChange={(v) => set({ opacity: v })} />
        </Field>
        <Field label="Corner radius">
          <Slider value={el.radius} min={0} max={Math.round(Math.min(el.w, el.h) / 2)} onChange={(v) => set({ radius: v })} />
        </Field>
        <Field label="Blur">
          <Slider value={el.blur} min={0} max={120} onChange={(v) => set({ blur: v })} />
        </Field>
        <Field label="Blend mode">
          <Select value={el.blendMode} onChange={(v) => set({ blendMode: v as BlendMode })} options={BLEND_MODES.map((m) => ({ value: m, label: m }))} />
        </Field>
        <Toggle label="Shadow" checked={el.shadow.enabled} onChange={(v) => set({ shadow: { ...el.shadow, enabled: v } })} />
        {el.shadow.enabled ? (
          <div className="grid grid-cols-3 gap-2">
            <Field label="X">
              <NumberInput value={el.shadow.x} onChange={(v) => set({ shadow: { ...el.shadow, x: v } })} />
            </Field>
            <Field label="Y">
              <NumberInput value={el.shadow.y} onChange={(v) => set({ shadow: { ...el.shadow, y: v } })} />
            </Field>
            <Field label="Blur">
              <NumberInput value={el.shadow.blur} min={0} onChange={(v) => set({ shadow: { ...el.shadow, blur: v } })} />
            </Field>
            <Field label="Color" className="col-span-3">
              <ColorInput value={el.shadow.color} resolved={resolveColor(el.shadow.color, project.brand)} onChange={(v) => set({ shadow: { ...el.shadow, color: v } })} />
            </Field>
          </div>
        ) : null}
      </Section>
    </>
  );
}

function TypeSpecific({ el, setAny, color }: { el: GridElement; setAny: (p: Record<string, unknown>) => void; color: (label: string, key: string, value: string) => ReactNode }) {
  const project = useProject();
  switch (el.type) {
    case "text":
      return (
        <Section title="Box">
          {color("Background", "background", el.background)}
          <Field label="Padding">
            <NumberInput value={el.padding} min={0} onChange={(v) => setAny({ padding: v })} suffix="px" />
          </Field>
        </Section>
      );
    case "image":
      return (
        <Section title="Image">
          <Field label="Source">
            <Select
              value={el.src}
              onChange={(v) => setAny({ src: v })}
              options={[{ value: "", label: "— none —" }, ...project.assets.map((a) => ({ value: a.path, label: a.name || a.path })), ...(el.src && !project.assets.some((a) => a.path === el.src) ? [{ value: el.src, label: el.src }] : [])]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Role">
              <Select value={el.role} onChange={(v) => setAny({ role: v })} options={["image", "logo", "product", "screenshot", "texture"].map((x) => ({ value: x, label: x }))} />
            </Field>
            <Field label="Fit / crop">
              <Select value={el.fit} onChange={(v) => setAny({ fit: v })} options={["cover", "contain", "fill"].map((x) => ({ value: x, label: x }))} />
            </Field>
            <Field label="Mask">
              <Select value={el.mask} onChange={(v) => setAny({ mask: v })} options={["none", "circle", "arch", "rounded", "pill"].map((x) => ({ value: x, label: x }))} />
            </Field>
            <Field label="Frame">
              <Select value={el.frame} onChange={(v) => setAny({ frame: v })} options={["none", "phone", "browser"].map((x) => ({ value: x, label: x }))} />
            </Field>
          </div>
          <Field label="Crop zoom">
            <Slider value={el.zoom} min={1} max={5} step={0.05} onChange={(v) => setAny({ zoom: v })} />
          </Field>
          {el.fit === "cover" || el.zoom > 1 ? (
            <>
              <Field label="Crop focus X">
                <Slider value={el.focusX} min={0} max={100} onChange={(v) => setAny({ focusX: v })} />
              </Field>
              <Field label="Crop focus Y">
                <Slider value={el.focusY} min={0} max={100} onChange={(v) => setAny({ focusY: v })} />
              </Field>
            </>
          ) : null}
        </Section>
      );
    case "shape":
      return (
        <Section title="Shape">
          <Field label="Kind">
            <Select value={el.shape} onChange={(v) => setAny({ shape: v })} options={["rect", "ellipse", "pill", "arch", "ring"].map((x) => ({ value: x, label: x }))} />
          </Field>
          {color("Fill", "fill", el.fill)}
          {color("Stroke", "stroke", el.stroke)}
          <Field label="Stroke width">
            <Slider value={el.strokeWidth} min={0} max={40} onChange={(v) => setAny({ strokeWidth: v })} />
          </Field>
        </Section>
      );
    case "gradient":
      return (
        <Section title="Gradient">
          <Field label="Kind">
            <Select value={el.kind} onChange={(v) => setAny({ kind: v })} options={["linear", "radial"].map((x) => ({ value: x, label: x }))} />
          </Field>
          {color("From", "from", el.from)}
          {color("To", "to", el.to)}
          {el.kind === "linear" ? (
            <Field label="Angle">
              <Slider value={el.angle} min={0} max={360} onChange={(v) => setAny({ angle: v })} />
            </Field>
          ) : null}
        </Section>
      );
    case "line":
      return (
        <Section title="Line">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Path">
              <Select value={el.variant} onChange={(v) => setAny({ variant: v })} options={["straight", "arc", "wave"].map((x) => ({ value: x, label: x }))} />
            </Field>
            <Field label="Dash">
              <Select value={el.dash} onChange={(v) => setAny({ dash: v })} options={["solid", "dashed", "dotted"].map((x) => ({ value: x, label: x }))} />
            </Field>
          </div>
          <Field label="Thickness">
            <Slider value={el.thickness} min={1} max={40} onChange={(v) => setAny({ thickness: v })} />
          </Field>
          {color("Color", "color", el.color)}
        </Section>
      );
    case "badge":
      return (
        <Section title="Badge">
          <Field label="Shape">
            <Select value={el.shape} onChange={(v) => setAny({ shape: v })} options={["circle", "pill", "square"].map((x) => ({ value: x, label: x }))} />
          </Field>
          {color("Fill", "fill", el.fill)}
        </Section>
      );
    case "quote":
      return (
        <Section title="Card">
          {color("Card fill", "fill", el.fill)}
          {color("Accent", "accent", el.accent)}
          <Field label="Padding">
            <NumberInput value={el.padding} min={0} onChange={(v) => setAny({ padding: v })} suffix="px" />
          </Field>
        </Section>
      );
    case "cta":
      return (
        <Section title="Button">
          {color("Fill", "fill", el.fill)}
          <Toggle label="Arrow" checked={el.arrow} onChange={(v) => setAny({ arrow: v })} />
        </Section>
      );
  }
}

function fontLabel(id: string) {
  return FONT_OPTIONS.find((f) => f.id === id)?.label ?? id;
}

const ALIGN: { mode: AlignMode; icon: ReactNode; label: string }[] = [
  { mode: "left", icon: <AlignStartVertical size={15} />, label: "Align left" },
  { mode: "hcenter", icon: <AlignCenterVertical size={15} />, label: "Align horizontal centers" },
  { mode: "right", icon: <AlignEndVertical size={15} />, label: "Align right" },
  { mode: "top", icon: <AlignStartHorizontal size={15} />, label: "Align top" },
  { mode: "vcenter", icon: <AlignCenterHorizontal size={15} />, label: "Align vertical centers" },
  { mode: "bottom", icon: <AlignEndHorizontal size={15} />, label: "Align bottom" },
];

function MultiInspector({ count }: { count: number }) {
  const align = useEditor((s) => s.alignSelected);
  const distribute = useEditor((s) => s.distributeSelected);
  const duplicate = useEditor((s) => s.duplicateSelected);
  const remove = useEditor((s) => s.removeSelected);
  const select = useEditor((s) => s.select);
  return (
    <>
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Selection</div>
          <div className="text-sm font-medium text-white">{count} elements</div>
        </div>
        <div className="flex gap-0.5">
          <Button size="icon" variant="ghost" title="Duplicate (⌘D)" onClick={duplicate}>
            <Copy size={14} />
          </Button>
          <Button size="icon" variant="ghost" title="Delete (⌫)" onClick={remove}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      {(["selection", "post"] as const).map((to) => (
        <Section key={to} title={to === "selection" ? "Align to selection" : "Align to post safe area"}>
          <div className="flex gap-1">
            {ALIGN.map((a) => (
              <Button key={a.mode} size="icon" variant="secondary" title={a.label} onClick={() => align(a.mode, to)}>
                {a.icon}
              </Button>
            ))}
          </div>
        </Section>
      ))}
      <Section title="Distribute (3+)">
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" disabled={count < 3} onClick={() => distribute("x")}>
            <AlignHorizontalSpaceAround size={14} /> Horizontal
          </Button>
          <Button size="sm" variant="secondary" disabled={count < 3} onClick={() => distribute("y")}>
            <AlignVerticalSpaceAround size={14} /> Vertical
          </Button>
        </div>
      </Section>
      <p className="px-4 py-3 text-[11px] leading-relaxed text-zinc-500">
        Drag any selected element to move the group. Arrows nudge (⇧ = 10px). Shift/⌘-click toggles, drag on empty canvas to marquee-select, ⌘A selects all. <button className="text-sky-400" onClick={() => select(null)}>Clear</button>
      </p>
    </>
  );
}

function CanvasInspector({ project }: { project: Project }) {
  const setProject = useEditor((s) => s.setProject);
  const select = useEditor((s) => s.select);
  const bg = project.background;
  const setBg = (patch: Partial<Project["background"]>) => setProject((p) => ({ ...p, background: { ...p.background, ...patch } }), { record: false });
  const tokens = project.brand.colors as unknown as Record<string, string>;
  const colorField = (label: string, key: "color" | "from" | "to") => (
    <Field label={label}>
      <ColorInput value={bg[key]} resolved={resolveColor(bg[key], project.brand)} tokens={tokens} onChange={(v) => setBg({ [key]: v })} />
    </Field>
  );
  return (
    <>
      <Section title="Connected background">
        <Field label="Type">
          <Select value={bg.type} onChange={(v) => setBg({ type: v })} options={(["solid", "linear", "radial", "image"] as const).map((x) => ({ value: x, label: x }))} />
        </Field>
        {bg.type === "solid" ? colorField("Color", "color") : null}
        {bg.type === "linear" || bg.type === "radial" ? (
          <>
            {colorField("From", "from")}
            {colorField("To", "to")}
          </>
        ) : null}
        {bg.type === "linear" ? (
          <Field label="Angle">
            <Slider value={bg.angle} min={0} max={360} onChange={(v) => setBg({ angle: v })} />
          </Field>
        ) : null}
        {bg.type === "image" ? (
          <>
            {colorField("Base color", "color")}
            <Field label="Image (spans the whole grid)">
              <Select value={bg.image} onChange={(v) => setBg({ image: v })} options={[{ value: "", label: "— none —" }, ...project.assets.map((a) => ({ value: a.path, label: a.name || a.path }))]} />
            </Field>
            <Field label="Image opacity">
              <Slider value={bg.imageOpacity} min={0} max={1} step={0.01} onChange={(v) => setBg({ imageOpacity: v })} />
            </Field>
          </>
        ) : null}
        <Field label="Film grain">
          <Slider value={bg.grain} min={0} max={0.3} step={0.01} onChange={(v) => setBg({ grain: v })} />
        </Field>
      </Section>

      <Section title={`Layers (${project.elements.length})`}>
        <div className="space-y-0.5">
          {[...project.elements].reverse().map((e) => (
            <button key={e.id} onClick={(ev) => select(e.id, { additive: ev.shiftKey || ev.metaKey })} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-zinc-300 hover:bg-zinc-800">
              <span className="w-14 shrink-0 text-[10px] uppercase text-zinc-500">{e.type}</span>
              <span className={`truncate ${e.hidden ? "opacity-40" : ""}`}>{e.name || ("text" in e ? e.text.slice(0, 32) : e.id)}</span>
              {e.locked ? <Lock size={11} className="ml-auto shrink-0 text-zinc-500" /> : null}
            </button>
          ))}
          {!project.elements.length ? <p className="text-xs text-zinc-500">No elements yet. Add one from the left, or apply a layout template.</p> : null}
        </div>
      </Section>
    </>
  );
}
