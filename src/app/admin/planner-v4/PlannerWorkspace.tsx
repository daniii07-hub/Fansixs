"use client";

import {
  Loader2,
  Sparkles,
  Undo2,
} from "lucide-react";
import {
  useEffect,
  useState,
  useTransition,
} from "react";

import PlannerRouteMap from "./map/PlannerRouteMap";
import PlannerV4Timeline from "./PlannerV4Timeline";

import type {
  PlannerEventWithDate,
} from "../planner/queries";
import type {
  TechnicianRoute,
} from "./routing";
import {
  rollbackOptimizationAction,
} from "./optimizer/applyOptimizationAction";
import {
  getLatestAppliedOptimizationAction,
} from "./optimizer/getLatestAppliedOptimizationAction";
import {
  usePlannerPreview,
} from "./preview/usePlannerPreview";

type Technician = {
  id: string;
  name: string;
};

type Props = {
  date: string;
  events: PlannerEventWithDate[];
  technicians: Technician[];
  routes: Record<
    string,
    TechnicianRoute
  >;
  selectedJobId?: number | null;
  hoveredJobId?: number | null;
  selectedTechnician?: string | null;
  onJobSelect?: (
    eventId: number,
  ) => void;
  onJobHoverChange?: (
    eventId: number | null,
  ) => void;
  onEventsChange?: (
    events: PlannerEventWithDate[],
  ) => void;
};

function formatAppliedTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "sv-SE",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  );
}

export default function PlannerWorkspace({
  date,
  events,
  technicians,
  routes,
  selectedJobId = null,
  hoveredJobId = null,
  selectedTechnician = null,
  onJobSelect,
  onJobHoverChange,
  onEventsChange,
}: Props) {
  const hasRoutes =
    Object.keys(routes).length > 0;

  const {
    appliedOptimization,
    hasAppliedOptimization,
    rollbackSnapshot,
    canRollback,
    setAppliedOptimization,
    setRollbackSnapshot,
    clearAppliedOptimization,
    clearRollbackSnapshot,
  } = usePlannerPreview();

  const [
    rollbackMessage,
    setRollbackMessage,
  ] = useState("");

  const [
    rollbackError,
    setRollbackError,
  ] = useState("");

  const [
    isRollingBack,
    startRollbackTransition,
  ] = useTransition();

  useEffect(() => {
    let cancelled =
      false;

    async function hydrateAppliedOptimization() {
      /*
       * Finns statusen redan i klient-store behöver
       * vi inte läsa samma körning igen.
       */
      if (
        hasAppliedOptimization &&
        appliedOptimization
      ) {
        return;
      }

      const result =
        await getLatestAppliedOptimizationAction();

      if (
        cancelled ||
        !result.success ||
        !result.optimization
      ) {
        return;
      }

      const persisted =
        result.optimization;

      setAppliedOptimization({
        technicianName:
          persisted.technicianName,
        candidateId:
          persisted.candidateId,
        appliedAt:
          persisted.appliedAt,
        appliedCount:
          persisted.appliedJobCount,
      });

      setRollbackSnapshot(
        persisted.rollbackSnapshot,
      );
    }

    void hydrateAppliedOptimization();

    return () => {
      cancelled = true;
    };
  }, [
    appliedOptimization,
    hasAppliedOptimization,
    setAppliedOptimization,
    setRollbackSnapshot,
  ]);

  function rollbackAppliedOptimization() {
    if (
      !rollbackSnapshot ||
      !canRollback ||
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

        clearRollbackSnapshot();
        clearAppliedOptimization();
      },
    );
  }

  return (
    <div className="space-y-4">
      {hasAppliedOptimization &&
        appliedOptimization && (
          <section className="overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-400/[0.08] via-cyan-400/[0.04] to-transparent shadow-xl shadow-black/10">
            <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                  <Sparkles className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-emerald-100">
                      AI-plan tillämpad
                    </p>

                    <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
                      Google-verifierad
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {appliedOptimization.appliedCount} jobb
                    {" · "}
                    {appliedOptimization.technicianName}
                    {formatAppliedTime(
                      appliedOptimization.appliedAt,
                    )
                      ? ` · ${formatAppliedTime(
                          appliedOptimization.appliedAt,
                        )}`
                      : ""}
                  </p>

                  {rollbackMessage && (
                    <p
                      role="status"
                      className="mt-2 text-xs text-sky-300"
                    >
                      {rollbackMessage}
                    </p>
                  )}

                  {rollbackError && (
                    <p
                      role="alert"
                      className="mt-2 text-xs text-red-300"
                    >
                      {rollbackError}
                    </p>
                  )}
                </div>
              </div>

              {canRollback &&
                rollbackSnapshot && (
                  <button
                    type="button"
                    onClick={
                      rollbackAppliedOptimization
                    }
                    disabled={
                      isRollingBack
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/[0.08] px-4 py-2.5 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
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
            </div>
          </section>
        )}

      <section className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#080d18] shadow-2xl shadow-black/20">
        <header className="flex flex-col gap-3 border-b border-white/[0.06] bg-[#0d1322] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300">
              Dispatch Workspace
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Karta & dagsplanering
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5">
              {events.filter(
                (event) =>
                  String(event.date).slice(
                    0,
                    10,
                  ) === date,
              ).length}{" "}
              jobb
            </span>

            <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5">
              {technicians.length} tekniker
            </span>

            <span
              className={[
                "rounded-full border px-3 py-1.5",
                hasRoutes
                  ? "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300"
                  : "border-white/[0.07] bg-white/[0.025]",
              ].join(" ")}
            >
              {hasRoutes
                ? "Routes online"
                : "Ingen aktiv rutt"}
            </span>

            {hasAppliedOptimization &&
              appliedOptimization && (
                <span className="rounded-full border border-purple-400/15 bg-purple-400/[0.06] px-3 py-1.5 text-purple-200">
                  AI-plan aktiv
                </span>
              )}
          </div>
        </header>

        <div className="grid min-h-[560px] 2xl:grid-cols-[minmax(360px,0.9fr)_minmax(760px,2.1fr)]">
          <aside className="border-b border-white/[0.06] bg-[#0a0f1c] 2xl:border-b-0 2xl:border-r">
            <div className="2xl:sticky 2xl:top-24">
              {hasRoutes ? (
                <div className="min-h-[520px]">
                  <PlannerRouteMap
                    apiKey={
                      process.env
                        .NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                    }
                    routes={routes}
                    selectedTechnician={
                      selectedTechnician
                    }
                    selectedWorkOrderId={
                      selectedJobId
                    }
                    hoveredWorkOrderId={
                      hoveredJobId
                    }
                    onHoveredWorkOrderChange={
                      onJobHoverChange
                    }
                  />
                </div>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
                  <div className="max-w-sm">
                    <p className="text-sm font-semibold text-white">
                      Ingen karta att visa ännu
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      När minst två jobb för samma tekniker kan ruttberäknas visas Google Routes här.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0 bg-[#0b1020]">
            <PlannerV4Timeline
              date={date}
              events={events}
              technicians={technicians}
              routes={routes}
              selectedJobId={
                selectedJobId
              }
              hoveredJobId={
                hoveredJobId
              }
              onJobSelect={
                onJobSelect
              }
              onJobHoverChange={
                onJobHoverChange
              }
              onEventsChange={
                onEventsChange
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}