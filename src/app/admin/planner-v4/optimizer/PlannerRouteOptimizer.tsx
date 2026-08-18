"use client";

import {
  Bot,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import type {
  TechnicianRoute,
} from "../routing/types";
import type {
  RouteOptimizationComparison,
  RouteOptimizationOptions,
} from "../routing/optimization/types";
import OptimizerDashboard from "./OptimizerDashboard";
import OptimizerPreview from "./OptimizerPreview";
import {
  useOptimizer,
} from "./useOptimizer";

type Props = {
  routes:
    | Record<string, TechnicianRoute>
    | TechnicianRoute[];
  selectedTechnician?: string | null;
  optimizationOptions?: RouteOptimizationOptions;
  onPreviewCandidate?: (
    technicianName: string,
    comparison: RouteOptimizationComparison,
  ) => void;
  onClearPreview?: () => void;
  onAcceptCandidate?: (
    technicianName: string,
    comparison: RouteOptimizationComparison,
  ) => void;
  className?: string;
};

export default function PlannerRouteOptimizer({
  routes,
  selectedTechnician,
  optimizationOptions,
  onPreviewCandidate,
  onClearPreview,
  onAcceptCandidate,
  className = "",
}: Props) {
  const optimizer =
    useOptimizer({
      routes,
      selectedTechnician,
      optimizationOptions,
    });

  function previewCandidate(
    technicianName: string,
    comparison:
      RouteOptimizationComparison,
  ) {
    optimizer.previewCandidate(
      technicianName,
      comparison,
    );

    onPreviewCandidate?.(
      technicianName,
      comparison,
    );
  }

  function clearPreview() {
    optimizer.clearPreview();
    onClearPreview?.();
  }

  function acceptCandidate(
    technicianName: string,
    comparison:
      RouteOptimizationComparison,
  ) {
    optimizer.acceptCandidate(
      technicianName,
      comparison,
    );

    onAcceptCandidate?.(
      technicianName,
      comparison,
    );
  }

  const isRunning =
    optimizer.status === "running" ||
    optimizer.isPending;

  const hasResults =
    Object.keys(
      optimizer.results,
    ).length > 0;

  return (
    <section
      className={[
        "space-y-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="overflow-hidden rounded-3xl border border-purple-400/20 bg-[#0b1020] shadow-2xl shadow-black/20">
        <header className="border-b border-white/[0.07] bg-gradient-to-r from-purple-500/15 via-fuchsia-500/10 to-transparent px-6 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-400/10 text-purple-200">
                <Sparkles className="h-6 w-6" />
              </span>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
                  AI Route Optimizer · V1
                </p>

                <h2 className="mt-1 text-xl font-semibold text-white">
                  Optimera dagens rutter
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                  Generera, jämför och
                  förhandsgranska alternativa
                  stoppordningar utan att skriva
                  till Planner eller Supabase.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {hasResults && (
                <button
                  type="button"
                  onClick={
                    optimizer.resetOptimizer
                  }
                  disabled={isRunning}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Återställ
                </button>
              )}

              <button
                type="button"
                onClick={
                  optimizer.runOptimization
                }
                disabled={
                  isRunning ||
                  optimizer.visibleRoutes
                    .length === 0
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}

                {hasResults
                  ? "Kör igen"
                  : "Analysera rutter"}
              </button>
            </div>
          </div>
        </header>

        {optimizer.status ===
          "idle" && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-purple-300">
              <Bot className="h-7 w-7" />
            </span>

            <h3 className="mt-4 font-semibold text-white">
              Ingen analys är körd ännu
            </h3>

            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Starta optimeringen för att
              generera och poängsätta
              alternativa stoppordningar.
            </p>
          </div>
        )}

        {isRunning && (
          <div className="flex items-center justify-center gap-3 px-6 py-12 text-sm text-purple-100">
            <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
            Analyserar rutter och
            kandidater...
          </div>
        )}

        {optimizer.status ===
          "error" && (
          <div className="m-4 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-sm text-red-200">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{optimizer.error}</span>
          </div>
        )}
      </div>

      {optimizer.status ===
        "ready" &&
        hasResults && (
          <OptimizerDashboard
            results={optimizer.results}
            previewTechnician={
              optimizer.previewTechnician
            }
            acceptedTechnician={
              optimizer.acceptedTechnician
            }
            rejectedTechnicians={
              optimizer.rejectedTechnicians
            }
            onPreview={
              previewCandidate
            }
            onClearPreview={
              clearPreview
            }
            onAccept={
              acceptCandidate
            }
            onReject={
              optimizer.rejectCandidate
            }
          />
        )}

      {optimizer.previewTechnician &&
        optimizer.previewComparison && (
          <OptimizerPreview
            technicianName={
              optimizer.previewTechnician
            }
            comparison={
              optimizer.previewComparison
            }
            onAccept={
              acceptCandidate
            }
            onClose={
              clearPreview
            }
          />
        )}
    </section>
  );
}