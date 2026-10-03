import { z } from "zod";

/**
 * Single source of truth for threads-grid.json.
 * Every field has a default so agent-authored JSON can stay short:
 * only `type`, position and the content fields are really needed per element.
 */

const color = z.string(); // any CSS color: #hex, rgb(), rgba(), transparent

export const BlendModeSchema = z.enum([
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "soft-light",
  "hard-light",
  "difference",
  "luminosity",
]);

export const ShadowSchema = z.object({
  enabled: z.boolean().default(false),
  x: z.number().default(0),
  y: z.number().default(24),
  blur: z.number().default(60),
  color: color.default("rgba(0,0,0,0.25)"),
});

const base = {
  id: z.string(),
  name: z.string().optional(),
  /** Canvas coordinates in export pixels. (0,0) is the top-left of post 1. */
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  radius: z.number().min(0).default(0),
  blur: z.number().min(0).default(0),
  blendMode: BlendModeSchema.default("normal"),
  shadow: ShadowSchema.prefault({}),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
};

const typography = {
  fontFamily: z.string().default("heading"), // "heading" | "body" | a FONT_OPTIONS id
  fontSize: z.number().positive().default(96),
  fontWeight: z.number().default(700),
  color: color.default("text"), // brand token ("primary", "text", ...) or CSS color
  italic: z.boolean().default(false),
  uppercase: z.boolean().default(false),
  letterSpacing: z.number().default(0), // em
  lineHeight: z.number().default(1.05),
  align: z.enum(["left", "center", "right"]).default("left"),
};

export const TextElementSchema = z.object({
  ...base,
  type: z.literal("text"),
  text: z.string().default("Headline"),
  ...typography,
  background: color.default("transparent"),
  padding: z.number().default(0),
  verticalAlign: z.enum(["top", "center", "bottom"]).default("top"),
});

export const ImageElementSchema = z.object({
  ...base,
  type: z.literal("image"),
  /** /uploads/<hash>.png, or any same-origin path. */
  src: z.string().default(""),
  role: z.enum(["image", "logo", "product", "screenshot", "texture"]).default("image"),
  fit: z.enum(["cover", "contain", "fill"]).default("cover"),
  focusX: z.number().min(0).max(100).default(50),
  focusY: z.number().min(0).max(100).default(50),
  mask: z.enum(["none", "circle", "arch", "rounded", "pill"]).default("none"),
  /** Optional device frame around screenshots. */
  frame: z.enum(["none", "phone", "browser"]).default("none"),
});

export const ShapeElementSchema = z.object({
  ...base,
  type: z.literal("shape"),
  shape: z.enum(["rect", "ellipse", "pill", "arch", "ring"]).default("rect"),
  fill: color.default("primary"),
  stroke: color.default("transparent"),
  strokeWidth: z.number().min(0).default(0),
});

export const GradientElementSchema = z.object({
  ...base,
  type: z.literal("gradient"),
  kind: z.enum(["linear", "radial"]).default("linear"),
  from: color.default("primary"),
  to: color.default("transparent"),
  angle: z.number().default(135),
});

export const LineElementSchema = z.object({
  ...base,
  type: z.literal("line"),
  variant: z.enum(["straight", "arc", "wave"]).default("straight"),
  color: color.default("accent"),
  thickness: z.number().positive().default(4),
  dash: z.enum(["solid", "dashed", "dotted"]).default("solid"),
});

export const BadgeElementSchema = z.object({
  ...base,
  type: z.literal("badge"),
  text: z.string().default("01"),
  shape: z.enum(["circle", "pill", "square"]).default("circle"),
  fill: color.default("accent"),
  ...typography,
  fontSize: z.number().positive().default(48),
  align: z.enum(["left", "center", "right"]).default("center"),
});

export const QuoteElementSchema = z.object({
  ...base,
  type: z.literal("quote"),
  text: z.string().default("A quote that earns the scroll-stop."),
  author: z.string().default(""),
  fill: color.default("surface"),
  accent: color.default("accent"),
  padding: z.number().default(72),
  ...typography,
  fontSize: z.number().positive().default(64),
  fontWeight: z.number().default(500),
});

export const CtaElementSchema = z.object({
  ...base,
  type: z.literal("cta"),
  text: z.string().default("Follow for more"),
  fill: color.default("primary"),
  arrow: z.boolean().default(true),
  ...typography,
  fontFamily: z.string().default("body"),
  fontSize: z.number().positive().default(44),
  fontWeight: z.number().default(600),
  color: color.default("background"),
  align: z.enum(["left", "center", "right"]).default("center"),
});

export const ElementSchema = z.discriminatedUnion("type", [
  TextElementSchema,
  ImageElementSchema,
  ShapeElementSchema,
  GradientElementSchema,
  LineElementSchema,
  BadgeElementSchema,
  QuoteElementSchema,
  CtaElementSchema,
]);

