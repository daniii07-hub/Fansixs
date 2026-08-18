"use client";

import {
  MapPinned,
  Route,
  UserRound,
} from "lucide-react";

type Props = {
  technicianName: string;
  initials: string;
  jobCount: number;
  totalDriveMinutes?: number | null;
  totalDistanceMeters?: number | null;
  hasRoute?: boolean;
};

function formatMinutes(
  minutes: number,
) {
  const hours =
    Math.floor(minutes / 60);

  const rest =
    minutes % 60;

  if (hours <= 0) {
    return `${rest} min`;
  }

  if (rest <= 0) {
    return `${hours} h`;
  }

  return `${hours} h ${rest} min`;
}

function formatDistance(
  meters: number,
) {
  if (meters < 1000) {
    return `${Math.round(
      meters,
    )} m`;
  }

  return `${(
    meters / 1000
  ).toFixed(1)} km`;
}

export default function PlannerTimelineHeader({
  technicianName,
  initials,
  jobCount,
  totalDriveMinutes = null,
  totalDistanceMeters = null,
  hasRoute = false,
}: Props) {
  return (
    <div className="sticky top-0 z-20 border-b border-r border-white/[0.06] bg-[#0d1322]/95 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-[11px] font-bold text-white shadow-sm shadow-black/20">
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">
              {technicianName}
            </p>

            {hasRoute && (
              <span className="shrink-0 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                Route
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3 w-3" />
              {jobCount} jobb
            </span>

            {typeof totalDriveMinutes ===
              "number" && (
              <span className="inline-flex items-center gap-1">
                <Route className="h-3 w-3" />
                {formatMinutes(
                  totalDriveMinutes,
                )}
              </span>
            )}

            {typeof totalDistanceMeters ===
              "number" && (
              <span className="inline-flex items-center gap-1">
                <MapPinned className="h-3 w-3" />
                {formatDistance(
                  totalDistanceMeters,
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}