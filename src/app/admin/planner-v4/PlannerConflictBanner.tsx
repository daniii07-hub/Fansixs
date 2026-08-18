"use client";

import { AlertTriangle, Clock3, UserRound } from "lucide-react";
import type { PlannerConflict } from "./conflicts";

type Props = {
  conflicts: PlannerConflict[];
  onConflictSelect?: (workOrderId: number) => void;
};

export default function PlannerConflictBanner({
  conflicts,
  onConflictSelect,
}: Props) {
  if (conflicts.length === 0) {
    return (
      <section className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.06] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
            <Clock3 className="h-5 w-5" />
          </span>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Inga konflikter
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Planeringen ser bra ut
            </h2>

            <p className="mt-1 text-sm leading-6 text-emerald-100/65">
              Inga överlappande jobb hittades för vald dag.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      role="alert"
      className="overflow-hidden rounded-3xl border border-red-400/20 bg-red-400/[0.07]"
    >
      <div className="flex flex-col gap-4 border-b border-red-400/15 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-400/25 bg-red-400/10 text-red-200">
            <AlertTriangle className="h-5 w-5" />
          </span>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
              Schemafel
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              {conflicts.length}{" "}
              {conflicts.length === 1
                ? "konflikt hittades"
                : "konflikter hittades"}
            </h2>

            <p className="mt-1 text-sm leading-6 text-red-100/65">
              Samma tekniker har två jobb som överlappar i tid.
            </p>
          </div>
        </div>

        <span className="w-fit rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-200">
          Åtgärd krävs
        </span>
      </div>

      <div className="divide-y divide-red-400/10">
        {conflicts.map((conflict, index) => {
          const firstWorkOrderId = conflict.workOrderIds[0];

          return (
            <button
              key={`${conflict.technician}-${conflict.startTime}-${index}`}
              type="button"
              onClick={() => onConflictSelect?.(firstWorkOrderId)}
              className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-red-400/[0.05] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/10 text-slate-300">
                  <UserRound className="h-4 w-4" />
                </span>

                <div>
                  <p className="font-semibold text-white">
                    {conflict.technician}
                  </p>

                  <p className="mt-1 text-xs text-red-100/60">
                    Arbetsorder {conflict.workOrderIds.join(" och ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-red-100">
                <Clock3 className="h-4 w-4 text-red-300" />
                <span>
                  {conflict.startTime}–{conflict.endTime}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}