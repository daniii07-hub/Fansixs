"use client";

import {
  useMemo,
} from "react";

import type {
  PlannerEventWithDate,
} from "../../planner/queries";
import {
  PLANNER_END_HOUR,
  PLANNER_SLOT_HEIGHT,
  PLANNER_SLOT_MINUTES,
  PLANNER_START_HOUR,
  parseTimeToMinutes,
} from "../helpers";
import {
  usePlannerPreview,
} from "./usePlannerPreview";

export type PreviewEventLayout = {
  top: number;
  height: number;
  startMinutes: number;
  endMinutes: number;
  moved: boolean;
  previewIndex: number;
};

type UsePreviewLayoutOptions = {
  technician: string;
  events: PlannerEventWithDate[];
  gapMinutes?: number;
  defaultDurationMinutes?: number;
};

type UsePreviewLayoutResult = {
  isActive: boolean;
  layouts: Map<
    number,
    PreviewEventLayout
  >;
  orderedEvents:
    PlannerEventWithDate[];
};

function roundToPlannerSlot(
  minutes: number,
) {
  return (
    Math.round(
      minutes /
        PLANNER_SLOT_MINUTES,
    ) * PLANNER_SLOT_MINUTES
  );
}

function getDurationMinutes(
  event: PlannerEventWithDate,
  defaultDurationMinutes: number,
) {
  const start =
    parseTimeToMinutes(
      event.startTime,
    );

  const end =
    parseTimeToMinutes(
      event.endTime,
    );

  if (
    start !== null &&
    end !== null &&
    end > start
  ) {
    return Math.max(
      PLANNER_SLOT_MINUTES,
      roundToPlannerSlot(
        end - start,
      ),
    );
  }

  return Math.max(
    PLANNER_SLOT_MINUTES,
    roundToPlannerSlot(
      defaultDurationMinutes,
    ),
  );
}

function getPreviewStartMinutes(
  events: PlannerEventWithDate[],
) {
  const validStarts =
    events
      .map((event) =>
        parseTimeToMinutes(
          event.startTime,
        ),
      )
      .filter(
        (
          minutes,
        ): minutes is number =>
          minutes !== null,
      );

  if (validStarts.length === 0) {
    return (
      PLANNER_START_HOUR * 60
    );
  }

  return Math.max(
    PLANNER_START_HOUR * 60,
    roundToPlannerSlot(
      Math.min(...validStarts),
    ),
  );
}

function minutesToTop(
  minutes: number,
) {
  return (
    ((minutes -
      PLANNER_START_HOUR * 60) /
      PLANNER_SLOT_MINUTES) *
    PLANNER_SLOT_HEIGHT
  );
}

function durationToHeight(
  durationMinutes: number,
) {
  return Math.max(
    PLANNER_SLOT_HEIGHT,
    (durationMinutes /
      PLANNER_SLOT_MINUTES) *
      PLANNER_SLOT_HEIGHT,
  );
}

export function usePreviewLayout({
  technician,
  events,
  gapMinutes = PLANNER_SLOT_MINUTES,
  defaultDurationMinutes = 60,
}: UsePreviewLayoutOptions): UsePreviewLayoutResult {
  const {
    isPreviewing,
    technicianName,
    workOrderOrder,
    movedWorkOrderIds,
  } = usePlannerPreview();

  return useMemo(() => {
    const previewIsActive =
      isPreviewing &&
      technicianName === technician &&
      workOrderOrder.length > 0;

    if (!previewIsActive) {
      return {
        isActive: false,
        layouts:
          new Map<
            number,
            PreviewEventLayout
          >(),
        orderedEvents: events,
      };
    }

    const eventMap = new Map(
      events.map((event) => [
        event.id,
        event,
      ]),
    );

    const orderedPreviewEvents =
      workOrderOrder
        .map((workOrderId) =>
          eventMap.get(
            workOrderId,
          ),
        )
        .filter(
          (
            event,
          ): event is PlannerEventWithDate =>
            event !== undefined,
        );

    const orderedIds =
      new Set(
        orderedPreviewEvents.map(
          (event) => event.id,
        ),
      );

    const remainingEvents =
      events.filter(
        (event) =>
          !orderedIds.has(
            event.id,
          ),
      );

    const orderedEvents = [
      ...orderedPreviewEvents,
      ...remainingEvents,
    ];

    const layouts =
      new Map<
        number,
        PreviewEventLayout
      >();

    const movedIds =
      new Set(
        movedWorkOrderIds,
      );

    let cursorMinutes =
      getPreviewStartMinutes(
        orderedEvents,
      );

    const plannerEndMinutes =
      PLANNER_END_HOUR * 60;

    orderedEvents.forEach(
      (event, previewIndex) => {
        const durationMinutes =
          getDurationMinutes(
            event,
            defaultDurationMinutes,
          );

        const startMinutes =
          Math.min(
            cursorMinutes,
            plannerEndMinutes -
              PLANNER_SLOT_MINUTES,
          );

        const endMinutes =
          Math.min(
            startMinutes +
              durationMinutes,
            plannerEndMinutes,
          );

        layouts.set(event.id, {
          top:
            minutesToTop(
              startMinutes,
            ),
          height:
            durationToHeight(
              Math.max(
                PLANNER_SLOT_MINUTES,
                endMinutes -
                  startMinutes,
              ),
            ),
          startMinutes,
          endMinutes,
          moved:
            movedIds.has(
              event.id,
            ),
          previewIndex,
        });

        cursorMinutes =
          roundToPlannerSlot(
            endMinutes +
              gapMinutes,
          );
      },
    );

    return {
      isActive: true,
      layouts,
      orderedEvents,
    };
  }, [
    defaultDurationMinutes,
    events,
    gapMinutes,
    isPreviewing,
    movedWorkOrderIds,
    technician,
    technicianName,
    workOrderOrder,
  ]);
}