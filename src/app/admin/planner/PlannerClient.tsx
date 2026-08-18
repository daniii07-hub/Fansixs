"use client";

import {
  useMemo,
  useState,
} from "react";
import PlannerHeader, {
  type PlannerView,
} from "./PlannerHeader";
import PlannerToolbar from "./PlannerToolbar";
import PlannerSidebar, {
  type PlannerTechnician,
} from "./PlannerSidebar";
import PlannerFilters, {
  type PlannerStatusFilter,
} from "./PlannerFilters";
import PlannerWeekView from "./PlannerWeekView";
import PlannerMonthView from "./PlannerMonthView";
import PlannerDayView from "./PlannerDayView";
import PlannerTimelineView from "./PlannerTimelineView";
import PlannerViewSwitcher, {
  type PlannerDisplayView,
} from "./PlannerViewSwitcher";
import type { PlannerEventWithDate } from "./queries";

type Props = {
  events: PlannerEventWithDate[];
  technicians: PlannerTechnician[];
  plannedCount: number;
  activeCount: number;
  completedCount: number;
};

const completedStatuses = new Set([
  "Utförd",
  "Fakturerad",
  "Betald",
  "Avslutad",
]);

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDate(value: string) {
  return new Date(
    `${value.slice(0, 10)}T12:00:00`,
  );
}

function addDays(date: Date, days: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
  );
}

function addMonths(
  date: Date,
  months: number,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1,
  );
}

function getMonday(date: Date) {
  const copy = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const weekday = copy.getDay();
  const offset =
    weekday === 0 ? -6 : 1 - weekday;

  copy.setDate(copy.getDate() + offset);

  return copy;
}

function getWeekDays(referenceDate: Date) {
  const monday = getMonday(referenceDate);

  const labels = [
    "Måndag",
    "Tisdag",
    "Onsdag",
    "Torsdag",
    "Fredag",
    "Lördag",
    "Söndag",
  ];

  return labels.map((label, index) => {
    const date = addDays(monday, index);

    return {
      label,
      shortLabel: label.slice(0, 3),
      date: toDateKey(date),
    };
  });
}

function findBestInitialDate(
  events: PlannerEventWithDate[],
) {
  const today = new Date();

  const validEvents = events
    .map((event) => ({
      date: parseDate(event.date),
    }))
    .filter(({ date }) =>
      Number.isFinite(date.getTime()),
    )
    .sort(
      (a, b) =>
        a.date.getTime() -
        b.date.getTime(),
    );

  return validEvents[0]?.date ?? today;
}

