"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";

export type CalendarEvent = {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  customerName: string;
  service: string;
  city: string | null;
  assignedTo: string | null;
  status: string;
  href?: string | null;
};

type Props = {
  events: CalendarEvent[];
  initialDate?: string;
};

const weekdayLabels = [
  "Mån",
  "Tis",
  "Ons",
  "Tor",
  "Fre",
  "Lör",
  "Sön",
];

const statusClasses: Record<string, string> = {
  Planerad:
    "border-blue-400/20 bg-blue-400/10 text-blue-100",
  Pågår:
    "border-amber-400/20 bg-amber-400/10 text-amber-100",
  Utförd:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  Fakturerad:
    "border-purple-400/20 bg-purple-400/10 text-purple-100",
};

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getMonthStart(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

function getMonthDays(referenceDate: Date) {
  const firstDay = getMonthStart(referenceDate);
  const lastDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
  );

  const mondayIndex =
    firstDay.getDay() === 0
      ? 6
      : firstDay.getDay() - 1;

  const days: Date[] = [];

  for (
    let offset = mondayIndex;
    offset > 0;
    offset -= 1
  ) {
    days.push(
      new Date(
        firstDay.getFullYear(),
        firstDay.getMonth(),
        1 - offset,
      ),
    );
  }

  for (
    let day = 1;
    day <= lastDay.getDate();
    day += 1
  ) {
    days.push(
      new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        day,
      ),
    );
  }

  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];

    days.push(
      new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate() + 1,
      ),
    );
  }

  return days;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatSelectedDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTime(
  startTime: string | null,
  endTime: string | null,
) {
  if (!startTime) {
    return "Tid ej angiven";
  }

  const start = startTime.slice(0, 5);
  const end = endTime
    ? endTime.slice(0, 5)
    : null;

  return end ? `${start}–${end}` : start;
}

export default function CalendarWidget({
  events,
  initialDate,
}: Props) {
  const initial = initialDate
    ? new Date(`${initialDate}T12:00:00`)
    : new Date();

  const [month, setMonth] =
    useState(getMonthStart(initial));

  const [selectedDate, setSelectedDate] =
    useState(initial);

  const monthDays = useMemo(
    () => getMonthDays(month),
    [month],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<
      string,
      CalendarEvent[]
    >();

    for (const event of events) {
      const current =
        map.get(event.date) ?? [];

      current.push(event);

      map.set(event.date, current);
    }

    for (const current of map.values()) {
      current.sort((a, b) =>
        (a.startTime ?? "").localeCompare(
          b.startTime ?? "",
        ),
      );
    }

    return map;
  }, [events]);

  const selectedKey =
    toDateKey(selectedDate);

  const selectedEvents =
    eventsByDate.get(selectedKey) ?? [];

  function changeMonth(offset: number) {
    const nextMonth = new Date(
      month.getFullYear(),
      month.getMonth() + offset,
      1,
    );

    setMonth(nextMonth);
    setSelectedDate(nextMonth);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
              Planering
            </p>

            <h2 className="mt-2 text-xl font-semibold capitalize text-white">
              {formatMonth(month)}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Klicka på en dag för att se bokningar och arbetsorder.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Föregående månad"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setMonth(
                  getMonthStart(today),
                );
                setSelectedDate(today);
              }}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
            >
              Idag
            </button>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Nästa månad"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDays.map((date) => {
            const key = toDateKey(date);
            const dayEvents =
              eventsByDate.get(key) ?? [];

            const isCurrentMonth =
              date.getMonth() ===
              month.getMonth();

            const isSelected =
              key === selectedKey;

            const isToday =
              key === toDateKey(new Date());

            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setSelectedDate(date)
                }
                className={`min-h-28 border-b border-r border-white/10 p-2 text-left transition sm:min-h-32 sm:p-3 ${
                  isSelected
                    ? "bg-purple-400/[0.09]"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday
                        ? "bg-purple-600 text-white"
                        : isCurrentMonth
                          ? "text-white"
                          : "text-slate-600"
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-500">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  {dayEvents
                    .slice(0, 3)
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`truncate rounded-lg border px-2 py-1 text-[10px] font-medium ${
                          statusClasses[
                            event.status
                          ] ??
                          "border-white/10 bg-white/[0.04] text-slate-300"
                        }`}
                      >
                        {event.startTime
                          ? `${event.startTime.slice(0, 5)} `
                          : ""}
                        {event.customerName}
                      </div>
                    ))}

                  {dayEvents.length > 3 && (
                    <p className="px-1 text-[10px] text-slate-500">
                      +{dayEvents.length - 3} fler
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-purple-300" />

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
              Vald dag
            </p>

            <h2 className="mt-1 text-xl font-semibold capitalize text-white">
              {formatSelectedDate(
                selectedDate,
              )}
            </h2>
          </div>
        </div>

        {selectedEvents.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 py-10 text-center text-sm text-slate-400">
            Inga bokningar eller arbetsorder denna dag.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {selectedEvents.map((event) => {
              const content = (
                <article className="rounded-2xl border border-white/10 bg-black/15 p-5 transition hover:bg-white/[0.04]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">
                        {event.customerName}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {event.service}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                        statusClasses[
                          event.status
                        ] ??
                        "border-white/10 bg-white/[0.04] text-slate-300"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-400">
                    <p className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-500" />
                      {formatTime(
                        event.startTime,
                        event.endTime,
                      )}
                    </p>

                    {event.city && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        {event.city}
                      </p>
                    )}

                    <p className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-slate-500" />
                      {event.assignedTo ||
                        "Ingen ansvarig tilldelad"}
                    </p>
                  </div>
                </article>
              );

              return event.href ? (
                <a
                  key={event.id}
                  href={event.href}
                  className="block"
                >
                  {content}
                </a>
              ) : (
                <div key={event.id}>
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </section>
  );
}