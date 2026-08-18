"use client";

import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  MapPinned,
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
  isPreviewing?: boolean;
  isAccepted?: boolean;
  isRejected?: boolean;
  onPreview?: (
    technicianName: string,
    comparison: RouteOptimizationComparison,
  ) => void;
  onClearPreview?: () => void;
  onAccept?: (
    technicianName: string,
    comparison: RouteOptimizationComparison,
  ) => void;
  onReject?: (
    technicianName: string,
  ) => void;
  className?: string;
};

function formatMinutes(
  minutes: number,
) {
  const absoluteMinutes =
    Math.abs(minutes);

  if (absoluteMinutes < 60) {
    return `${absoluteMinutes} min`;
  }

  const hours =
    Math.floor(
      absoluteMinutes / 60,
    );

  const remainder =
    absoluteMinutes % 60;

  return remainder > 0
    ? `${hours} h ${remainder} min`
    : `${hours} h`;
}

function formatDistance(
  distanceMeters: number,
) {
  const distanceKm =
    Math.abs(distanceMeters) /
    1000;

  return `${distanceKm.toFixed(
    distanceKm >= 10 ? 0 : 1,
  )} km`;
}

function formatSaving({
  value,
  unit,
}: {
  value: number;
  unit: "minutes" | "distance";
}) {
  if (value === 0) {
    return unit === "minutes"
      ? "0 min"
      : "0 km";
  }

  const prefix =
    value > 0 ? "-" : "+";

  return unit === "minutes"
    ? `${prefix}${formatMinutes(
        value,
      )}`
    : `${prefix}${formatDistance(
        value,
      )}`;
}

export default function OptimizerCandidateCard({
  technicianName,
  comparison,
  evaluatedCandidates,
  isPreviewing = false,
  isAccepted = false,
  isRejected = false,
  onPreview,
  onClearPreview,
  onAccept,
  onReject,
  className = "",
}: Props) {
  const {
    baseline,
    candidate,
    improved,
    percentageImprovement,
    driveMinutesSaved,
    distanceSavedMeters,
    workMinutesSaved,
  } = comparison;

  const scoreDelta =
    baseline.score.total -
    candidate.score.total;

  const hasBlockingViolations =
    !candidate.score.feasible;

  return (
    <article
      className={[
        "rounded-2xl border p-5 transition",
        isAccepted
          ? "border-emerald-400/30 bg-emerald-400/[0.08]"
          : isRejected
            ? "border-white/10 bg-white/[0.02] opacity-60"
            : improved
              ? "border-purple-400/20 bg-purple-400/[0.05]"
              : "border-white/10 bg-white/[0.03]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                improved
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-white/[0.05] text-slate-400"
              }`}
            >
              {improved ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Route className="h-5 w-5" />
              )}
            </span>

            <div>
              <h3 className="font-semibold text-white">
                {technicianName}
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                {evaluatedCandidates} kandidater
                analyserade
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                improved
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/[0.04] text-slate-400"
              }`}
            >
              {improved
                ? `${percentageImprovement.toFixed(
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
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-400">
                Avvisad
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <Clock3 className="h-4 w-4 text-purple-300" />

              <p className="mt-2 text-sm font-semibold text-white">
                {formatSaving({
                  value:
                    driveMinutesSaved,
                  unit: "minutes",
                })}
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                körtid
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <MapPinned className="h-4 w-4 text-purple-300" />

              <p className="mt-2 text-sm font-semibold text-white">
                {formatSaving({
                  value:
                    distanceSavedMeters,
                  unit: "distance",
                })}
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                distans
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <Route className="h-4 w-4 text-purple-300" />

              <p className="mt-2 text-sm font-semibold text-white">
                {formatSaving({
                  value:
                    workMinutesSaved,
                  unit: "minutes",
                })}
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                arbetsdag
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <Gauge className="h-4 w-4 text-purple-300" />

              <p className="mt-2 text-sm font-semibold text-white">
                {scoreDelta.toFixed(2)}
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                score-vinst
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Score breakdown
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Lägre total score är bättre.
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-slate-300">
                {baseline.score.total.toFixed(
                  2,
                )}{" "}
                →{" "}
                {candidate.score.total.toFixed(
                  2,
                )}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <ScoreItem
                label="Körtid"
                value={
                  candidate.score
                    .breakdown
                    .driveTimeScore
                }
              />

              <ScoreItem
                label="Distans"
                value={
                  candidate.score
                    .breakdown
                    .distanceScore
                }
              />

              <ScoreItem
                label="Arbetstid"
                value={
                  candidate.score
                    .breakdown
                    .totalWorkTimeScore
                }
              />

              <ScoreItem
                label="Balans"
                value={
                  candidate.score
                    .breakdown
                    .workloadBalanceScore
                }
              />

              <ScoreItem
                label="Penalty"
                value={
                  candidate.score
                    .breakdown
                    .constraintPenalty
                }
              />
            </div>
          </div>

          {hasBlockingViolations && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-200">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />

              <div>
                <p className="font-semibold">
                  Kandidaten bryter mot constraints
                </p>

                <p className="mt-1 text-red-200/75">
                  Förslaget kan inte godkännas
                  förrän blockerande violations
                  har lösts.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 xl:w-48 xl:flex-col">
          <button
            type="button"
            onClick={() =>
              isPreviewing
                ? onClearPreview?.()
                : onPreview?.(
                    technicianName,
                    comparison,
                  )
            }
            disabled={
              !improved ||
              isRejected ||
              hasBlockingViolations
            }
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-purple-400/20 bg-purple-400/[0.08] px-4 py-2.5 text-sm font-semibold text-purple-200 transition hover:bg-purple-400/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPreviewing
              ? "Stäng preview"
              : "Visa förslag"}

            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              onAccept?.(
                technicianName,
                comparison,
              )
            }
            disabled={
              !improved ||
              isRejected ||
              isAccepted ||
              hasBlockingViolations
            }
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            Godkänn
          </button>

          <button
            type="button"
            onClick={() =>
              onReject?.(
                technicianName,
              )
            }
            disabled={
              isAccepted ||
              isRejected
            }
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" />
            Avvisa
          </button>
        </div>
      </div>
    </article>
  );
}

function ScoreItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-white">
        {value.toFixed(2)}
      </p>
    </div>
  );
}