"use client";

import { useMemo } from "react";
import {
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";
import type { PlannerEventWithDate } from "./queries";

type Technician = {
  id: string;
  name: string;
};

type Props = {
  date: string;
  events: PlannerEventWithDate[];
  technicians: Technician[];
};

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 88;
const MIN_EVENT_HEIGHT = 52;

const statusStyles: Record<
  string,
  {
    border: string;
    background: string;
    accent: string;
    text: string;
  }
> = {
  Planerad: {
    border: "border-blue-400/25",
    background:
      "bg-gradient-to-br from-blue-500/20 to-cyan-500/10",
    accent: "bg-blue-400",
    text: "text-blue-100",
  },
  Pågår: {
    border: "border-amber-400/25",
    background:
      "bg-gradient-to-br from-amber-500/20 to-orange-500/10",
    accent: "bg-amber-400",
    text: "text-amber-100",
  },
  Utförd: {
    border: "border-emerald-400/25",
    background:
      "bg-gradient-to-br from-emerald-500/20 to-green-500/10",
    accent: "bg-emerald-400",
    text: "text-emerald-100",
  },
  Fakturerad: {
    border: "border-purple-400/25",
    background:
      "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10",
    accent: "bg-purple-400",
    text: "text-purple-100",
  },
};

const fallbackStyle = {
  border: "border-white/15",
  background:
    "bg-gradient-to-br from-slate-500/15 to-slate-400/5",
  accent: "bg-slate-400",
  text: "text-slate-200",
};

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function parseMinutes(
  value?: string | null,
) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value
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

function getEventLayout(
  event: PlannerEventWithDate,
) {
  const startMinutes =
    parseMinutes(event.startTime) ??
    START_HOUR * 60;

  const endMinutes =
    parseMinutes(event.endTime) ??
    startMinutes + 60;

  const visibleStart = Math.max(
    startMinutes,
    START_HOUR * 60,
  );

  const visibleEnd = Math.min(
    Math.max(endMinutes, visibleStart + 30),
    END_HOUR * 60,
  );

  const top =
    ((visibleStart - START_HOUR * 60) / 60) *
    HOUR_HEIGHT;

  const height = Math.max(
    MIN_EVENT_HEIGHT,
    ((visibleEnd - visibleStart) / 60) *
      HOUR_HEIGHT,
  );

  return {
    top,
    height,
  };
}

function formatTimeRange(
  startTime?: string | null,
  endTime?: string | null,
) {
  if (!startTime) {
    return "Tid saknas";
  }

  const start = startTime.slice(0, 5);

  if (!endTime) {
    return start;
  }

  return `${start}–${endTime.slice(0, 5)}`;
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part[0]?.toUpperCase(),
    )
    .join("");
}

function isToday(date: string) {
  const today = new Date();

  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(
      2,
      "0",
    ),
    String(today.getDate()).padStart(
      2,
      "0",
    ),
  ].join("-");

  return date === todayKey;
}

function getCurrentTimeTop() {
  const now = new Date();

  const minutes =
    now.getHours() * 60 +
    now.getMinutes();

  if (
    minutes < START_HOUR * 60 ||
    minutes > END_HOUR * 60
  ) {
    return null;
  }

  return (
    ((minutes - START_HOUR * 60) / 60) *
    HOUR_HEIGHT
  );
}

