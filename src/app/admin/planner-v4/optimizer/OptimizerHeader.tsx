"use client";

import {
  Sparkles,
  X,
} from "lucide-react";

type Props = {
  previewTechnician?: string | null;
  onClearPreview?: () => void;
};

export default function OptimizerHeader({
  previewTechnician = null,
  onClearPreview,
}: Props) {
  return (
    <header className="border-b border-white/[0.06] bg-gradient-to-r from-purple-500/[0.10] via-fuchsia-500/[0.05] to-transparent px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple-300/15 bg-purple-400/[0.07] text-purple-200 shadow-lg shadow-purple-950/10">
            <Sparkles className="h-5 w-5" />
          </span>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300">
              AI Route Optimizer
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              Ruttförslag och analys
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
              Jämför kandidater, förhandsgranska förbättringar och godkänn den bästa rutten.
            </p>
          </div>
        </div>

        {previewTechnician &&
          onClearPreview && (
            <button
              type="button"
              onClick={
                onClearPreview
              }
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.055] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Stäng preview
            </button>
          )}
      </div>
    </header>
  );
}