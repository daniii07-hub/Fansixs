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
  UserRound,
} from "lucide-react";
import {
  updatePlannerEventTechnician,
  updatePlannerEventTime,
} from "../planner/plannerActions";
import type { PlannerEventWithDate } from "../planner/queries";
import PlannerConflictBanner from "./PlannerConflictBanner";
import PlannerTimelineGrid from "./PlannerTimelineGrid";
import { findPlannerConflicts } from "./conflicts";
import {
  PLANNER_END_HOUR,
  PLANNER_SLOT_HEIGHT,
  PLANNER_SLOT_MINUTES,
  PLANNER_START_HOUR,
  getPlannerTotalHeight,
  minutesToTime,
  parseTimeToMinutes,
} from "./helpers";
import { groupEventsByTechnician } from "./timeline";
import type { TechnicianRoute } from "./routing";

type Technician = {
  id: string;
  name: string;
};

type Props = {
  date: string;
  events: PlannerEventWithDate[];
  technicians: Technician[];
  routes?: Record<string, TechnicianRoute>;
  selectedJobId?: number | null;
  hoveredJobId?: number | null;
  onJobSelect?: (
    eventId: number,
  ) => void;
  onJobHoverChange?: (
    eventId: number | null,
  ) => void;
  onEventsChange?: (
    events: PlannerEventWithDate[],
  ) => void;
};

function canMoveEvent(
  event: PlannerEventWithDate,
) {
  return event.href.startsWith(
    "/admin/work-orders/",
  );
}

function getCurrentTimeTop(
  date: string,
) {
  const now = new Date();

  const todayKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(
      2,
      "0",
    ),
    String(now.getDate()).padStart(
      2,
      "0",
    ),
  ].join("-");

  if (date !== todayKey) {
    return null;
  }

  const minutes =
    now.getHours() * 60 +
    now.getMinutes();

  if (
    minutes < PLANNER_START_HOUR * 60 ||
    minutes > PLANNER_END_HOUR * 60
  ) {
    return null;
  }

  return (
    ((minutes -
      PLANNER_START_HOUR * 60) /
      PLANNER_SLOT_MINUTES) *
    PLANNER_SLOT_HEIGHT
  );
}