export default function PlannerTimelineView({
  date,
  events,
  technicians,
}: Props) {
  const visibleTechnicians = useMemo(() => {
    if (technicians.length > 0) {
      return technicians;
    }

    return [
      {
        id: "unassigned",
        name: "Ej tilldelad",
      },
    ];
  }, [technicians]);

  const dayEvents = useMemo(
    () =>
      events.filter(
        (event) => event.date === date,
      ),
    [date, events],
  );

  const eventsByTechnician = useMemo(() => {
    const map = new Map<
      string,
      PlannerEventWithDate[]
    >();

    for (const technician of visibleTechnicians) {
      map.set(technician.name, []);
    }

    for (const event of dayEvents) {
      const key =
        event.technician?.trim() ||
        "Ej tilldelad";

      const current = map.get(key) ?? [];
      current.push(event);
      map.set(key, current);
    }

    return map;
  }, [dayEvents, visibleTechnicians]);

  const currentTimeTop = isToday(date)
    ? getCurrentTimeTop()
    : null;

  const totalHeight =
    (END_HOUR - START_HOUR) *
    HOUR_HEIGHT;

  const hours = Array.from(
    {
      length:
        END_HOUR - START_HOUR + 1,
    },
    (_, index) => START_HOUR + index,
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020] shadow-2xl shadow-black/20">
      <div className="border-b border-white/[0.07] bg-[#10182b] px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
          Planner V3
        </p>

        <h2 className="mt-2 text-xl font-semibold text-white">
          Tekniker och tidslinje
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Jobben placeras efter starttid och får höjd efter
          planerad varaktighet.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid min-w-[980px]"
          style={{
            gridTemplateColumns: `88px repeat(${visibleTechnicians.length}, minmax(240px, 1fr))`,
          }}
        >
          <div className="sticky left-0 z-30 border-b border-r border-white/[0.07] bg-[#10182b]" />

          {visibleTechnicians.map(
            (technician) => (
              <div
                key={technician.id}
                className="border-b border-r border-white/[0.07] bg-[#10182b] px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-xs font-bold text-white">
                    {getInitials(
                      technician.name,
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {technician.name}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {eventsByTechnician.get(
                        technician.name,
                      )?.length ?? 0}{" "}
                      jobb
                    </p>
                  </div>
                </div>
              </div>
            ),
          )}

          <div
            className="sticky left-0 z-20 border-r border-white/[0.07] bg-[#0d1425]"
            style={{
              height: totalHeight,
            }}
          >
            {hours.map((hour) => {
              const top =
                (hour - START_HOUR) *
                HOUR_HEIGHT;

              return (
                <div
                  key={hour}
                  className="absolute left-0 right-0 flex items-start justify-end pr-3 text-xs font-medium text-slate-500"
                  style={{
                    top:
                      hour === END_HOUR
                        ? top - 8
                        : top + 6,
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {hourLabel(hour)}
                  </span>
                </div>
              );
            })}
          </div>

          {visibleTechnicians.map(
            (technician) => {
              const technicianEvents =
                eventsByTechnician.get(
                  technician.name,
                ) ?? [];

              return (
                <div
                  key={`column-${technician.id}`}
                  className="relative border-r border-white/[0.07] bg-[#0b1020]"
                  style={{
                    height: totalHeight,
                  }}
                >
                  {hours.map((hour) => (
                    <div
                      key={`${technician.id}-${hour}`}
                      className="absolute left-0 right-0 border-t border-white/[0.055]"
                      style={{
                        top:
                          (hour -
                            START_HOUR) *
                          HOUR_HEIGHT,
                      }}
                    />
                  ))}

                  {currentTimeTop !== null && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                      style={{
                        top: currentTimeTop,
                      }}
                    >
                      <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-red-400 shadow-lg shadow-red-500/40" />

                      <span className="h-px flex-1 bg-red-400/80" />
                    </div>
                  )}

                  {technicianEvents.map(
                    (event) => {
                      const layout =
                        getEventLayout(event);

                      const style =
                        statusStyles[
                          event.status
                        ] ??
                        fallbackStyle;

                      return (
                        <a
                          key={`${event.date}-${event.id}`}
                          href={event.href}
                          className={`group absolute left-3 right-3 z-10 overflow-hidden rounded-2xl border p-4 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl ${style.border} ${style.background}`}
                          style={{
                            top: layout.top + 4,
                            height:
                              layout.height - 8,
                          }}
                        >
                          <span
                            className={`absolute inset-y-0 left-0 w-1 ${style.accent}`}
                          />

                          <div className="flex h-full flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-white">
                                  {event.customer}
                                </p>

                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">
                                  {event.service}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border border-white/10 bg-black/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide ${style.text}`}
                              >
                                {event.status}
                              </span>
                            </div>

                            <div className="mt-auto space-y-1.5 pt-3 text-xs text-slate-300">
                              <p className="font-semibold text-white">
                                {formatTimeRange(
                                  event.startTime,
                                  event.endTime,
                                )}
                              </p>

                              {event.city && (
                                <p className="flex items-center gap-1.5 truncate text-slate-400">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  {event.city}
                                </p>
                              )}
                            </div>
                          </div>
                        </a>
                      );
                    },
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.07] bg-[#10182b] px-6 py-4 text-xs text-slate-500">
        <span>
          {dayEvents.length} jobb visas denna dag.
        </span>

        <span className="flex items-center gap-2">
          <UserRound className="h-4 w-4" />
          {visibleTechnicians.length} tekniker
        </span>
      </div>
    </section>
  );
}