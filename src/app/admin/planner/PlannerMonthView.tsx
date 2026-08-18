"use client";

import { useMemo } from "react";
import PlannerEventCard, {
  type PlannerEvent,
} from "./PlannerEventCard";

type Props = {
  monthDate: string;
  events: Array<
    PlannerEvent & {
      date: string;
    }
  >;
  selectedTechnician?: string;
  showCompleted?: boolean;
  onDateSelect?: (date: string) => void;
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

const completedStatuses = new Set([
  "Utförd",
  "Fakturerad",
  "Betald",
  "Avslutad",
]);

function parseDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getMonthDays(referenceDate: Date) {
  const firstDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
  );

  const lastDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
  );

  const mondayOffset =
    firstDay.getDay() === 0
      ? 6
      : firstDay.getDay() - 1;

  const days: Date[] = [];

  for (
    let offset = mondayOffset;
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

function isToday(value: string) {
  const today = new Date();

  return value === toDateKey(today);
}

export default function PlannerMonthView({
  monthDate,
  events,
  selectedTechnician = "",
  showCompleted = true,
  onDateSelect,
}: Props) {
  const referenceDate = parseDate(monthDate);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (
          selectedTechnician &&
          event.technician !== selectedTechnician
        ) {
          return false;
        }

        if (
          !showCompleted &&
          completedStatuses.has(event.status)
        ) {
          return false;
        }

        return true;
      }),
    [
      events,
      selectedTechnician,
      showCompleted,
    ],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<
      string,
      Array<PlannerEvent & { date: string }>
    >();

    for (const event of filteredEvents) {
      const current = map.get(event.date) ?? [];

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
  }, [filteredEvents]);

  const monthDays = useMemo(
    () => getMonthDays(referenceDate),
    [referenceDate],
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
          Månadsplanering
        </p>

        <h2 className="mt-2 text-xl font-semibold capitalize text-white">
          {new Intl.DateTimeFormat("sv-SE", {
            month: "long",
            year: "numeric",
          }).format(referenceDate)}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Klicka på en dag för att öppna dagsvyn.
        </p>
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
            referenceDate.getMonth();

          const today = isToday(key);

          return (
            <button
              key={key}
              type="button"
              onClick={() =>
                onDateSelect?.(key)
              }
              className="min-h-40 border-b border-r border-white/10 p-2 text-left transition hover:bg-white/[0.03] sm:p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    today
                      ? "bg-purple-600 text-white"
                      : isCurrentMonth
                        ? "text-white"
                        : "text-slate-600"
                  }`}
                >
                  {date.getDate()}
                </span>

                {dayEvents.length > 0 && (
                  <span className="rounded-full border border-white/10 bg-black/10 px-2 py-1 text-[10px] text-slate-400">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {dayEvents
                  .slice(0, 2)
                  .map((event) => (
                    <div
                      key={`${key}-${event.id}`}
                      onClick={(eventClick) =>
                        eventClick.stopPropagation()
                      }
                    >
                      <PlannerEventCard
                        event={event}
                      />
                    </div>
                  ))}

                {dayEvents.length > 2 && (
                  <p className="px-1 text-[11px] text-slate-500">
                    +{dayEvents.length - 2} fler jobb
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-xs text-slate-500">
        {filteredEvents.length} jobb visas i månaden.
      </div>
    </section>
  );
}