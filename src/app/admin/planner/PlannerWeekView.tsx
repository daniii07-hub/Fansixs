"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  CheckCircle2,
  Loader2,
  MoveRight,
} from "lucide-react";
import { movePlannerEvent } from "./plannerActions";
import PlannerEventCard, {
  type PlannerEvent,
} from "./PlannerEventCard";

type PlannerWeekDay = {
  date: string;
  label: string;
  shortLabel: string;
};

type PlannerWeekEvent = PlannerEvent & {
  date: string;
};

type Props = {
  days: PlannerWeekDay[];
  events: PlannerWeekEvent[];
  selectedTechnician?: string;
  showCompleted?: boolean;
};

const completedStatuses = new Set([
  "Utförd",
  "Fakturerad",
  "Betald",
  "Avslutad",
]);

function formatDayNumber(value: string) {
  const date = new Date(`${value}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? ""
    : String(date.getDate());
}

function isToday(value: string) {
  const today = new Date();

  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return value === todayKey;
}

function canMoveEvent(event: PlannerWeekEvent) {
  return event.href.startsWith(
    "/admin/work-orders/",
  );
}

export default function PlannerWeekView({
  days,
  events,
  selectedTechnician = "",
  showCompleted = true,
}: Props) {
  const [localEvents, setLocalEvents] =
    useState(events);

  const [draggedEventId, setDraggedEventId] =
    useState<number | null>(null);

  const [dropDate, setDropDate] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  const dragImageRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  useEffect(() => {
    return () => {
      dragImageRef.current?.remove();
    };
  }, []);

  const filteredEvents = useMemo(
    () =>
      localEvents.filter((event) => {
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
      }),
    [
      localEvents,
      selectedTechnician,
      showCompleted,
    ],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<
      string,
      PlannerWeekEvent[]
    >();

    for (const event of filteredEvents) {
      const current =
        map.get(event.date) ?? [];

      current.push(event);
      map.set(event.date, current);
    }

    for (const dayEvents of map.values()) {
      dayEvents.sort((a, b) =>
        (a.startTime ?? "").localeCompare(
          b.startTime ?? "",
        ),
      );
    }

    return map;
  }, [filteredEvents]);

  function createDragImage(
    event: PlannerWeekEvent,
  ) {
    const element =
      document.createElement("div");

    element.textContent = `${event.customer} · ${event.service}`;

    Object.assign(element.style, {
      position: "fixed",
      top: "-1000px",
      left: "-1000px",
      zIndex: "9999",
      maxWidth: "280px",
      padding: "12px 16px",
      borderRadius: "16px",
      border:
        "1px solid rgba(168, 85, 247, 0.35)",
      background:
        "linear-gradient(135deg, rgba(88, 28, 135, 0.96), rgba(30, 64, 175, 0.96))",
      boxShadow:
        "0 18px 50px rgba(0, 0, 0, 0.35)",
      color: "white",
      fontFamily:
        "ui-sans-serif, system-ui, sans-serif",
      fontSize: "13px",
      fontWeight: "700",
      lineHeight: "1.4",
      pointerEvents: "none",
    });

    document.body.appendChild(element);
    dragImageRef.current = element;

    return element;
  }

  function handleDragStart(
    dragEvent: React.DragEvent<HTMLDivElement>,
    event: PlannerWeekEvent,
  ) {
    if (!canMoveEvent(event) || isPending) {
      dragEvent.preventDefault();
      return;
    }

    setDraggedEventId(event.id);
    setMessage("");
    setError("");

    dragEvent.dataTransfer.effectAllowed =
      "move";

    dragEvent.dataTransfer.setData(
      "text/plain",
      String(event.id),
    );

    const dragImage =
      createDragImage(event);

    dragEvent.dataTransfer.setDragImage(
      dragImage,
      24,
      24,
    );
  }

  function handleDragEnd() {
    setDraggedEventId(null);
    setDropDate(null);

    dragImageRef.current?.remove();
    dragImageRef.current = null;
  }

  function handleDrop(
    targetDate: string,
  ) {
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
        "Bokningen saknar arbetsorder och kan inte flyttas ännu.",
      );
      handleDragEnd();
      return;
    }

    if (eventToMove.date === targetDate) {
      handleDragEnd();
      return;
    }

    const previousDate =
      eventToMove.date;

    setLocalEvents((current) =>
      current.map((event) =>
        event.id === eventToMove.id
          ? {
              ...event,
              date: targetDate,
            }
          : event,
      ),
    );

    setDropDate(null);
    setMessage("");
    setError("");

    startTransition(async () => {
      const result =
        await movePlannerEvent({
          workOrderId:
            eventToMove.id,
          bookingDate:
            targetDate,
        });

      if (!result.success) {
        setLocalEvents((current) =>
          current.map((event) =>
            event.id ===
            eventToMove.id
              ? {
                  ...event,
                  date: previousDate,
                }
              : event,
          ),
        );

        setError(
          result.message ??
            "Jobbet kunde inte flyttas.",
        );
      } else {
        setMessage(
          result.message ??
            "Jobbet har flyttats.",
        );
      }

      setDraggedEventId(null);

      dragImageRef.current?.remove();
      dragImageRef.current = null;
    });
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020] shadow-2xl shadow-black/20">
      <div className="border-b border-white/[0.06] bg-[#0d1324] px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
          Veckoplanering
        </p>

        <h2 className="mt-2 text-xl font-semibold text-white">
          Jobb och arbetsorder
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Dra ett jobb till en annan dag. Den markerade
          kolumnen visar var jobbet hamnar.
        </p>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 border-b border-white/10 bg-purple-400/[0.06] px-6 py-3 text-sm text-purple-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sparar ändringen...
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

      <div className="overflow-x-auto">
        <div className="grid min-w-[1120px] grid-cols-7 divide-x divide-white/[0.06] bg-[#0b1020]">
          {days.map((day) => {
            const dayEvents =
              eventsByDate.get(
                day.date,
              ) ?? [];

            const today =
              isToday(day.date);

            const isDropTarget =
              dropDate === day.date;

            return (
              <div
                key={day.date}
                onDragEnter={(event) => {
                  event.preventDefault();

                  if (draggedEventId !== null) {
                    setDropDate(
                      day.date,
                    );
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect =
                    "move";

                  if (draggedEventId !== null) {
                    setDropDate(
                      day.date,
                    );
                  }
                }}
                onDragLeave={(event) => {
                  const nextTarget =
                    event.relatedTarget;

                  if (
                    nextTarget instanceof Node &&
                    event.currentTarget.contains(
                      nextTarget,
                    )
                  ) {
                    return;
                  }

                  setDropDate(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(day.date);
                }}
                className={`relative min-h-[620px] bg-[#0b1020] transition duration-200 ${
                  isDropTarget
                    ? "bg-purple-400/[0.09] ring-2 ring-inset ring-purple-400/35"
                    : ""
                }`}
              >
                {isDropTarget && (
                  <div className="pointer-events-none absolute inset-x-3 top-24 z-10 flex items-center justify-center gap-2 rounded-2xl border border-purple-400/30 bg-purple-500/15 px-3 py-3 text-xs font-semibold text-purple-100 backdrop-blur-sm">
                    <MoveRight className="h-4 w-4" />
                    Släpp jobbet här
                  </div>
                )}

                <div
                  className={`border-b border-white/[0.06] px-4 py-4 ${
                    today
                      ? "bg-purple-400/[0.08]"
                      : "bg-[#0d1324]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {day.shortLabel}
                      </p>

                      <p
                        className={`mt-1 text-2xl font-bold ${
                          today
                            ? "text-purple-300"
                            : "text-white"
                        }`}
                      >
                        {formatDayNumber(
                          day.date,
                        )}
                      </p>
                    </div>

                    <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-xs text-slate-400">
                      {dayEvents.length}
                    </span>
                  </div>

                  <p className="mt-2 truncate text-xs text-slate-500">
                    {day.label}
                  </p>
                </div>

                <div
                  className={`space-y-3 p-3 transition ${
                    isDropTarget
                      ? "pt-16"
                      : ""
                  }`}
                >
                  {dayEvents.length === 0 ? (
                    <div className="flex min-h-[120px] items-center justify-center px-3 text-center text-xs text-slate-600">
                      Inga jobb
                    </div>
                  ) : (
                    dayEvents.map(
                      (event) => {
                        const movable =
                          canMoveEvent(event);

                        return (
                          <div
                            key={`${event.date}-${event.id}`}
                            draggable={
                              movable &&
                              !isPending
                            }
                            onDragStart={(
                              dragEvent,
                            ) =>
                              handleDragStart(
                                dragEvent,
                                event,
                              )
                            }
                            onDragEnd={
                              handleDragEnd
                            }
                            className={`transition duration-200 ${
                              movable
                                ? "cursor-grab active:cursor-grabbing"
                                : "cursor-default"
                            } ${
                              draggedEventId ===
                              event.id
                                ? "scale-[0.98] opacity-45"
                                : "opacity-100"
                            }`}
                          >
                            <PlannerEventCard
                              event={event}
                              isDragging={
                                draggedEventId ===
                                event.id
                              }
                              dragDisabled={
                                !movable
                              }
                            />
                          </div>
                        );
                      },
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/[0.06] bg-[#0d1324] px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {filteredEvents.length} jobb visas i veckan.
        </span>

        {selectedTechnician && (
          <span>
            Filter: {selectedTechnician}
          </span>
        )}
      </div>
    </section>
  );
}