export const PlatformPresetSchema = z.enum(["square", "portrait", "story", "landscape", "custom"]);
export const LayoutModeSchema = z.enum(["carousel", "grid-2x2", "grid-3x3", "vertical", "custom"]);

export const BrandSchema = z.object({
  name: z.string().default("Brand"),
  logo: z.string().default(""),
  colors: z
    .object({
      primary: color.default("#111111"),
      secondary: color.default("#555555"),
      accent: color.default("#c8a96a"),
      background: color.default("#f6f2ea"),
      surface: color.default("#ffffff"),
      text: color.default("#111111"),
      muted: color.default("#6b6b6b"),
    })
    .prefault({}),
  fonts: z
    .object({
      heading: z.string().default("playfair"),
      body: z.string().default("inter"),
    })
    .prefault({}),
});

export const BackgroundSchema = z.object({
  type: z.enum(["solid", "linear", "radial", "image"]).default("solid"),
  color: color.default("background"),
  from: color.default("background"),
  to: color.default("surface"),
  angle: z.number().default(120),
  image: z.string().default(""),
  imageOpacity: z.number().min(0).max(1).default(1),
  /** Subtle film grain over the whole canvas. 0 disables. */
  grain: z.number().min(0).max(1).default(0),
});

export const CopyPostSchema = z.object({
  role: z.string().default(""), // hook, problem, insight, reveal, cta ...
  headline: z.string().default(""),
  body: z.string().default(""),
  notes: z.string().default(""),
});

export const ProjectSchema = z.object({
  version: z.literal(1).default(1),
  name: z.string().default("Untitled grid"),
  brand: BrandSchema.prefault({}),
  style: z.string().default("clean-founder-thread"),
  preset: PlatformPresetSchema.default("square"),
  post: z
    .object({ width: z.number().int().positive().default(1080), height: z.number().int().positive().default(1080) })
    .prefault({}),
  layout: z
    .object({
      mode: LayoutModeSchema.default("carousel"),
      rows: z.number().int().min(1).max(10).default(1),
      cols: z.number().int().min(1).max(10).default(6),
    })
    .prefault({}),
  background: BackgroundSchema.prefault({}),
  elements: z.array(ElementSchema).default([]),
  assets: z
    .array(
      z.object({
        id: z.string(),
        path: z.string(),
        name: z.string().default(""),
        role: z.string().default("image"),
      }),
    )
    .default([]),
  copyPlan: z
    .object({
      structure: z.string().default(""),
      language: z.string().default("en"),
      caption: z.string().default(""),
      posts: z.array(CopyPostSchema).default([]),
    })
    .prefault({}),
  guides: z
    .object({
      safeArea: z.number().min(0).max(30).default(7), // % inset per post
      showSafeArea: z.boolean().default(true),
      showBoundaries: z.boolean().default(true),
      snap: z.boolean().default(true),
      gridSize: z.number().int().min(1).default(10),
    })
    .prefault({}),
  export: z
    .object({
      fileBase: z.string().default("threads-grid"),
      includePreview: z.boolean().default(true),
      includeProjectJson: z.boolean().default(true),
      /** "reading": 01 = top-left. "posting": 01 = first to publish (reversed for profile grids). */
      order: z.enum(["reading", "posting"]).default("reading"),
      previewMaxSize: z.number().int().default(3000),
    })
    .prefault({}),
});

export type BlendMode = z.infer<typeof BlendModeSchema>;
export type Shadow = z.infer<typeof ShadowSchema>;
export type TextElement = z.infer<typeof TextElementSchema>;
export type ImageElement = z.infer<typeof ImageElementSchema>;
export type ShapeElement = z.infer<typeof ShapeElementSchema>;
export type GradientElement = z.infer<typeof GradientElementSchema>;
export type LineElement = z.infer<typeof LineElementSchema>;
export type BadgeElement = z.infer<typeof BadgeElementSchema>;
export type QuoteElement = z.infer<typeof QuoteElementSchema>;
export type CtaElement = z.infer<typeof CtaElementSchema>;
export type GridElement = z.infer<typeof ElementSchema>;
export type ElementType = GridElement["type"];
export type PlatformPreset = z.infer<typeof PlatformPresetSchema>;
export type LayoutMode = z.infer<typeof LayoutModeSchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type BrandColorKey = keyof Brand["colors"];
export type Background = z.infer<typeof BackgroundSchema>;
export type CopyPost = z.infer<typeof CopyPostSchema>;
export type Project = z.infer<typeof ProjectSchema>;

export type PostRect = { index: number; row: number; col: number; x: number; y: number; w: number; h: number };
