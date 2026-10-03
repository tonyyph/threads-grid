"use client";

import { forwardRef } from "react";
import { canvasSize } from "@/lib/geometry";
import type { Project } from "@/lib/types";
import { CanvasBackground } from "./canvas-background";
import { ElementContent } from "./element-view";

/**
 * The full connected canvas at 1:1 export pixels, without guides or selection UI.
 * Kept mounted off-screen; export-render.ts crops it per post.
 */
export const ExportStage = forwardRef<HTMLDivElement, { project: Project; srcMap?: Record<string, string> }>(function ExportStage({ project, srcMap }, ref) {
  const { width, height } = canvasSize(project);
  return (
    <div aria-hidden style={{ position: "fixed", left: -100000, top: 0, pointerEvents: "none" }}>
      <div ref={ref} data-export-stage style={{ position: "relative", width, height, overflow: "hidden" }}>
        <CanvasBackground project={project} srcMap={srcMap} />
        {project.elements
          .filter((el) => !el.hidden)
          .map((el) => (
            <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h, mixBlendMode: el.blendMode }}>
              <ElementContent el={el} brand={project.brand} mode="export" srcMap={srcMap} />
            </div>
          ))}
      </div>
    </div>
  );
});
