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
import type { CalendarEvent } from "./CalendarWidget";

type Props = {
  events: CalendarEvent[];
  initialDate?: string;
};

const weekdayNames = [
  "Måndag",
  "Tisdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lördag",
  "Söndag",
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

function getMonday(date: Date) {
  const copy = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const day = copy.getDay();
  const distance = day === 0 ? -6 : 1 - day;

  copy.setDate(copy.getDate() + distance);

  return copy;
}

function addDays(date: Date, days: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
  );
}

function getWeekDates(referenceDate: Date) {
  const monday = getMonday(referenceDate);

  return Array.from(
    {
      length: 7,
    },
    (_, index) => addDays(monday, index),
  );
}

function formatWeekRange(
  firstDate: Date,
  lastDate: Date,
) {
  const firstMonth = new Intl.DateTimeFormat(
    "sv-SE",
    {
      month: "short",
    },
  )
    .format(firstDate)
    .replace(".", "");

  const lastMonth = new Intl.DateTimeFormat(
    "sv-SE",
    {
      month: "short",
    },
  )
    .format(lastDate)
    .replace(".", "");

  if (
    firstDate.getMonth() ===
      lastDate.getMonth() &&
    firstDate.getFullYear() ===
      lastDate.getFullYear()
  ) {
    return `${firstDate.getDate()}–${lastDate.getDate()} ${lastMonth} ${lastDate.getFullYear()}`;
  }

  return `${firstDate.getDate()} ${firstMonth} – ${lastDate.getDate()} ${lastMonth} ${lastDate.getFullYear()}`;
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

export default function WeekCalendar({
  events,
  initialDate,
}: Props) {
  const initial = initialDate
    ? new Date(`${initialDate}T12:00:00`)
    : new Date();

  const [referenceDate, setReferenceDate] =
    useState(initial);

  const weekDates = useMemo(
    () => getWeekDates(referenceDate),
    [referenceDate],
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

  const todayKey = toDateKey(new Date());

  function changeWeek(offset: number) {
    setReferenceDate((current) =>
      addDays(current, offset * 7),
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
      <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
            Veckoplanering
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            {formatWeekRange(
              weekDates[0],
              weekDates[6],
            )}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Se veckans bokningar och öppna en arbetsorder
            direkt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeWeek(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Föregående vecka"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() =>
              setReferenceDate(new Date())
            }
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
          >
            Denna vecka
          </button>

          <button
            type="button"
            onClick={() => changeWeek(1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Nästa vecka"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid gap-px bg-white/10 xl:grid-cols-7">
        {weekDates.map((date, index) => {
          const dateKey = toDateKey(date);
          const dayEvents =
            eventsByDate.get(dateKey) ?? [];

          const isToday =
            dateKey === todayKey;

          return (
            <div
              key={dateKey}
              className="min-h-64 bg-[#090d19] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {weekdayNames[index]}
                  </p>

                  <p
                    className={`mt-1 text-lg font-bold ${
                      isToday
                        ? "text-purple-300"
                        : "text-white"
                    }`}
                  >
                    {date.getDate()}
                  </p>
                </div>

                {isToday && (
                  <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-purple-200">
                    Idag
                  </span>
                )}
              </div>

              {dayEvents.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/10 px-3 py-8 text-center text-xs text-slate-500">
                  Inga jobb
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {dayEvents.map((event) => {
                    const content = (
                      <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:bg-white/[0.06]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {event.customerName}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-400">
                              {event.service}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold ${
                              statusClasses[
                                event.status
                              ] ??
                              "border-white/10 bg-white/[0.04] text-slate-300"
                            }`}
                          >
                            {event.status}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-xs text-slate-400">
                          <p className="flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                            {formatTime(
                              event.startTime,
                              event.endTime,
                            )}
                          </p>

                          {event.city && (
                            <p className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-slate-500" />
                              {event.city}
                            </p>
                          )}

                          <p className="flex items-center gap-2">
                            <UserRound className="h-3.5 w-3.5 text-slate-500" />
                            {event.assignedTo ||
                              "Ej tilldelad"}
                          </p>
                        </div>
                      </article>
                    );

                    return event.href ? (
                      <a
                        key={`${event.id}-${dateKey}`}
                        href={event.href}
                        className="block"
                      >
                        {content}
                      </a>
                    ) : (
                      <div
                        key={`${event.id}-${dateKey}`}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 px-6 py-4 text-xs text-slate-500">
        <CalendarDays className="h-4 w-4" />
        {events.length} kalenderhändelser är tillgängliga.
      </div>
    </section>
  );
}
