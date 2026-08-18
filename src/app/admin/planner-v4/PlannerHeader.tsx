"use client";

import {
  CalendarDays,
  MapPinned,
  Route,
  UsersRound,
} from "lucide-react";

type ViewMode =
  | "day"
  | "week";

type Props = {
  selectedDate: string;
  view: ViewMode;
  selectedDayCount: number;
  selectedWeekCount: number;
  technicianCount: number;
  routeCount: number;
  totalDistanceMeters?: number;
  totalDriveMinutes?: number;
};

function formatDate(
  date: string,
) {
  const parsed =
    new Date(
      `${date}T12:00:00`,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return date;
  }

  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(parsed);
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

function formatMinutes(
  minutes: number,
) {
  const hours =
    Math.floor(
      minutes / 60,
    );

  const remaining =
    minutes % 60;

  if (hours === 0) {
    return `${remaining} min`;
  }

  if (remaining === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remaining} min`;
}

export default function PlannerHeader({
  selectedDate,
  view,
  selectedDayCount,
  selectedWeekCount,
  technicianCount,
  routeCount,
  totalDistanceMeters = 0,
  totalDriveMinutes = 0,
}: Props) {
  const visibleJobs =
    view === "day"
      ? selectedDayCount
      : selectedWeekCount;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0b1020] shadow-2xl shadow-black/20">
      <div className="relative overflow-hidden px-5 py-5 sm:px-6">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-500/[0.07] blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-300">
              Planner Workspace
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {formatDate(
                selectedDate,
              )}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {view === "day"
                ? "Dagsplanering"
                : "Veckoöversikt"}
              {" · "}
              {visibleJobs} jobb
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-[150px] rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarDays className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Jobb
                </span>
              </div>

              <p className="mt-2 text-lg font-semibold text-white">
                {visibleJobs}
              </p>
            </div>

            <div className="min-w-[150px] rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <UsersRound className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Tekniker
                </span>
              </div>

              <p className="mt-2 text-lg font-semibold text-white">
                {technicianCount}
              </p>
            </div>

            <div className="min-w-[150px] rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPinned className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Sträcka
                </span>
              </div>

              <p className="mt-2 text-lg font-semibold text-white">
                {routeCount > 0
                  ? formatDistance(
                      totalDistanceMeters,
                    )
                  : "—"}
              </p>
            </div>

            <div className="min-w-[150px] rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Route className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Körtid
                </span>
              </div>

              <p className="mt-2 text-lg font-semibold text-white">
                {routeCount > 0
                  ? formatMinutes(
                      totalDriveMinutes,
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}