function formatHeaderTitle(
  view: PlannerDisplayView,
  referenceDate: Date,
) {
  if (view === "month") {
    return new Intl.DateTimeFormat("sv-SE", {
      month: "long",
      year: "numeric",
    }).format(referenceDate);
  }

  if (
    view === "day" ||
    view === "timeline"
  ) {
    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(referenceDate);
  }

  const weekDays =
    getWeekDays(referenceDate);

  const first =
    parseDate(weekDays[0].date);

  const last =
    parseDate(weekDays[6].date);

  const firstLabel =
    new Intl.DateTimeFormat("sv-SE", {
      day: "numeric",
      month: "short",
    })
      .format(first)
      .replace(".", "");

  const lastLabel =
    new Intl.DateTimeFormat("sv-SE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
      .format(last)
      .replace(".", "");

  return `${firstLabel} – ${lastLabel}`;
}

function matchesStatus(
  event: PlannerEventWithDate,
  status: PlannerStatusFilter,
) {
  if (status === "all") {
    return true;
  }

  if (status === "completed") {
    return completedStatuses.has(
      event.status,
    );
  }

  if (status === "active") {
    return (
      event.status === "Pågår" ||
      event.status === "Aktiv"
    );
  }

  return (
    !completedStatuses.has(event.status) &&
    event.status !== "Pågår" &&
    event.status !== "Aktiv"
  );
}

export default function PlannerClient({
  events,
  technicians,
  plannedCount,
  activeCount,
  completedCount,
}: Props) {
  const normalizedEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        date: String(
          event.date ?? "",
        ).slice(0, 10),
      })),
    [events],
  );

  const [view, setView] =
    useState<PlannerDisplayView>("week");

  const [
    referenceDate,
    setReferenceDate,
  ] = useState(() =>
    findBestInitialDate(normalizedEvents),
  );

  const [
    selectedTechnician,
    setSelectedTechnician,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [
    showCompleted,
    setShowCompleted,
  ] = useState(true);

  const [status, setStatus] =
    useState<PlannerStatusFilter>("all");

  const filteredEvents = useMemo(
    () =>
      normalizedEvents.filter((event) => {
        if (
          selectedTechnician &&
          event.technician !==
            selectedTechnician
        ) {
          return false;
        }

        if (
          !showCompleted &&
          completedStatuses.has(
            event.status,
          )
        ) {
          return false;
        }

        if (!matchesStatus(event, status)) {
          return false;
        }

        const query = search
          .trim()
          .toLocaleLowerCase("sv-SE");

        if (!query) {
          return true;
        }

        const searchableText = [
          event.customer,
          event.service,
          event.city ?? "",
          event.technician ?? "",
          event.status,
        ]
          .join(" ")
          .toLocaleLowerCase("sv-SE");

        return searchableText.includes(query);
      }),
    [
      normalizedEvents,
      search,
      selectedTechnician,
      showCompleted,
      status,
    ],
  );

  const weekDays = useMemo(
    () => getWeekDays(referenceDate),
    [referenceDate],
  );

  const referenceDateKey =
    toDateKey(referenceDate);

  function movePeriod(
    direction: -1 | 1,
  ) {
    setReferenceDate((current) => {
      if (view === "month") {
        return addMonths(
          current,
          direction,
        );
      }

      if (view === "week") {
        return addDays(
          current,
          direction * 7,
        );
      }

      return addDays(
        current,
        direction,
      );
    });
  }

  function openSelectedDate(
    date: string,
  ) {
    setReferenceDate(parseDate(date));
    setView("day");
  }

  const headerView: PlannerView =
    view === "timeline"
      ? "day"
      : view;

  return (
    <main className="space-y-4">
      <PlannerHeader
        title={formatHeaderTitle(
          view,
          referenceDate,
        )}
        subtitle="Planera bokningar, arbetsorder och tekniker."
        activeView={headerView}
        onViewChange={(nextView) =>
          setView(nextView)
        }
        onPrevious={() =>
          movePeriod(-1)
        }
        onNext={() =>
          movePeriod(1)
        }
        onToday={() =>
          setReferenceDate(new Date())
        }
      />

      <PlannerViewSwitcher
        activeView={view}
        onViewChange={setView}
      />

      <PlannerToolbar
        technician={selectedTechnician}
        search={search}
        showCompleted={showCompleted}
        onTechnicianChange={
          setSelectedTechnician
        }
        onSearchChange={setSearch}
        onToggleCompleted={() =>
          setShowCompleted(
            (current) => !current,
          )
        }
      />

      <PlannerFilters
        activeStatus={status}
        onStatusChange={setStatus}
        onReset={() => {
          setStatus("all");
          setSearch("");
          setSelectedTechnician("");
          setShowCompleted(true);
        }}
      />

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <PlannerSidebar
          technicians={technicians}
          selectedTechnician={
            selectedTechnician
          }
          onTechnicianSelect={
            setSelectedTechnician
          }
          plannedCount={plannedCount}
          activeCount={activeCount}
          completedCount={completedCount}
        />

        <div className="min-w-0">
          {view === "week" && (
            <PlannerWeekView
              days={weekDays}
              events={filteredEvents}
              selectedTechnician=""
              showCompleted
            />
          )}

          {view === "month" && (
            <PlannerMonthView
              monthDate={referenceDateKey}
              events={filteredEvents}
              selectedTechnician=""
              showCompleted
              onDateSelect={
                openSelectedDate
              }
            />
          )}

          {view === "day" && (
            <PlannerDayView
              date={referenceDateKey}
              events={filteredEvents}
              selectedTechnician=""
              showCompleted
            />
          )}

          {view === "timeline" && (
            <PlannerTimelineView
              date={referenceDateKey}
              events={filteredEvents}
              technicians={technicians}
            />
          )}
        </div>
      </div>
    </main>
  );
}