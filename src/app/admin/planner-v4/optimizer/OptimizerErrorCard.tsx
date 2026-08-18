"use client";

import {
  TriangleAlert,
} from "lucide-react";

type Props = {
  technicianName: string;
  message: string;
  evaluatedCandidates?: number;
  generatedCandidates?: number;
};

export default function OptimizerErrorCard({
  technicianName,
  message,
  evaluatedCandidates = 0,
  generatedCandidates = 0,
}: Props) {
  const hasDiagnostics =
    evaluatedCandidates > 0 ||
    generatedCandidates > 0;

  return (
    <article className="rounded-2xl border border-red-400/20 bg-red-400/[0.055] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.07] text-red-300">
          <TriangleAlert className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">
              {technicianName}
            </h3>

            <span className="rounded-full border border-red-400/15 bg-red-400/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-200">
              Ingen bättre rutt
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-red-100/75">
            {message}
          </p>

          {hasDiagnostics && (
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-red-100/55">
              {evaluatedCandidates > 0 && (
                <span className="rounded-full border border-red-300/10 bg-black/10 px-2.5 py-1">
                  {evaluatedCandidates} utvärderade kandidater
                </span>
              )}

              {generatedCandidates > 0 && (
                <span className="rounded-full border border-red-300/10 bg-black/10 px-2.5 py-1">
                  {generatedCandidates} genererade alternativ
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}