export default function PlannerV4Timeline({
  date,
  events,
  technicians,
  routes = {},
  selectedJobId = null,
  hoveredJobId = null,
  onJobSelect,
  onJobHoverChange,
  onEventsChange,
}: Props) {
  const [localEvents, setLocalEvents] =
    useState(events);

  const localEventsRef =
    useRef(events);

  const [draggedEventId, setDraggedEventId] =
    useState<number | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  useEffect(() => {
    localEventsRef.current =
      events;

    setLocalEvents(events);
  }, [events]);

  const dayEvents = useMemo(
    () =>
      localEvents.filter(
        (event) =>
          String(event.date).slice(
            0,
            10,
          ) === date,
      ),
    [date, localEvents],
  );

  const visibleTechnicians = useMemo(() => {
    const result = [...technicians];

    const hasUnassigned =
      dayEvents.some(
        (event) =>
          !event.technician?.trim(),
      );

    if (
      hasUnassigned ||
      result.length === 0
    ) {
      result.unshift({
        id: "unassigned",
        name: "Ej tilldelad",
      });
    }

    return result;
  }, [dayEvents, technicians]);

  const groupedEvents = useMemo(
    () =>
      groupEventsByTechnician(
        dayEvents,
      ),
    [dayEvents],
  );

  const conflicts = useMemo(
    () =>
      findPlannerConflicts(
        dayEvents,
      ),
    [dayEvents],
  );

  const conflictIds = useMemo(
    () =>
      new Set(
        conflicts.flatMap(
          (conflict) =>
            conflict.workOrderIds,
        ),
      ),
    [conflicts],
  );

  const totalHeight =
    getPlannerTotalHeight();

  const currentTimeTop =
    getCurrentTimeTop(date);

  function commitLocalEvents(
    updater: (
      current: PlannerEventWithDate[],
    ) => PlannerEventWithDate[],
  ) {
    const next = updater(
      localEventsRef.current,
    );

    localEventsRef.current =
      next;

    setLocalEvents(next);
    onEventsChange?.(next);
  }

  function handleDragStart(
    dragEvent: React.DragEvent<HTMLDivElement>,
  ) {
    const target =
      dragEvent.target;

    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest(
      'a[href*="/admin/work-orders/"]',
    );

    if (!link) {
      return;
    }

    const href =
      link.getAttribute("href") ?? "";

    const match = href.match(
      /\/admin\/work-orders\/(\d+)/,
    );

    const workOrderId = Number(
      match?.[1],
    );

    if (
      !Number.isInteger(workOrderId) ||
      workOrderId <= 0
    ) {
      return;
    }

    const eventToMove =
      dayEvents.find(
        (event) =>
          event.id === workOrderId,
      );

    if (
      !eventToMove ||
      !canMoveEvent(eventToMove) ||
      isPending
    ) {
      dragEvent.preventDefault();
      return;
    }

    dragEvent.dataTransfer.effectAllowed =
      "move";

    dragEvent.dataTransfer.setData(
      "text/plain",
      String(workOrderId),
    );

    setDraggedEventId(workOrderId);
    setMessage("");
    setError("");
  }

  function handleDrop(
    technician: string,
    minutes: number,
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
      return;
    }

    const previousStart =
      eventToMove.startTime;

    const previousEnd =
      eventToMove.endTime;

    const previousTechnician =
      eventToMove.technician;

    const oldStart =
      parseTimeToMinutes(
        eventToMove.startTime,
      );

    const oldEnd =
      parseTimeToMinutes(
        eventToMove.endTime,
      );

    const duration =
      oldStart !== null &&
      oldEnd !== null &&
      oldEnd > oldStart
        ? oldEnd - oldStart
        : 60;

    const newStartTime =
      minutesToTime(minutes);

    const newEndTime =
      minutesToTime(
        Math.min(
          minutes + duration,
          PLANNER_END_HOUR * 60,
        ),
      );

    const newTechnician =
      technician === "Ej tilldelad"
        ? null
        : technician;

    commitLocalEvents((current) =>
      current.map((event) =>
        event.id === eventToMove.id
          ? {
              ...event,
              startTime:
                newStartTime,
              endTime:
                newEndTime,
              technician:
                newTechnician,
            }
          : event,
      ),
    );

    setMessage("");
    setError("");

    startTransition(async () => {
      const [
        timeResult,
        technicianResult,
      ] = await Promise.all([
        updatePlannerEventTime({
          workOrderId:
            eventToMove.id,
          startTime:
            newStartTime,
          endTime:
            newEndTime,
        }),
        updatePlannerEventTechnician({
          workOrderId:
            eventToMove.id,
          technician:
            newTechnician,
        }),
      ]);

      if (
        !timeResult.success ||
        !technicianResult.success
      ) {
        commitLocalEvents((current) =>
          current.map((event) =>
            event.id ===
            eventToMove.id
              ? {
                  ...event,
                  startTime:
                    previousStart,
                  endTime:
                    previousEnd,
                  technician:
                    previousTechnician,
                }
              : event,
          ),
        );

        setError(
          timeResult.message ??
            technicianResult.message ??
            "Jobbet kunde inte flyttas.",
        );
      } else {
        setMessage(
          `Jobbet flyttades till ${technician} kl. ${newStartTime}.`,
        );
      }

      setDraggedEventId(null);
    });
  }

  function focusConflict(
    workOrderId: number,
  ) {
    const element =
      document.querySelector(
        `a[href="/admin/work-orders/${workOrderId}"]`,
      );

    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  }

  return (
    <section className="space-y-4">
      <PlannerConflictBanner
        conflicts={conflicts}
        onConflictSelect={
          focusConflict
        }
      />

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020] shadow-2xl shadow-black/20">
        <div className="border-b border-white/[0.07] bg-[#10182b] px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
            Planner V5
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Modulär 15-minutersvy
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Dra jobb mellan tider och tekniker. Rutter räknas om
            automatiskt efter en ändring.
          </p>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 border-b border-white/10 bg-purple-400/[0.06] px-6 py-3 text-sm text-purple-100">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sparar planeringen...
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

        <PlannerTimelineGrid
          visibleTechnicians={
            visibleTechnicians
          }
          groupedEvents={
            groupedEvents
          }
          routes={routes}
          conflictIds={
            conflictIds
          }
          selectedJobId={
            selectedJobId
          }
          hoveredJobId={
            hoveredJobId
          }
          currentTimeTop={
            currentTimeTop
          }
          totalHeight={
            totalHeight
          }
          onJobSelect={
            onJobSelect
          }
          onJobHoverChange={
            onJobHoverChange
          }
          onDrop={
            handleDrop
          }
          onDragStart={
            handleDragStart
          }
          onDragEnd={() =>
            setDraggedEventId(
              null,
            )
          }
        />

        <div className="flex items-center justify-between border-t border-white/[0.07] bg-[#10182b] px-6 py-4 text-xs text-slate-500">
          <span>
            {dayEvents.length} jobb visas
            denna dag.
          </span>

          <span className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            {visibleTechnicians.length}{" "}
            tekniker
          </span>
        </div>
      </div>
    </section>
  );
}