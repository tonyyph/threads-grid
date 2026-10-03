import type { CSSProperties, ReactNode } from "react";
import { resolveColor, resolveFont } from "@/lib/geometry";
import type { Brand, GridElement } from "@/lib/types";

type Mode = "editor" | "export";

/**
 * Pure renderer for one element, filling its parent box.
 * Position/size/blend-mode live on the wrapper (Rnd in the editor, a plain div in export)
 * so mix-blend-mode composites against the canvas in both places.
 */
export function ElementContent({ el, brand, mode, srcMap }: { el: GridElement; brand: Brand; mode: Mode; srcMap?: Record<string, string> }) {
  const c = (v: string) => resolveColor(v, brand);
  const shadow = el.shadow.enabled ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${c(el.shadow.color)}` : undefined;
  const filters: string[] = [];
  if (el.blur > 0) filters.push(`blur(${el.blur}px)`);
  if (shadow && (el.type === "image" || el.type === "line")) filters.push(`drop-shadow(${shadow})`);

  const outer: CSSProperties = {
    width: "100%",
    height: "100%",
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.opacity,
    filter: filters.length ? filters.join(" ") : undefined,
    position: "relative",
  };

  return <div style={outer}>{renderBody(el, brand, mode, c, shadow, srcMap)}</div>;
}

function typo(el: { fontFamily: string; fontSize: number; fontWeight: number; color: string; italic: boolean; uppercase: boolean; letterSpacing: number; lineHeight: number; align: string }, brand: Brand): CSSProperties {
  return {
    fontFamily: resolveFont(el.fontFamily, brand),
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    color: resolveColor(el.color, brand),
    fontStyle: el.italic ? "italic" : "normal",
    textTransform: el.uppercase ? "uppercase" : "none",
    letterSpacing: `${el.letterSpacing}em`,
    lineHeight: el.lineHeight,
    textAlign: el.align as CSSProperties["textAlign"],
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
  };
}

function maskRadius(mask: string, radius: number): string | number {
  switch (mask) {
    case "circle":
      return "50%";
    case "pill":
      return "9999px";
    case "arch":
      return "9999px 9999px 0 0";
    case "rounded":
      return Math.max(radius, 24);
    default:
      return radius;
  }
}

function renderBody(el: GridElement, brand: Brand, mode: Mode, c: (v: string) => string, shadow: string | undefined, srcMap?: Record<string, string>): ReactNode {
  const fill: CSSProperties = { position: "absolute", inset: 0 };
  switch (el.type) {
    case "text":
      return (
        <div
          style={{
            ...fill,
            ...typo(el, brand),
            background: c(el.background),
            padding: el.padding,
            borderRadius: el.radius,
            display: "flex",
            flexDirection: "column",
            justifyContent: el.verticalAlign === "center" ? "center" : el.verticalAlign === "bottom" ? "flex-end" : "flex-start",
            textShadow: shadow,
          }}
        >
          {el.text}
        </div>
      );

    case "image": {
      const src = el.src ? srcMap?.[el.src] ?? el.src : "";
      if (!src) {
        if (mode === "export") return null;
        return (
          <div style={{ ...fill, border: "4px dashed rgba(127,127,127,0.6)", borderRadius: maskRadius(el.mask, el.radius), display: "grid", placeItems: "center", color: "rgba(127,127,127,0.9)", fontFamily: "system-ui", fontSize: 32, background: "rgba(127,127,127,0.08)", textAlign: "center", padding: 24 }}>
            {el.role === "product" ? "Product image" : el.role === "logo" ? "Logo" : "Image"}
            <br />
            <span style={{ fontSize: 22, opacity: 0.8 }}>drop a file or pick from Assets</span>
          </div>
        );
      }
      const img = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={el.name ?? el.role}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: el.fit, objectPosition: `${el.focusX}% ${el.focusY}%`, display: "block", borderRadius: el.frame === "none" ? maskRadius(el.mask, el.radius) : undefined }}
        />
      );
      if (el.frame === "phone") {
        const bezel = Math.max(10, Math.round(Math.min(el.w, el.h) * 0.035));
        return (
          <div style={{ ...fill, background: "#0b0b0c", borderRadius: Math.max(el.radius, bezel * 4), padding: bezel, boxShadow: "inset 0 0 0 2px #2a2a2e" }}>
            <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: Math.max(el.radius, bezel * 4) - bezel }}>{img}</div>
          </div>
        );
      }
      if (el.frame === "browser") {
        const bar = Math.max(28, Math.round(el.h * 0.06));
        return (
          <div style={{ ...fill, background: "#f4f4f5", borderRadius: Math.max(el.radius, 16), overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ height: bar, display: "flex", alignItems: "center", gap: bar * 0.25, paddingLeft: bar * 0.5, flexShrink: 0 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((col) => (
                <span key={col} style={{ width: bar * 0.32, height: bar * 0.32, borderRadius: "50%", background: col }} />
              ))}
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>{img}</div>
          </div>
        );
      }
      return <div style={{ ...fill, overflow: el.mask !== "none" ? "hidden" : undefined, borderRadius: maskRadius(el.mask, el.radius) }}>{img}</div>;
    }

    case "shape": {
      const radius = el.shape === "ellipse" || el.shape === "ring" ? "50%" : el.shape === "pill" ? "9999px" : el.shape === "arch" ? `${el.w / 2}px ${el.w / 2}px ${el.radius}px ${el.radius}px` : el.radius;
      return (
        <div
          style={{
            ...fill,
            background: el.shape === "ring" ? "transparent" : c(el.fill),
            border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${c(el.stroke)}` : undefined,
            borderRadius: radius,
            boxShadow: shadow,
          }}
        />
      );
    }

    case "gradient":
      return (
        <div
          style={{
            ...fill,
            borderRadius: el.radius,
            background: el.kind === "radial" ? `radial-gradient(closest-side, ${c(el.from)}, ${c(el.to)})` : `linear-gradient(${el.angle}deg, ${c(el.from)}, ${c(el.to)})`,
          }}
        />
      );

    case "line": {
      const { w, h, thickness } = el;
      const dash = el.dash === "dashed" ? `${thickness * 4} ${thickness * 3}` : el.dash === "dotted" ? `0 ${thickness * 2.5}` : undefined;
      const mid = h / 2;
      let d = `M0 ${mid} L${w} ${mid}`;
      if (el.variant === "arc") d = `M0 ${h - thickness} Q${w / 2} ${-h + thickness * 2} ${w} ${h - thickness}`;
      if (el.variant === "wave") {
        const waves = Math.max(1, Math.round(w / Math.max(h * 2, 200)));
        const seg = w / (waves * 2);
        d = `M0 ${mid}`;
        for (let i = 0; i < waves * 2; i++) d += ` Q${seg * i + seg / 2} ${i % 2 ? h - thickness : thickness} ${seg * (i + 1)} ${mid}`;
      }
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ ...fill, overflow: "visible" }}>
          <path d={d} fill="none" stroke={c(el.color)} strokeWidth={thickness} strokeDasharray={dash} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    }

    case "badge":
      return (
        <div
          style={{
            ...fill,
            ...typo(el, brand),
            background: c(el.fill),
            borderRadius: el.shape === "circle" ? "50%" : el.shape === "pill" ? "9999px" : el.radius,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: shadow,
            lineHeight: 1,
          }}
        >
          {el.text}
        </div>
      );

    case "quote":
      return (
        <div style={{ ...fill, background: c(el.fill), borderRadius: el.radius, padding: el.padding, boxShadow: shadow, display: "flex", flexDirection: "column", gap: el.fontSize * 0.5 }}>
          <div style={{ fontFamily: resolveFont("heading", brand), fontSize: el.fontSize * 2.2, lineHeight: 0.6, color: c(el.accent), height: el.fontSize * 1.1 }}>“</div>
          <div style={{ ...typo(el, brand), flex: 1, minHeight: 0 }}>{el.text}</div>
          {el.author ? (
            <div style={{ ...typo(el, brand), fontFamily: resolveFont("body", brand), fontSize: el.fontSize * 0.42, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: c(el.accent) }}>— {el.author}</div>
          ) : null}
        </div>
      );

    case "cta":
      return (
        <div
          style={{
            ...fill,
            ...typo(el, brand),
            whiteSpace: "nowrap",
            background: c(el.fill),
            borderRadius: el.radius,
            display: "flex",
            alignItems: "center",
            justifyContent: el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center",
            gap: el.fontSize * 0.5,
            padding: `0 ${el.fontSize}px`,
            boxShadow: shadow,
          }}
        >
          {el.text}
          {el.arrow ? <span aria-hidden>→</span> : null}
        </div>
      );
  }
}
