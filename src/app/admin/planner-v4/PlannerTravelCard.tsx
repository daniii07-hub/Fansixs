"use client";

import {
  AlertTriangle,
  ArrowRight,
  CarFront,
  MapPinned,
} from "lucide-react";
import type {
  RouteLeg,
} from "./routing";

type Props = {
  leg: RouteLeg;
  fromLabel?: string | null;
  toLabel?: string | null;
  nextJobStartTime?: string | null;
  estimatedArrivalTime?: string | null;
  compact?: boolean;
};

function formatDuration(
  seconds: number,
) {
  const minutes = Math.max(
    0,
    Math.round(seconds / 60),
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(minutes / 60);

  const rest =
    minutes % 60;

  return rest > 0
    ? `${hours} h ${rest} min`
    : `${hours} h`;
}

function formatDistance(
  meters: number,
) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(
    meters >= 10000
      ? 0
      : 1,
  )} km`;
}

function parseTimeToMinutes(
  value?: string | null,
) {
  if (!value) {
    return null;
  }

  const [
    hours,
    minutes,
  ] = value
    .slice(0, 5)
    .split(":")
    .map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function getTravelLevel(
  seconds: number,
) {
  const minutes =
    seconds / 60;

  if (minutes < 15) {
    return {
      border:
        "border-emerald-400/15",
      background:
        "bg-emerald-400/[0.035]",
      icon:
        "text-emerald-300",
      badge:
        "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-200",
      label:
        "Kort restid",
    };
  }

  if (minutes <= 30) {
    return {
      border:
        "border-amber-400/15",
      background:
        "bg-amber-400/[0.035]",
      icon:
        "text-amber-300",
      badge:
        "border-amber-400/15 bg-amber-400/[0.07] text-amber-200",
      label:
        "Medellång restid",
    };
  }

  return {
    border:
      "border-red-400/15",
    background:
      "bg-red-400/[0.035]",
    icon:
      "text-red-300",
    badge:
      "border-red-400/15 bg-red-400/[0.07] text-red-200",
    label:
      "Lång restid",
  };
}

export default function PlannerTravelCard({
  leg,
  fromLabel,
  toLabel,
  nextJobStartTime,
  estimatedArrivalTime,
  compact = false,
}: Props) {
  const level =
    getTravelLevel(
      leg.durationSeconds,
    );

  const arrivalMinutes =
    parseTimeToMinutes(
      estimatedArrivalTime,
    );

  const nextStartMinutes =
    parseTimeToMinutes(
      nextJobStartTime,
    );

  const lateRisk =
    arrivalMinutes !== null &&
    nextStartMinutes !== null &&
    arrivalMinutes >
      nextStartMinutes;

  if (compact) {
    return (
      <article
        className={[
          "flex h-full min-h-[28px] items-center overflow-hidden rounded-lg border px-2.5",
          "backdrop-blur-sm",
          level.border,
          level.background,
        ].join(" ")}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span
            className={[
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-black/10",
              level.icon,
            ].join(" ")}
          >
            {lateRisk ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <CarFront className="h-3.5 w-3.5" />
            )}
          </span>

          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-[10px]">
            <span className="shrink-0 font-semibold text-slate-100">
              {formatDuration(
                leg.durationSeconds,
              )}
            </span>

            <span className="text-slate-600">
              •
            </span>

            <span className="inline-flex shrink-0 items-center gap-1 text-slate-400">
              <MapPinned className="h-3 w-3" />
              {formatDistance(
                leg.distanceMeters,
              )}
            </span>

            {estimatedArrivalTime && (
              <>
                <span className="text-slate-600">
                  •
                </span>

                <span
                  className={
                    lateRisk
                      ? "shrink-0 font-semibold text-red-300"
                      : "shrink-0 text-slate-400"
                  }
                >
                  ETA{" "}
                  {estimatedArrivalTime.slice(
                    0,
                    5,
                  )}
                </span>
              </>
            )}

            {(fromLabel ||
              toLabel) && (
              <>
                <span className="text-slate-600">
                  •
                </span>

                <span className="flex min-w-0 items-center gap-1.5 overflow-hidden text-slate-500">
                  <span className="truncate">
                    {fromLabel ??
                      "Föregående"}
                  </span>

                  <ArrowRight className="h-3 w-3 shrink-0" />

                  <span className="truncate">
                    {toLabel ??
                      "Nästa"}
                  </span>
                </span>
              </>
            )}
          </div>

          <span
            className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold 2xl:inline-flex ${level.badge}`}
          >
            {level.label}
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`rounded-2xl border p-4 ${level.border} ${level.background}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/10 ${level.icon}`}
          >
            <CarFront className="h-5 w-5" />
          </span>

          <div>
            <p className="text-sm font-semibold text-white">
              Restid mellan jobb
            </p>

            {(fromLabel ||
              toLabel) && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>
                  {fromLabel ??
                    "Föregående jobb"}
                </span>

                <ArrowRight className="h-3.5 w-3.5 shrink-0" />

                <span>
                  {toLabel ??
                    "Nästa jobb"}
                </span>
              </div>
            )}
          </div>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold ${level.badge}`}
        >
          {level.label}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Körtid
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            {formatDuration(
              leg.durationSeconds,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Sträcka
          </p>

          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
            <MapPinned className="h-4 w-4 text-slate-500" />
            {formatDistance(
              leg.distanceMeters,
            )}
          </p>
        </div>
      </div>

      {(estimatedArrivalTime ||
        nextJobStartTime) && (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="text-slate-400">
            Beräknad ankomst:{" "}
            <span className="font-semibold text-white">
              {estimatedArrivalTime ??
                "saknas"}
            </span>
          </span>

          <span className="text-slate-400">
            Nästa jobb:{" "}
            <span className="font-semibold text-white">
              {nextJobStartTime ??
                "saknas"}
            </span>
          </span>
        </div>
      )}

      {lateRisk && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

          <p>
            Beräknad ankomst är senare än
            nästa jobbs planerade starttid.
          </p>
        </div>
      )}
    </article>
  );
}