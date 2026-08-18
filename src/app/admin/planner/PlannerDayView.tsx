"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
} from "lucide-react";
import { updatePlannerEventTime } from "./plannerActions";
import PlannerEventCard, {
  type PlannerEvent,
} from "./PlannerEventCard";

type PlannerDayEvent = PlannerEvent & {
  date: string;
};

type Props = {
  date: string;
  events: PlannerDayEvent[];
  selectedTechnician?: string;
  showCompleted?: boolean;
};

const completedStatuses = new Set([
  "Utförd",
  "Fakturerad",
  "Betald",
  "Avslutad",
]);

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getEventHour(event: PlannerEvent) {
  if (!event.startTime) {
    return null;
  }

  const parsed = Number(
    event.startTime.slice(0, 2),
  );

  return Number.isInteger(parsed)
    ? parsed
    : null;
}

function parseTimeToMinutes(
  value: string | null | undefined,
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

function minutesToTime(value: number) {
  const normalized = Math.max(
    0,
    Math.min(value, 23 * 60 + 59),
  );

  const hours = Math.floor(
    normalized / 60,
  );

  const minutes =
    normalized % 60;

  return `${String(hours).padStart(
    2,
    "0",
  )}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}

function canMoveEvent(event: PlannerEvent) {
  return event.href.startsWith(
    "/admin/work-orders/",
  );
}

export default function PlannerDayView({
  date,
  events,
  selectedTechnician = "",
  showCompleted = true,
}: Props) {
  const [localEvents, setLocalEvents] =
    useState(events);

  const [draggedEventId, setDraggedEventId] =
    useState<number | null>(null);

  const [dropHour, setDropHour] =
    useState<number | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const filteredEvents = useMemo(
    () =>
      localEvents
        .filter((event) => {
          if (event.date !== date) {
            return false;
          }

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

          return true;
        })
        .sort((a, b) =>
          (a.startTime ?? "").localeCompare(
            b.startTime ?? "",
          ),
        ),
    [
      date,
      localEvents,
      selectedTechnician,
      showCompleted,
    ],
  );

  const eventsByHour = useMemo(() => {
    const map = new Map<
      number,
      PlannerDayEvent[]
    >();

    for (const event of filteredEvents) {
      const hour = getEventHour(event);

      if (hour === null) {
        continue;
      }

      const current =
        map.get(hour) ?? [];

      current.push(event);
      map.set(hour, current);
    }

    return map;
  }, [filteredEvents]);

  const eventsWithoutTime =
    filteredEvents.filter(
      (event) =>
        getEventHour(event) === null,
    );

  const hours = Array.from(
    {
      length: 14,
    },
    (_, index) => index + 6,
  );

  function handleDragStart(
    eventId: number,
  ) {
    setDraggedEventId(eventId);
    setMessage("");
    setError("");
  }

  function handleDragEnd() {
    setDraggedEventId(null);
    setDropHour(null);
  }

  function handleDrop(targetHour: number) {
    if (
      draggedEventId === null ||
      isPending
    ) {
      return;
    }

    const eventToMove =
      localEvents.find(
        (event) =>
          event.id === draggedEventId,
      );

    if (!eventToMove) {
      setError(
        "Jobbet kunde inte hittas.",
      );
      handleDragEnd();
      return;
    }

    if (!canMoveEvent(eventToMove)) {
      setError(
        "Jobbet saknar arbetsorder och kan därför inte flyttas ännu.",
      );
      handleDragEnd();
      return;
    }

    const oldStartMinutes =
      parseTimeToMinutes(
        eventToMove.startTime,
      );

    const oldEndMinutes =
      parseTimeToMinutes(
        eventToMove.endTime,
      );

    const duration =
      oldStartMinutes !== null &&
      oldEndMinutes !== null &&
      oldEndMinutes > oldStartMinutes
        ? oldEndMinutes -
          oldStartMinutes
        : null;

    const newStartTime =
      formatHour(targetHour);

    const newEndTime =
      duration !== null
        ? minutesToTime(
            targetHour * 60 +
              duration,
          )
        : null;

    const previousStartTime =
      eventToMove.startTime;

    const previousEndTime =
      eventToMove.endTime;

    setLocalEvents((current) =>
      current.map((event) =>
        event.id === draggedEventId
          ? {
              ...event,
              startTime:
                newStartTime,
              endTime:
                newEndTime,
            }
          : event,
      ),
    );

    setDropHour(null);
    setMessage("");
    setError("");

    startTransition(async () => {
      const result =
        await updatePlannerEventTime({
          workOrderId:
            eventToMove.id,
          startTime:
            newStartTime,
          endTime:
            newEndTime,
        });

      if (!result.success) {
        setLocalEvents((current) =>
          current.map((event) =>
            event.id ===
            eventToMove.id
              ? {
                  ...event,
                  startTime:
                    previousStartTime,
                  endTime:
                    previousEndTime,
                }
              : event,
          ),
        );

        setError(
          result.message ??
            "Tiden kunde inte uppdateras.",
        );
      } else {
        setMessage(
          result.message ??
            "Jobbets tid har uppdaterats.",
        );
      }

      setDraggedEventId(null);
    });
  }

  function renderDraggableEvent(
    event: PlannerDayEvent,
    key: string,
  ) {
    const movable =
      canMoveEvent(event);

    return (
      <div
        key={key}
        draggable={
          movable && !isPending
        }
        onDragStart={() =>
          movable &&
          handleDragStart(event.id)
        }
        onDragEnd={handleDragEnd}
        title={
          movable
            ? "Dra jobbet till en ny tid"
            : "Bokningen saknar arbetsorder"
        }
        className={`${
          movable
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-default"
        } ${
          draggedEventId === event.id
            ? "opacity-40"
            : ""
        }`}
      >
        <PlannerEventCard
          event={event}
        />
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <CalendarDays className="h-5 w-5 text-purple-300" />

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
            Dagsplanering
          </p>

          <h2 className="mt-1 text-xl font-semibold capitalize text-white">
            {formatDate(date)}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Dra ett jobb till en ny tidslucka för att uppdatera bokningen.
          </p>
        </div>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 border-b border-white/10 bg-purple-400/[0.06] px-6 py-3 text-sm text-purple-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sparar den nya tiden...
        </div>
      )}

      {error && (
        <div className="border-b border-red-400/20 bg-red-400/10 px-6 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 border-b border-emerald-400/20 bg-emerald-400/10 px-6 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}

      {eventsWithoutTime.length > 0 && (
        <div className="border-b border-white/10 bg-white/[0.02] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tid ej angiven
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {eventsWithoutTime.map(
              (event) =>
                renderDraggableEvent(
                  event,
                  `untimed-${event.id}`,
                ),
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-white/10">
        {hours.map((hour) => {
          const hourEvents =
            eventsByHour.get(hour) ?? [];

          const isDropTarget =
            dropHour === hour;

          return (
            <div
              key={hour}
              onDragOver={(event) => {
                event.preventDefault();
                setDropHour(hour);
              }}
              onDragLeave={() =>
                setDropHour(null)
              }
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(hour);
              }}
              className={`grid min-h-28 grid-cols-[84px_1fr] transition ${
                isDropTarget
                  ? "bg-purple-400/[0.08]"
                  : ""
              }`}
            >
              <div className="border-r border-white/10 px-4 py-4 text-right">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatHour(hour)}
                </span>
              </div>

              <div className="p-4">
                {hourEvents.length === 0 ? (
                  <div
                    className={`h-full rounded-2xl border border-dashed ${
                      isDropTarget
                        ? "border-purple-400/30 bg-purple-400/[0.06]"
                        : "border-white/5 bg-black/5"
                    }`}
                  />
                ) : (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {hourEvents.map(
                      (event) =>
                        renderDraggableEvent(
                          event,
                          `${date}-${hour}-${event.id}`,
                        ),
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}