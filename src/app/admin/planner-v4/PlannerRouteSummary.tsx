
"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Eye,
  MapPinned,
  Route,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import {
  usePlannerPreview,
} from "./preview/usePlannerPreview";
import type {
  TechnicianRoute,
} from "./routing";

type Props = {
  route: TechnicianRoute;
};

function formatMinutes(
  value: number,
) {
  const absoluteValue =
    Math.abs(value);

  const hours =
    Math.floor(
      absoluteValue / 60,
    );

  const minutes =
    absoluteValue % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

function formatDistance(
  meters: number,
) {
  const absoluteMeters =
    Math.abs(meters);

  if (absoluteMeters < 1000) {
    return `${Math.round(
      absoluteMeters,
    )} m`;
  }

  return `${(
    absoluteMeters / 1000
  ).toFixed(1)} km`;
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
    return unit === "minutes"
      ? "Oförändrad"
      : "Oförändrad";
  }

  if (value > 0) {
    return unit === "minutes"
      ? `Sparar ${formatMinutes(
          value,
        )}`
      : `Sparar ${formatDistance(
          value,
        )}`;
  }

  return unit === "minutes"
    ? `Ökar ${formatMinutes(
        value,
      )}`
    : `Ökar ${formatDistance(
        value,
      )}`;
}

function MetricCard({
  icon,
  label,
  currentValue,
  previewValue,
  savingLabel,
  previewActive,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  currentValue: string;
  previewValue?: string;
  savingLabel?: string;
  previewActive: boolean;
  tone:
    | "blue"
    | "purple"
    | "emerald"
    | "amber";
}) {
  const toneClasses = {
    blue:
      "border-blue-400/15 bg-blue-400/[0.06] text-blue-300",
    purple:
      "border-purple-400/15 bg-purple-400/[0.06] text-purple-300",
    emerald:
      "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300",
    amber:
      "border-amber-400/15 bg-amber-400/[0.06] text-amber-300",
  } as const;

  return (
    <article
      className={`rounded-2xl border p-4 ${toneClasses[tone]}`}
    >
      {icon}

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>

      {!previewActive && (
        <p className="mt-1 text-xl font-bold text-white">
          {currentValue}
        </p>
      )}

      {previewActive && (
        <>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-400">
              {currentValue}
            </span>

            <ArrowRight className="h-4 w-4 text-slate-600" />

            <span className="text-xl font-bold text-white">
              {previewValue}
            </span>
          </div>

          {savingLabel && (
            <span className="mt-3 inline-flex rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
              {savingLabel}
            </span>
          )}
        </>
      )}
    </article>
  );
}

export default function PlannerRouteSummary({
  route,
}: Props) {
  const {
    isPreviewing,
    technicianName:
      previewTechnicianName,
    comparison,
  } = usePlannerPreview();

  const previewActive =
    Boolean(
      isPreviewing &&
        comparison &&
        previewTechnicianName ===
          route.technicianName,
    );

  const {
    totalDistanceMeters,
    totalDriveMinutes,
    totalServiceMinutes,
    totalWorkMinutes,
  } = route.summary;

  const previewMetrics =
    previewActive && comparison
      ? comparison.candidate.metrics
      : null;

  const driveMinutesSaved =
    previewActive && comparison
      ? comparison.driveMinutesSaved
      : 0;

  const distanceSavedMeters =
    previewActive && comparison
      ? comparison.distanceSavedMeters
      : 0;

  const workMinutesSaved =
    previewActive && comparison
      ? comparison.workMinutesSaved
      : 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020] shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 border-b border-white/[0.07] bg-[#10182b] px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-300">
              Ruttöversikt
            </p>

            {previewActive && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-purple-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI Preview
              </span>
            )}
          </div>

          <h2 className="mt-1 text-lg font-semibold text-white">
            {route.technicianName}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {route.date}
          </p>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300">
          {route.summary.jobCount} jobb
        </span>
      </div>

      {previewActive && comparison && (
        <div className="border-b border-purple-400/15 bg-purple-400/[0.05] px-5 py-4">
          <div className="flex items-start gap-3">
            <Eye className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />

            <div>
              <p className="text-sm font-semibold text-purple-100">
                Förhandsvisning av AI-förslag
              </p>

              <p className="mt-1 text-sm leading-6 text-purple-100/65">
                Värdena nedan kommer från
                kandidatens simulerade metrics.
                Ingen rutt eller arbetsorder har
                sparats.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={
            <Route className="h-5 w-5" />
          }
          label="Körtid"
          currentValue={formatMinutes(
            totalDriveMinutes,
          )}
          previewValue={
            previewMetrics
              ? formatMinutes(
                  previewMetrics
                    .totalDriveMinutes,
                )
              : undefined
          }
          savingLabel={
            previewActive
              ? formatSaving({
                  value:
                    driveMinutesSaved,
                  unit: "minutes",
                })
              : undefined
          }
          previewActive={previewActive}
          tone="blue"
        />

        <MetricCard
          icon={
            <MapPinned className="h-5 w-5" />
          }
          label="Körsträcka"
          currentValue={formatDistance(
            totalDistanceMeters,
          )}
          previewValue={
            previewMetrics
              ? formatDistance(
                  previewMetrics
                    .totalDistanceMeters,
                )
              : undefined
          }
          savingLabel={
            previewActive
              ? formatSaving({
                  value:
                    distanceSavedMeters,
                  unit: "distance",
                })
              : undefined
          }
          previewActive={previewActive}
          tone="purple"
        />

        <MetricCard
          icon={
            <BriefcaseBusiness className="h-5 w-5" />
          }
          label="Arbetstid"
          currentValue={formatMinutes(
            totalServiceMinutes,
          )}
          previewValue={
            previewMetrics
              ? formatMinutes(
                  previewMetrics
                    .totalServiceMinutes,
                )
              : undefined
          }
          savingLabel={
            previewActive
              ? "Servicetid oförändrad"
              : undefined
          }
          previewActive={previewActive}
          tone="emerald"
        />

        <MetricCard
          icon={
            <Clock3 className="h-5 w-5" />
          }
          label="Total dag"
          currentValue={formatMinutes(
            totalWorkMinutes,
          )}
          previewValue={
            previewMetrics
              ? formatMinutes(
                  previewMetrics
                    .totalWorkMinutes,
                )
              : undefined
          }
          savingLabel={
            previewActive
              ? formatSaving({
                  value:
                    workMinutesSaved,
                  unit: "minutes",
                })
              : undefined
          }
          previewActive={previewActive}
          tone="amber"
        />
      </div>

      {previewActive &&
        comparison &&
        !comparison.candidate.score
          .feasible && (
          <div className="border-t border-red-400/15 bg-red-400/[0.05] px-5 py-4">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

              <div>
                <p className="text-sm font-semibold text-red-100">
                  Kandidaten är inte
                  genomförbar
                </p>

                <p className="mt-1 text-sm leading-6 text-red-100/70">
                  Förslaget innehåller
                  blockerande constraints och
                  kan inte godkännas.
                </p>
              </div>
            </div>
          </div>
        )}

      {route.warnings.length > 0 && (
        <div className="border-t border-amber-400/15 bg-amber-400/[0.05] px-5 py-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />

            <div>
              <p className="text-sm font-semibold text-amber-100">
                Varningar
              </p>

              <ul className="mt-2 space-y-1 text-sm text-amber-100/70">
                {route.warnings.map(
                  (warning) => (
                    <li key={warning}>
                      {warning}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}