"use client";

import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

/** Minimal shadcn-style primitives for a dense editor UI. No external UI deps. */

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "icon" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60",
        variant === "primary" && "bg-white text-zinc-950 hover:bg-zinc-200",
        variant === "secondary" && "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
        variant === "ghost" && "text-zinc-300 hover:bg-zinc-800 hover:text-white",
        variant === "danger" && "bg-red-500/15 text-red-300 hover:bg-red-500/25",
        size === "sm" && "h-7 px-2 text-xs",
        size === "md" && "h-8 px-3 text-sm",
        size === "icon" && "h-7 w-7",
        className,
      )}
      {...props}
    />
  );
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="border-b border-zinc-800 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{title}</h3>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[11px] text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "h-8 w-full min-w-0 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-sm text-zinc-100 outline-none focus:border-sky-500/70";

export function TextInput({ value, onChange, placeholder, multiline }: { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  if (multiline) {
    return <textarea className={cn(inputCls, "h-auto min-h-20 py-1.5 leading-snug")} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

/** Number input that commits on blur/Enter so typing "1" on the way to "120" doesn't thrash history. */
export function NumberInput({ value, onChange, step = 1, min, max, suffix }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string }) {
  const [draft, setDraft] = useState(String(round(value)));
  useEffect(() => setDraft(String(round(value))), [value]);
  const commit = () => {
    let n = Number(draft);
    if (!Number.isFinite(n)) return setDraft(String(round(value)));
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    if (n !== value) onChange(n);
    else setDraft(String(round(value)));
  };
  return (
    <div className="relative">
      <input
        className={cn(inputCls, suffix && "pr-7")}
        type="number"
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
      {suffix ? <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">{suffix}</span> : null}
    </div>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Slider({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  return (
    <div className="flex items-center gap-2">
      <input type="range" className="h-1 flex-1 accent-sky-500" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="w-10 text-right text-[11px] tabular-nums text-zinc-400">{round(value)}</span>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-zinc-300">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-4 w-7 rounded-full transition-colors", checked ? "bg-sky-500" : "bg-zinc-700")}
      >
        <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", checked ? "left-3.5" : "left-0.5")} />
      </button>
    </label>
  );
}

/**
 * Color input that accepts a brand token ("primary", "accent"...) or any CSS color.
 * Token chips keep designs re-themeable: change the brand palette and everything follows.
 */
export function ColorInput({ value, onChange, tokens, resolved }: { value: string; onChange: (v: string) => void; tokens?: Record<string, string>; resolved: string }) {
  const hex = /^#[0-9a-f]{6}$/i.test(resolved) ? resolved : "#000000";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <input type="color" className="h-8 w-8 shrink-0 cursor-pointer rounded border border-zinc-800 bg-transparent" value={hex} onChange={(e) => onChange(e.target.value)} />
        <TextInput value={value} onChange={onChange} />
      </div>
      {tokens ? (
        <div className="flex flex-wrap gap-1">
          {Object.entries(tokens).map(([k, v]) => (
            <button
              key={k}
              type="button"
              title={k}
              onClick={() => onChange(k)}
              className={cn("h-5 w-5 rounded border", value === k ? "border-sky-400 ring-1 ring-sky-400" : "border-zinc-700")}
              style={{ background: v }}
            />
          ))}
          <button type="button" title="transparent" onClick={() => onChange("transparent")} className={cn("h-5 rounded border px-1 text-[10px] text-zinc-400", value === "transparent" ? "border-sky-400" : "border-zinc-700")}>
            none
          </button>
        </div>
      ) : null}
    </div>
  );
}
