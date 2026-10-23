// src/components/SidecarPill.tsx
"use client";

import React from "react";
import { Sparkles, ExternalLink } from "lucide-react";

export interface SidecarPillProps {
  className?: string;
  variant?: "compact" | "banner";
  compact?: boolean;
}

export const SIDECAR_URL = "sidecar://science/biomolecular_structure_viewer/ui.html";

/**
 * SidecarPill renders the mandatory Biomolecular Structure Viewer sidecar link
 * per Science Visualization Priority Rules.
 */
export default function SidecarPill({
  className = "",
  variant = "banner",
  compact = false,
}: SidecarPillProps) {
  const isCompact = compact || variant === "compact";

  if (isCompact) {
    return (
      <a
        href={SIDECAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Biomolecular Structure Viewer sidecar"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/90 hover:text-cyan-200 transition-all shadow-sm ${className}`}
        title="Open Biomolecular Structure Viewer"
      >
        <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Biomolecular Structure Viewer</span>
        <ExternalLink className="w-3 h-3 text-cyan-400" />
      </a>
    );
  }

  return (
    <div
      className={`rounded-xl bg-slate-900/90 border border-cyan-900/50 p-3.5 sm:p-4 text-slate-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-cyan-950/90 border border-cyan-800/60 text-cyan-400 shrink-0 mt-0.5 sm:mt-0">
          <Sparkles className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Biomolecular Structure Viewer
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
              Interactive 3D
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
            Inspect 3D molecular conformations of ABO oligosaccharide antigens, RhD proteins, and platelet integrin receptors in real time.
          </p>
        </div>
      </div>
      <a
        href={SIDECAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Biomolecular Structure Viewer sidecar"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/60 transition-all shrink-0"
      >
        <span>Launch Viewer</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
