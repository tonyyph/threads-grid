"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { resolveColor } from "@/lib/geometry";
import type { Project } from "@/lib/types";

let grainCache = "";
/**
 * Noise tile as a PNG data URL. (An SVG feTurbulence tile would contain `url(#id)`,
 * which html-to-image tries to fetch as a resource during export.)
 */
function grainTile(): string {
  if (grainCache || typeof document === "undefined") return grainCache;
  const c = document.createElement("canvas");
  c.width = c.height = 192;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainCache = c.toDataURL("image/png");
  return grainCache;
}

/** One continuous background behind every post: this is what makes the grid feel connected. */
export function CanvasBackground({ project, srcMap }: { project: Project; srcMap?: Record<string, string> }) {
  const bg = project.background;
  const c = (v: string) => resolveColor(v, project.brand);
  const fill: CSSProperties = { position: "absolute", inset: 0 };
  let background: string = c(bg.color);
  if (bg.type === "linear") background = `linear-gradient(${bg.angle}deg, ${c(bg.from)}, ${c(bg.to)})`;
  if (bg.type === "radial") background = `radial-gradient(ellipse at center, ${c(bg.from)}, ${c(bg.to)})`;
  const image = bg.image ? srcMap?.[bg.image] ?? bg.image : "";
  const [grain, setGrain] = useState("");
  useEffect(() => setGrain(grainTile()), []);
  return (
    <>
      <div style={{ ...fill, background }} />
      {bg.type === "image" && image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" draggable={false} style={{ ...fill, width: "100%", height: "100%", objectFit: "cover", opacity: bg.imageOpacity }} />
      ) : null}
      {bg.grain > 0 && grain ? <div style={{ ...fill, backgroundImage: `url("${grain}")`, opacity: bg.grain, mixBlendMode: "overlay" }} /> : null}
    </>
  );
}
