import type {
  PlannerEventWithDate,
} from "../planner/queries";
import {
  PLANNER_END_HOUR,
  PLANNER_SLOT_HEIGHT,
  PLANNER_SLOT_MINUTES,
  PLANNER_START_HOUR,
  parseTimeToMinutes,
} from "./helpers";

export type TimelineLayout = {
  top: number;
  height: number;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
};

const MIN_EVENT_HEIGHT = 24;
const DEFAULT_EVENT_DURATION_MINUTES = 60;

export function getTimelinePixelsPerMinute() {
  return (
    PLANNER_SLOT_HEIGHT /
    PLANNER_SLOT_MINUTES
  );
}

export function getTimelineLayout(
  event: Pick<
    PlannerEventWithDate,
    "startTime" | "endTime"
  >,
): TimelineLayout {
  const plannerStart =
    PLANNER_START_HOUR * 60;

  const plannerEnd =
    PLANNER_END_HOUR * 60;

  const parsedStart =
    parseTimeToMinutes(
      event.startTime,
    );

  const rawStart =
    parsedStart ?? plannerStart;

  const parsedEnd =
    parseTimeToMinutes(
      event.endTime,
    );

  const rawEnd =
    parsedEnd !== null &&
    parsedEnd > rawStart
      ? parsedEnd
      : rawStart +
        DEFAULT_EVENT_DURATION_MINUTES;

  const visibleStart =
    Math.min(
      Math.max(
        rawStart,
        plannerStart,
      ),
      plannerEnd,
    );

  const visibleEnd =
    Math.min(
      Math.max(
        rawEnd,
        visibleStart,
      ),
      plannerEnd,
    );

  const durationMinutes =
    Math.max(
      0,
      visibleEnd -
        visibleStart,
    );

  const pixelsPerMinute =
    getTimelinePixelsPerMinute();

  return {
    top:
      (visibleStart -
        plannerStart) *
      pixelsPerMinute,
    height:
      durationMinutes > 0
        ? Math.max(
            MIN_EVENT_HEIGHT,
            durationMinutes *
              pixelsPerMinute,
          )
        : MIN_EVENT_HEIGHT,
    startMinutes:
      visibleStart,
    endMinutes:
      visibleEnd,
    durationMinutes,
  };
}

export function groupEventsByTechnician(
  events:
    PlannerEventWithDate[],
) {
  const groups =
    new Map<
      string,
      PlannerEventWithDate[]
    >();

  for (const event of events) {
    const technician =
      event.technician?.trim() ||
      "Ej tilldelad";

    const list =
      groups.get(
        technician,
      ) ?? [];

    list.push(event);

    groups.set(
      technician,
      list,
    );
  }

  for (
    const list of
      groups.values()
  ) {
    list.sort((a, b) => {
      const aStart =
        parseTimeToMinutes(
          a.startTime,
        ) ??
        Number.MAX_SAFE_INTEGER;

      const bStart =
        parseTimeToMinutes(
          b.startTime,
        ) ??
        Number.MAX_SAFE_INTEGER;

      if (aStart !== bStart) {
        return aStart - bStart;
      }

      return a.id - b.id;
    });
  }

  return groups;
}