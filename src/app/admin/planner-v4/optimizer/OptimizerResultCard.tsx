"use client";

import {
  Check,
  CheckCircle2,
  ChevronRight,
  Route,
  TriangleAlert,
  X,
} from "lucide-react";

import type {
  RouteOptimizationComparison,
} from "../routing/optimization/types";

type Props = {
  technicianName: string;
  comparison: RouteOptimizationComparison;
  evaluatedCandidates: number;
  score: number;
  isPreviewing?: boolean;
  isAccepted?: boolean;
  isRejected?: boolean;
  onPreview?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
};

function formatMinutes(
  minutes: number,
) {
  const value =
    Math.abs(
      Math.round(minutes),
    );

  if (value < 60) {
    return `${value} min`;
  }

  const hours =
    Math.floor(value / 60);

  const rest =
    value % 60;

  return rest > 0
    ? `${hours} h ${rest} min`
    : `${hours} h`;
}

function formatDistance(
  meters: number,
) {
  const kilometers =
    Math.abs(meters) / 1000;

  if (kilometers < 1) {
    return `${Math.round(
      Math.abs(meters),
    )} m`;
  }

  return `${kilometers.toFixed(
    kilometers >= 10
      ? 0
      : 1,
  )} km`;
}

function formatSaving({
  value,
  unit,
}: {
  value: number;
  unit:
    | "minutes"
    | "distance";
}) {
  if (value === 0) {
    return unit ===
      "minutes"
      ? "0 min"
      : "0 km";
  }

  const prefix =
    value > 0
      ? "−"
      : "+";

  return unit ===
    "minutes"
    ? `${prefix}${formatMinutes(
        value,
      )}`
    : `${prefix}${formatDistance(
        value,
      )}`;
}

export default function OptimizerResultCard({
  technicianName,
  comparison,
  evaluatedCandidates,
  score,
  isPreviewing = false,
  isAccepted = false,
  isRejected = false,
  onPreview,
  onAccept,
  onReject,
}: Props) {
  return (
    <article
      className={[
        "rounded-2xl border p-5 transition",
        isAccepted
          ? "border-emerald-400/30 bg-emerald-400/[0.07]"
          : isRejected
            ? "border-white/[0.07] bg-white/[0.02] opacity-60"
            : comparison.improved
              ? "border-purple-400/20 bg-purple-400/[0.045]"
              : "border-white/[0.08] bg-white/[0.025]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={[
                "flex h-10 w-10 items-center justify-center rounded-xl border",
                comparison.improved
                  ? "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300"
                  : "border-white/[0.07] bg-white/[0.03] text-slate-400",
              ].join(" ")}
            >
              {comparison.improved ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Route className="h-5 w-5" />
              )}
            </span>

            <div className="min-w-0">
              <h3 className="truncate font-semibold text-white">
                {technicianName}
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                {evaluatedCandidates} kandidater · score{" "}
                {score.toFixed(2)}
              </p>
            </div>

            <span
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold",
                comparison.improved
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border-white/[0.08] bg-white/[0.03] text-slate-400",
              ].join(" ")}
            >
              {comparison.improved
                ? `${comparison.percentageImprovement.toFixed(
                    1,
                  )}% bättre`
                : "Ingen förbättring"}
            </span>

            {isAccepted && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Godkänd
              </span>
            )}

            {isRejected && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-semibold text-slate-400">
                Avvisad
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
              <p className="text-sm font-semibold text-white">
                {formatSaving({
                  value:
                    comparison.driveMinutesSaved,
                  unit:
                    "minutes",
                })}
              </p>

              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Körtid
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
              <p className="text-sm font-semibold text-white">
                {formatSaving({
                  value:
                    comparison.distanceSavedMeters,
                  unit:
                    "distance",
                })}
              </p>

              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Distans
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
              <p className="text-sm font-semibold text-white">
                {formatSaving({
                  value:
                    comparison.workMinutesSaved,
                  unit:
                    "minutes",
                })}
              </p>

              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Arbetsdag
              </p>
            </div>
          </div>

          {!comparison.improved && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-sm text-slate-400">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <p>
                Ingen kandidat gav ett bättre genomförbart score än den nuvarande rutten.
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 xl:w-48 xl:flex-col">
          <button
            type="button"
            onClick={
              onPreview
            }
            disabled={
              !comparison.improved ||
              isRejected
            }
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-purple-400/20 bg-purple-400/[0.07] px-4 py-2.5 text-sm font-semibold text-purple-200 transition hover:bg-purple-400/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPreviewing
              ? "Stäng preview"
              : "Visa förslag"}

            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={
              onAccept
            }
            disabled={
              !comparison.improved ||
              isRejected ||
              isAccepted
            }
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            Godkänn
          </button>

          <button
            type="button"
            onClick={
              onReject
            }
            disabled={
              isAccepted ||
              isRejected
            }
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.055] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" />
            Avvisa
          </button>
        </div>
      </div>
    </article>
  );
}