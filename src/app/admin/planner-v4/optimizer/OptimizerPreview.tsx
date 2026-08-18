"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  ArrowDown,
  ArrowRight,
  Check,
  Clock3,
  Eye,
  Loader2,
  MapPinned,
  Route,
  ShieldCheck,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";

import type {
  RouteOptimizationComparison,
  RouteOptimizationStopSnapshot,
} from "../routing/optimization/types";
import {
  applyOptimizationAction,
  rollbackOptimizationAction,
} from "./applyOptimizationAction";

import {
  usePlannerPreview,
} from "../preview/usePlannerPreview";

type Props = {
  technicianName: string;
  comparison: RouteOptimizationComparison;
  onAccept?: (
    technicianName: string,
    comparison: RouteOptimizationComparison,
  ) => void;
  onClose?: () => void;
  className?: string;
};

type StopChange = {
  stop: RouteOptimizationStopSnapshot;
  baselineIndex: number;
  candidateIndex: number;
  moved: boolean;
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

function getStopChanges(
  comparison: RouteOptimizationComparison,
): StopChange[] {
  const baselineIndexes =
    new Map(
      comparison.baseline.stopOrder.map(
        (stopId, index) => [
          stopId,
          index,
        ],
      ),
    );

  const stopMap =
    new Map(
      comparison.candidate.stops.map(
        (stop) => [
          stop.id,
          stop,
        ],
      ),
    );

  return comparison.candidate.stopOrder
    .map(
      (
        stopId,
        candidateIndex,
      ) => {
        const stop =
          stopMap.get(stopId);

        if (!stop) {
          return null;
        }

        const baselineIndex =
          baselineIndexes.get(
            stopId,
          ) ?? -1;

        return {
          stop,
          baselineIndex,
          candidateIndex,
          moved:
            baselineIndex !==
            candidateIndex,
        };
      },
    )
    .filter(
      (
        change,
      ): change is StopChange =>
        change !== null,
    );
}

function getBaselineStopMap(
  comparison: RouteOptimizationComparison,
) {
  return new Map(
    comparison.baseline.stops.map(
      (stop) => [
        stop.id,
        stop,
      ],
    ),
  );
}

function MetricCard({
  icon,
  label,
  currentValue,
  proposedValue,
  saving,
}: {
  icon: React.ReactNode;
  label: string;
  currentValue: string;
  proposedValue: string;
  saving: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="flex items-center gap-2 text-purple-300">
        {icon}

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Nuvarande
          </p>

          <p className="mt-1 font-semibold text-slate-300">
            {currentValue}
          </p>
        </div>

        <ArrowRight className="h-4 w-4 text-slate-600" />

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Förslag
          </p>

          <p className="mt-1 font-semibold text-white">
            {proposedValue}
          </p>
        </div>
      </div>

      <span className="mt-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
        {saving}
      </span>
    </div>
  );
}

function StopBadge({
  index,
  moved = false,
}: {
  index: number;
  moved?: boolean;
}) {
  return (
    <span
      className={[
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
        moved
          ? "bg-purple-400/15 text-purple-200"
          : "bg-white/[0.05] text-slate-400",
      ].join(" ")}
    >
      {index + 1}
    </span>
  );
}

export default function OptimizerPreview({
  technicianName,
  comparison,
  onAccept,
  onClose,
  className = "",
}: Props) {
  const {
    baseline,
    candidate,
    improved,
    driveMinutesSaved,
    distanceSavedMeters,
    workMinutesSaved,
  } = comparison;

  const stopChanges =
    getStopChanges(comparison);

  const movedStops =
    stopChanges.filter(
      (change) =>
        change.moved,
    );

  const baselineStopMap =
    getBaselineStopMap(
      comparison,
    );

  const canAccept =
    improved &&
    candidate.score.feasible;

  const [isApplying, startApplyTransition] =
    useTransition();
  const [applyMessage, setApplyMessage] =
    useState("");
  const [applyError, setApplyError] =
    useState("");

  const [
    confirmApply,
    setConfirmApply,
  ] = useState(false);

  const {
    rollbackSnapshot,
    canRollback,
    appliedOptimization,
    hasAppliedOptimization,
    setRollbackSnapshot,
    clearRollbackSnapshot,
    setAppliedOptimization,
    clearAppliedOptimization,
  } = usePlannerPreview();

  const [
    rollbackError,
    setRollbackError,
  ] = useState("");

  const [
    rollbackMessage,
    setRollbackMessage,
  ] = useState("");

  const [
    isRollingBack,
    startRollbackTransition,
  ] = useTransition();

  function applyCandidate() {
    if (!canAccept || isApplying) {
      return;
    }

    setApplyMessage("");
    setApplyError("");
    setRollbackError("");
    setRollbackMessage("");

    startApplyTransition(async () => {
      const result =
        await applyOptimizationAction({
          candidate,
        });

      if (!result.success) {
        setApplyError(result.message);
        return;
      }

      setApplyMessage(result.message);

      setRollbackSnapshot(
        result.rollback,
      );

      setAppliedOptimization({
        technicianName,
        candidateId:
          candidate.id,
        appliedAt:
          new Date().toISOString(),
        appliedCount:
          result.applied.length,
      });

      setConfirmApply(false);

      onAccept?.(
        technicianName,
        comparison,
      );
    });
  }

  function rollbackCandidate() {
    if (
      !canRollback ||
      !rollbackSnapshot ||
      isRollingBack
    ) {
      return;
    }

    setRollbackError("");
    setRollbackMessage("");

    startRollbackTransition(
      async () => {
        const result =
          await rollbackOptimizationAction({
            snapshot:
              rollbackSnapshot,
          });

        if (!result.success) {
          setRollbackError(
            result.message,
          );
          return;
        }

        setRollbackMessage(
          result.message,
        );

        setApplyMessage("");

        clearRollbackSnapshot();
        clearAppliedOptimization();
      },
    );
  }

  return (
    <section
      className={[
        "overflow-hidden rounded-[1.75rem] border border-purple-400/20",
        "bg-[#0b1020] shadow-2xl shadow-black/30",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="border-b border-white/[0.07] bg-gradient-to-r from-purple-500/15 via-fuchsia-500/10 to-transparent px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-400/10 text-purple-200">
              <Eye className="h-6 w-6" />
            </span>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
                AI Route Preview
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Föreslagen rutt för{" "}
                {technicianName}
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                Jämför nuvarande stoppordning med det föreslagna alternativet innan du godkänner förändringen.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Stäng optimizer-preview"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-4 border-b border-white/[0.07] bg-[#10182b] p-4 md:grid-cols-3">
        <MetricCard
          icon={
            <Clock3 className="h-4 w-4" />
          }
          label="Körtid"
          currentValue={formatMinutes(
            baseline.metrics
              .totalDriveMinutes,
          )}
          proposedValue={formatMinutes(
            candidate.metrics
              .totalDriveMinutes,
          )}
          saving={
            driveMinutesSaved > 0
              ? `Sparar ${formatMinutes(
                  driveMinutesSaved,
                )}`
              : "Ingen tidsvinst"
          }
        />

        <MetricCard
          icon={
            <MapPinned className="h-4 w-4" />
          }
          label="Distans"
          currentValue={formatDistance(
            baseline.metrics
              .totalDistanceMeters,
          )}
          proposedValue={formatDistance(
            candidate.metrics
              .totalDistanceMeters,
          )}
          saving={
            distanceSavedMeters > 0
              ? `Sparar ${formatDistance(
                  distanceSavedMeters,
                )}`
              : "Ingen distansvinst"
          }
        />

        <MetricCard
          icon={
            <Route className="h-4 w-4" />
          }
          label="Arbetsdag"
          currentValue={formatMinutes(
            baseline.metrics
              .totalWorkMinutes,
          )}
          proposedValue={formatMinutes(
            candidate.metrics
              .totalWorkMinutes,
          )}
          saving={
            workMinutesSaved > 0
              ? `Sparar ${formatMinutes(
                  workMinutesSaved,
                )}`
              : "Ingen tidsvinst"
          }
        />
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Före vs efter
              </p>

              <h3 className="mt-1 font-semibold text-white">
                {movedStops.length} stopp flyttas
              </h3>
            </div>

            <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-200">
              {candidate.stopOrder.length} stopp
            </span>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Nuvarande
                </p>

                <span className="text-[10px] text-slate-600">
                  Baseline
                </span>
              </div>

              <div className="space-y-2">
                {baseline.stopOrder.map(
                  (
                    stopId,
                    index,
                  ) => {
                    const stop =
                      baselineStopMap.get(
                        stopId,
                      );

                    if (!stop) {
                      return null;
                    }

                    const candidateIndex =
                      candidate.stopOrder.indexOf(
                        stopId,
                      );

                    const moved =
                      candidateIndex !==
                      index;

                    return (
                      <div
                        key={stop.id}
                        className={[
                          "flex items-center gap-3 rounded-xl border p-3",
                          moved
                            ? "border-purple-400/15 bg-purple-400/[0.045]"
                            : "border-white/[0.06] bg-white/[0.02]",
                        ].join(" ")}
                      >
                        <StopBadge
                          index={index}
                          moved={moved}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {stop.label}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {stop.type}
                            {stop.workOrderId
                              ? ` · Arbetsorder #${stop.workOrderId}`
                              : ""}
                          </p>
                        </div>

                        {moved && (
                          <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-slate-400">
                            → {candidateIndex + 1}
                          </span>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-purple-400/15 bg-purple-400/[0.025] p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-purple-300">
                  Förslag
                </p>

                <span className="text-[10px] text-purple-200/50">
                  Candidate
                </span>
              </div>

              <div className="space-y-2">
                {stopChanges.map(
                  ({
                    stop,
                    baselineIndex,
                    candidateIndex,
                    moved,
                  }) => (
                    <div
                      key={stop.id}
                      className={[
                        "flex items-center gap-3 rounded-xl border p-3",
                        moved
                          ? "border-purple-400/25 bg-purple-400/[0.08]"
                          : "border-white/[0.06] bg-white/[0.02]",
                      ].join(" ")}
                    >
                      <StopBadge
                        index={candidateIndex}
                        moved={moved}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {stop.label}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {stop.type}
                          {stop.workOrderId
                            ? ` · Arbetsorder #${stop.workOrderId}`
                            : ""}
                        </p>
                      </div>

                      {moved && (
                        <span className="shrink-0 rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-1 text-[10px] font-semibold text-purple-200">
                          {baselineIndex + 1} → {candidateIndex + 1}
                        </span>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  candidate.score.feasible
                    ? "text-emerald-300"
                    : "text-red-300"
                }`}
              />

              <div>
                <p className="font-semibold text-white">
                  Constraint-status
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {candidate.score.feasible
                    ? "Förslaget har inga blockerande constraint-brott."
                    : "Förslaget har blockerande constraint-brott och kan inte godkännas."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />

              <div>
                <p className="font-semibold text-amber-100">
                  Google Routes-preview saknas
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-100/70">
                  Kandidaten återanvänder ännu befintliga route metrics. En ny polyline, trafikdata och verklig ETA kräver ett nytt Routes-anrop för denna stoppordning.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Score
            </p>

            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Nuvarande
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-300">
                  {baseline.score.total.toFixed(
                    2,
                  )}
                </p>
              </div>

              <ArrowDown className="mb-2 h-5 w-5 -rotate-90 text-slate-600" />

              <div className="text-right">
                <p className="text-sm text-slate-500">
                  Förslag
                </p>

                <p className="mt-1 text-2xl font-semibold text-white">
                  {candidate.score.total.toFixed(
                    2,
                  )}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="flex flex-col gap-3 border-t border-white/[0.07] bg-[#10182b] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          Jämför rutten visuellt innan du godkänner den. Inga ändringar sparas förrän du väljer att acceptera förslaget.
        </p>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {applyError && (
            <p
              role="alert"
              className="max-w-md text-xs leading-5 text-red-300"
            >
              {applyError}
            </p>
          )}

          {applyMessage && (
            <p
              role="status"
              className="max-w-md text-xs leading-5 text-emerald-300"
            >
              {applyMessage}
            </p>
          )}

          {hasAppliedOptimization &&
          appliedOptimization && (
            <div className="max-w-md rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-xs leading-5 text-emerald-200">
              <p className="font-semibold">
                AI-plan tillämpad
              </p>

              <p className="mt-0.5 text-emerald-200/70">
                {appliedOptimization.appliedCount} jobb ·{" "}
                {appliedOptimization.technicianName}
              </p>
            </div>
          )}

          {rollbackError && (
            <p
              role="alert"
              className="max-w-md text-xs leading-5 text-red-300"
            >
              {rollbackError}
            </p>
          )}

          {rollbackMessage && (
            <p
              role="status"
              className="max-w-md text-xs leading-5 text-sky-300"
            >
              {rollbackMessage}
            </p>
          )}

          {canRollback &&
          rollbackSnapshot && (
            <button
              type="button"
              onClick={
                rollbackCandidate
              }
              disabled={
                isRollingBack ||
                isApplying
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/[0.08] px-5 py-2.5 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRollingBack ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4" />
              )}

              {isRollingBack
                ? "Återställer..."
                : "Ångra senaste optimering"}
            </button>
          )}

          {!canRollback &&
          !rollbackSnapshot &&
          (!confirmApply ? (
            <button
              type="button"
              onClick={() => {
                setApplyMessage("");
                setApplyError("");
                setConfirmApply(true);
              }}
              disabled={!canAccept || isApplying}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.09] px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/[0.15] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              Godkänn och tillämpa
            </button>
          ) : (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
              <p className="max-w-md text-xs leading-5 text-amber-100/80">
                Bekräfta att du vill skriva det Google-verifierade AI-förslaget till Planner. Jobbens tider kan ändras.
              </p>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmApply(false)
                  }
                  disabled={isApplying}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Avbryt
                </button>

                <button
                  type="button"
                  onClick={applyCandidate}
                  disabled={!canAccept || isApplying}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.12] px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/[0.18] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isApplying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}

                  {isApplying
                    ? "Tillämpar..."
                    : "Bekräfta ändring"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </footer>
    </section>
  );
}