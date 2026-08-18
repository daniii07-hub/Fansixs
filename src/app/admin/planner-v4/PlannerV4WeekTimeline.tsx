"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  UserRound,
} from "lucide-react";
import type { PlannerEventWithDate } from "../planner/queries";
import {
  addDays,
  formatTimeRange,
  getInitials,
  getMonday,
  parseDate,
  toDateKey,
} from "./helpers";
import { findPlannerConflicts } from "./conflicts";

type Technician = {
  id: string;
  name: string;
};

type Props = {
  referenceDate: string;
  events: PlannerEventWithDate[];
  technicians: Technician[];
  onDateSelect?: (date: string) => void;
};

const weekdayLabels = [
  "Måndag",
  "Tisdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lördag",
  "Söndag",
];

const statusStyles: Record<string, string> = {
  Planerad:
    "border-blue-400/20 bg-blue-400/10 text-blue-100",
  Pågår:
    "border-amber-400/20 bg-amber-400/10 text-amber-100",
  Utförd:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  Fakturerad:
    "border-purple-400/20 bg-purple-400/10 text-purple-100",
};

function isToday(value: string) {
  const today = new Date();

  return value === toDateKey(today);
}

export default function PlannerV4WeekTimeline({
  referenceDate,
  events,
  technicians,
  onDateSelect,
}: Props) {
  const weekDates = useMemo(() => {
    const monday = getMonday(
      parseDate(referenceDate),
    );

    return Array.from(
      { length: 7 },
      (_, index) => addDays(monday, index),
    );
  }, [referenceDate]);

  const normalizedEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        date: String(event.date ?? "").slice(
          0,
          10,
        ),
      })),
    [events],
  );

  const visibleTechnicians = useMemo(() => {
    const hasUnassigned =
      normalizedEvents.some(
        (event) =>
          !event.technician?.trim(),
      );

    const base = [...technicians];

    if (hasUnassigned || base.length === 0) {
      base.unshift({
        id: "unassigned",
        name: "Ej tilldelad",
      });
    }

    return base;
  }, [normalizedEvents, technicians]);

  const conflictsByDate = useMemo(() => {
    const map = new Map<string, Set<number>>();

    for (const date of weekDates) {
      const dateKey = toDateKey(date);

      const dayEvents =
        normalizedEvents.filter(
          (event) =>
            event.date === dateKey,
        );

      const conflicts =
        findPlannerConflicts(dayEvents);

      map.set(
        dateKey,
        new Set(
          conflicts.flatMap(
            (conflict) =>
              conflict.workOrderIds,
          ),
        ),
      );
    }

    return map;
  }, [normalizedEvents, weekDates]);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020] shadow-2xl shadow-black/20">
      <div className="border-b border-white/[0.07] bg-[#10182b] px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
          Planner V4.2
        </p>

        <h2 className="mt-2 text-xl font-semibold text-white">
          Veckotidslinje
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Se hela veckan per tekniker och öppna en dag
          för detaljerad planering.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid min-w-[1320px]"
          style={{
            gridTemplateColumns: `220px repeat(7, minmax(180px, 1fr))`,
          }}
        >
          <div className="sticky left-0 z-30 border-b border-r border-white/[0.07] bg-[#10182b] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Tekniker
            </p>
          </div>

          {weekDates.map((date, index) => {
            const dateKey = toDateKey(date);
            const today = isToday(dateKey);

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() =>
                  onDateSelect?.(dateKey)
                }
                className={`border-b border-r border-white/[0.07] px-4 py-4 text-left transition hover:bg-white/[0.04] ${
                  today
                    ? "bg-purple-400/[0.08]"
                    : "bg-[#10182b]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {weekdayLabels[index]}
                </p>

                <p
                  className={`mt-1 text-lg font-bold ${
                    today
                      ? "text-purple-300"
                      : "text-white"
                  }`}
                >
                  {date.getDate()}
                </p>
              </button>
            );
          })}

          {visibleTechnicians.map(
            (technician) => (
              <>
                <div
                  key={`label-${technician.id}`}
                  className="sticky left-0 z-20 border-b border-r border-white/[0.07] bg-[#0d1425] px-4 py-4"
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
                        Veckoöversikt
                      </p>
                    </div>
                  </div>
                </div>

                {weekDates.map((date) => {
                  const dateKey =
                    toDateKey(date);

                  const dayEvents =
                    normalizedEvents
                      .filter(
                        (event) =>
                          event.date ===
                            dateKey &&
                          (event.technician?.trim() ||
                            "Ej tilldelad") ===
                            technician.name,
                      )
                      .sort((a, b) =>
                        (
                          a.startTime ?? ""
                        ).localeCompare(
                          b.startTime ?? "",
                        ),
                      );

                  const conflictIds =
                    conflictsByDate.get(
                      dateKey,
                    ) ?? new Set<number>();

                  return (
                    <div
                      key={`${technician.id}-${dateKey}`}
                      className="min-h-40 border-b border-r border-white/[0.07] bg-[#0b1020] p-3"
                    >
                      {dayEvents.length === 0 ? (
                        <div className="flex h-full min-h-28 items-center justify-center text-xs text-slate-700">
                          Inga jobb
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dayEvents.map(
                            (event) => {
                              const hasConflict =
                                conflictIds.has(
                                  event.id,
                                );

                              return (
                                <a
                                  key={event.id}
                                  href={event.href}
                                  className={`block rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:bg-white/[0.08] ${
                                    hasConflict
                                      ? "border-red-400/40 bg-red-400/10"
                                      : statusStyles[
                                            event
                                              .status
                                          ] ??
                                        "border-white/10 bg-white/[0.04] text-slate-200"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-white">
                                        {
                                          event.customer
                                        }
                                      </p>

                                      <p className="mt-1 truncate text-xs text-slate-400">
                                        {
                                          event.service
                                        }
                                      </p>
                                    </div>

                                    {hasConflict && (
                                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
                                    )}
                                  </div>

                                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {formatTimeRange(
                                      event.startTime,
                                      event.endTime,
                                    )}
                                  </div>
                                </a>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ),
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.07] bg-[#10182b] px-6 py-4 text-xs text-slate-500">
        <span>
          Veckan innehåller{" "}
          {
            normalizedEvents.filter(
              (event) =>
                weekDates.some(
                  (date) =>
                    toDateKey(date) ===
                    event.date,
                ),
            ).length
          }{" "}
          jobb.
        </span>

        <span className="flex items-center gap-2">
          <UserRound className="h-4 w-4" />
          {visibleTechnicians.length} tekniker
        </span>
      </div>
    </section>
  );
}