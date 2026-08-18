"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Gauge,
  MapPinned,
  Route,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import type {
  RouteOptimizationComparison,
} from "../routing/optimization/types";

type Props = {
  comparison: RouteOptimizationComparison;
  technicianName?: string;
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

function ComparisonRow({
  icon,
  label,
  baselineValue,
  candidateValue,
  improvementLabel,
  improved,
}: {
  icon: React.ReactNode;
  label: string;
  baselineValue: string;
  candidateValue: string;
  improvementLabel: string;
  improved: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:grid-cols-[1.4fr_1fr_auto_1fr] sm:items-center">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-purple-300">
          {icon}
        </span>

        <p className="font-semibold text-white">
          {label}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Nuvarande
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-200">
          {baselineValue}
        </p>
      </div>

      <ArrowRight className="hidden h-4 w-4 text-slate-600 sm:block" />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Förslag
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-white">
            {candidateValue}
          </p>

          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
              improved
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                : "border-white/10 bg-white/[0.04] text-slate-400"
            }`}
          >
            {improvementLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OptimizerComparison({
  comparison,
  technicianName,
  className = "",
}: Props) {
  const {
    baseline,
    candidate,
    improved,
    percentageImprovement,
    distanceSavedMeters,
    driveMinutesSaved,
    workMinutesSaved,
    scoreImprovement,
  } = comparison;

  const distanceImproved =
    distanceSavedMeters > 0;

  const driveImproved =
    driveMinutesSaved > 0;

  const workImproved =
    workMinutesSaved > 0;

  const scoreImproved =
    scoreImprovement > 0;

  return (
    <section
      className={[
        "overflow-hidden rounded-3xl border border-white/10",
        "bg-[#0b1020] shadow-2xl shadow-black/20",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="border-b border-white/[0.07] bg-gradient-to-r from-purple-500/15 via-fuchsia-500/10 to-transparent px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
              Route Comparison
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Nuvarande rutt mot förslag
            </h2>

            {technicianName && (
              <p className="mt-1 text-sm text-slate-400">
                {technicianName}
              </p>
            )}
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
              improved
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                : "border-white/10 bg-white/[0.04] text-slate-400"
            }`}
          >
            {improved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <TriangleAlert className="h-4 w-4" />
            )}

            {improved
              ? `${percentageImprovement.toFixed(
                  1,
                )}% bättre`
              : "Ingen total förbättring"}
          </div>
        </div>
      </header>

      <div className="space-y-3 p-4">
        <ComparisonRow
          icon={
            <Clock3 className="h-4 w-4" />
          }
          label="Körtid"
          baselineValue={formatMinutes(
            baseline.metrics
              .totalDriveMinutes,
          )}
          candidateValue={formatMinutes(
            candidate.metrics
              .totalDriveMinutes,
          )}
          improvementLabel={
            driveMinutesSaved > 0
              ? `-${formatMinutes(
                  driveMinutesSaved,
                )}`
              : driveMinutesSaved < 0
                ? `+${formatMinutes(
                    driveMinutesSaved,
                  )}`
                : "Oförändrad"
          }
          improved={driveImproved}
        />

        <ComparisonRow
          icon={
            <MapPinned className="h-4 w-4" />
          }
          label="Körsträcka"
          baselineValue={formatDistance(
            baseline.metrics
              .totalDistanceMeters,
          )}
          candidateValue={formatDistance(
            candidate.metrics
              .totalDistanceMeters,
          )}
          improvementLabel={
            distanceSavedMeters > 0
              ? `-${formatDistance(
                  distanceSavedMeters,
                )}`
              : distanceSavedMeters < 0
                ? `+${formatDistance(
                    distanceSavedMeters,
                  )}`
                : "Oförändrad"
          }
          improved={distanceImproved}
        />

        <ComparisonRow
          icon={
            <Route className="h-4 w-4" />
          }
          label="Total arbetsdag"
          baselineValue={formatMinutes(
            baseline.metrics
              .totalWorkMinutes,
          )}
          candidateValue={formatMinutes(
            candidate.metrics
              .totalWorkMinutes,
          )}
          improvementLabel={
            workMinutesSaved > 0
              ? `-${formatMinutes(
                  workMinutesSaved,
                )}`
              : workMinutesSaved < 0
                ? `+${formatMinutes(
                    workMinutesSaved,
                  )}`
                : "Oförändrad"
          }
          improved={workImproved}
        />

        <ComparisonRow
          icon={
            <Gauge className="h-4 w-4" />
          }
          label="Optimizer score"
          baselineValue={baseline.score.total.toFixed(
            2,
          )}
          candidateValue={candidate.score.total.toFixed(
            2,
          )}
          improvementLabel={
            scoreImprovement > 0
              ? `-${scoreImprovement.toFixed(
                  2,
                )}`
              : scoreImprovement < 0
                ? `+${Math.abs(
                    scoreImprovement,
                  ).toFixed(2)}`
                : "Oförändrad"
          }
          improved={scoreImproved}
        />
      </div>

      <div className="grid gap-4 border-t border-white/[0.07] bg-[#10182b] p-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck
              className={`h-5 w-5 ${
                candidate.score.feasible
                  ? "text-emerald-300"
                  : "text-red-300"
              }`}
            />

            <div>
              <p className="font-semibold text-white">
                Constraint-status
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {candidate.score.feasible
                  ? "Kandidaten är genomförbar."
                  : "Kandidaten har blockerande violations."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Stoppordning
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            {baseline.stopOrder.join(
              " → ",
            )}
          </p>

          <p className="mt-3 text-sm leading-6 text-purple-200">
            {candidate.stopOrder.join(
              " → ",
            )}
          </p>
        </div>
      </div>
    </section>
  );
}