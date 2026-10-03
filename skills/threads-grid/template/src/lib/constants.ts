import type { Brand, BrandColorKey, LayoutMode, PlatformPreset } from "./types";

export const PLATFORM_PRESETS: Record<PlatformPreset, { label: string; hint: string; width: number; height: number }> = {
  square: { label: "Square 1:1", hint: "Threads / Instagram feed", width: 1080, height: 1080 },
  portrait: { label: "Portrait 4:5", hint: "Instagram portrait", width: 1080, height: 1350 },
  story: { label: "Story 9:16", hint: "Story / Reel cover", width: 1080, height: 1920 },
  landscape: { label: "Landscape 1.91:1", hint: "Facebook link post", width: 1200, height: 628 },
  custom: { label: "Custom", hint: "Any width × height", width: 1080, height: 1080 },
};

export const LAYOUT_MODES: Record<LayoutMode, { label: string; rows: number | null; cols: number | null }> = {
  carousel: { label: "Horizontal carousel", rows: 1, cols: null },
  "grid-2x2": { label: "2 × 2 grid", rows: 2, cols: 2 },
  "grid-3x3": { label: "3 × 3 puzzle", rows: 3, cols: 3 },
  vertical: { label: "Vertical sequence", rows: null, cols: 1 },
  custom: { label: "Custom rows × cols", rows: null, cols: null },
};

/**
 * Fonts are self-hosted through next/font in app/layout.tsx (all with Vietnamese subsets).
 * `cssVar` must match the `variable` given there.
 */
export const FONT_OPTIONS: { id: string; label: string; cssVar: string; kind: "serif" | "sans" | "mono" }[] = [
  { id: "inter", label: "Inter", cssVar: "--font-inter", kind: "sans" },
  { id: "be-vietnam", label: "Be Vietnam Pro", cssVar: "--font-be-vietnam", kind: "sans" },
  { id: "montserrat", label: "Montserrat", cssVar: "--font-montserrat", kind: "sans" },
  { id: "space-grotesk", label: "Space Grotesk", cssVar: "--font-space-grotesk", kind: "sans" },
  { id: "playfair", label: "Playfair Display", cssVar: "--font-playfair", kind: "serif" },
  { id: "cormorant", label: "Cormorant Garamond", cssVar: "--font-cormorant", kind: "serif" },
  { id: "lora", label: "Lora", cssVar: "--font-lora", kind: "serif" },
  { id: "jetbrains", label: "JetBrains Mono", cssVar: "--font-jetbrains", kind: "mono" },
];

export const BRAND_COLOR_KEYS: BrandColorKey[] = ["primary", "secondary", "accent", "background", "surface", "text", "muted"];

export const BLEND_MODES = [
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
] as const;

export type StylePreset = {
  id: string;
  label: string;
  description: string;
  colors: Brand["colors"];
  fonts: Brand["fonts"];
  background: { type: "solid" | "linear" | "radial"; color: string; from: string; to: string; angle: number; grain: number };
};

/** Mirrors ../style-prompts/*.md. Applying a style only touches brand colors, fonts and background. */
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "luxury-product-launch",
    label: "Luxury product launch",
    description: "Deep tones, champagne accents, serif display, product as hero.",
    colors: {
      primary: "#1f3a2e",
      secondary: "#2c4a3b",
      accent: "#c9a96e",
      background: "#14261e",
      surface: "#f3ecdf",
      text: "#f3ecdf",
      muted: "#a8b5a9",
    },
    fonts: { heading: "cormorant", body: "be-vietnam" },
    background: { type: "radial", color: "background", from: "#25453a", to: "#0f1d17", angle: 0, grain: 0.06 },
  },
  {
    id: "clean-founder-thread",
    label: "Clean founder thread",
    description: "Paper white, ink black, one accent. Text-forward.",
    colors: {
      primary: "#0a0a0a",
      secondary: "#262626",
      accent: "#ff5a1f",
      background: "#fafaf7",
      surface: "#ffffff",
      text: "#0a0a0a",
      muted: "#737373",
    },
    fonts: { heading: "inter", body: "inter" },
    background: { type: "solid", color: "background", from: "background", to: "surface", angle: 0, grain: 0 },
  },
  {
    id: "bold-viral-carousel",
    label: "Bold viral carousel",
    description: "Maximum contrast, giant type, one loud color.",
    colors: {
      primary: "#d7ff3a",
      secondary: "#ffffff",
      accent: "#d7ff3a",
      background: "#0b0b0b",
      surface: "#1a1a1a",
      text: "#ffffff",
      muted: "#9a9a9a",
    },
    fonts: { heading: "space-grotesk", body: "inter" },
    background: { type: "solid", color: "background", from: "background", to: "surface", angle: 0, grain: 0.04 },
  },
  {
    id: "premium-wellness-brand",
    label: "Premium wellness brand",
    description: "Warm cream, clay, sage. Soft editorial calm.",
    colors: {
      primary: "#7a8b6f",
      secondary: "#b8866b",
      accent: "#b8866b",
      background: "#f4ede3",
      surface: "#fbf8f3",
      text: "#3a332c",
      muted: "#8c8177",
    },
    fonts: { heading: "lora", body: "be-vietnam" },
    background: { type: "linear", color: "background", from: "#f6efe5", to: "#ece2d3", angle: 100, grain: 0.05 },
  },
  {
    id: "fintech-dark-grid",
    label: "Fintech dark grid",
    description: "Near-black UI, cool greys, one electric accent used sparingly.",
    colors: {
      primary: "#5b8cff",
      secondary: "#1b2233",
      accent: "#3cf0c5",
      background: "#070a12",
      surface: "#111827",
      text: "#e8edf7",
      muted: "#7c879c",
    },
    fonts: { heading: "space-grotesk", body: "inter" },
    background: { type: "radial", color: "background", from: "#121a2e", to: "#05070d", angle: 0, grain: 0.03 },
  },
  {
    id: "editorial-magazine",
    label: "Editorial magazine",
    description: "Newsprint off-white, black serif, red rule lines.",
    colors: {
      primary: "#111111",
      secondary: "#3d3d3d",
      accent: "#c8102e",
      background: "#f2efe8",
      surface: "#ffffff",
      text: "#111111",
      muted: "#6e6a62",
    },
    fonts: { heading: "playfair", body: "lora" },
    background: { type: "solid", color: "background", from: "background", to: "surface", angle: 0, grain: 0.05 },
  },
  {
    id: "vietnamese-brand-campaign",
    label: "Vietnamese brand campaign",
    description: "Readable Vietnamese type, warm red-gold or jade, product hero.",
    colors: {
      primary: "#9e1b1b",
      secondary: "#5c1010",
      accent: "#d9a441",
      background: "#fbf3e6",
      surface: "#ffffff",
      text: "#2a1a12",
      muted: "#8a6f5c",
    },
    fonts: { heading: "be-vietnam", body: "be-vietnam" },
    background: { type: "linear", color: "background", from: "#fcf5ea", to: "#f3e3c8", angle: 160, grain: 0.04 },
  },
];

export const ZOOM_STEPS = [0.05, 0.08, 0.1, 0.125, 0.15, 0.2, 0.25, 0.33, 0.5, 0.75, 1];
