"use client";

import {
  Clock3,
  Gauge,
  MapPinned,
  Route,
} from "lucide-react";

type Props = {
  improvedRouteCount: number;
  totalCandidates: number;
  totalDriveMinutesSaved: number;
  totalDistanceSavedMeters: number;
};

function formatMinutes(
  minutes: number,
) {
  const absoluteMinutes =
    Math.abs(
      Math.round(minutes),
    );

  if (
    absoluteMinutes < 60
  ) {
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
    kilometers >= 10 ? 0 : 1,
  )} km`;
}

type MetricCardProps = {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  emphasis?:
    | "purple"
    | "green";
};

function MetricCard({
  icon,
  value,
  label,
  emphasis = "purple",
}: MetricCardProps) {
  const accent =
    emphasis === "green"
      ? "text-emerald-300"
      : "text-purple-300";

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div
        className={[
          "flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-black/10",
          accent,
        ].join(" ")}
      >
        {icon}
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

export default function OptimizerSummary({
  improvedRouteCount,
  totalCandidates,
  totalDriveMinutesSaved,
  totalDistanceSavedMeters,
}: Props) {
  return (
    <section className="grid gap-3 border-b border-white/[0.06] bg-[#0d1322] px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        icon={
          <Route className="h-4 w-4" />
        }
        value={
          improvedRouteCount
        }
        label="Förbättrade rutter"
      />

      <MetricCard
        icon={
          <Gauge className="h-4 w-4" />
        }
        value={totalCandidates}
        label="Kandidater testade"
      />

      <MetricCard
        icon={
          <Clock3 className="h-4 w-4" />
        }
        value={formatMinutes(
          totalDriveMinutesSaved,
        )}
        label="Möjlig tidsvinst"
        emphasis="green"
      />

      <MetricCard
        icon={
          <MapPinned className="h-4 w-4" />
        }
        value={formatDistance(
          totalDistanceSavedMeters,
        )}
        label="Möjlig distansvinst"
        emphasis="green"
      />
    </section>
  );
}