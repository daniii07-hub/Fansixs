"use client";

import {
  updatePlannerEventTechnician,
  updatePlannerEventTime,
} from "../../planner/plannerActions";
import type {
  PlannerEventWithDate,
} from "../../planner/queries";
import {
  PLANNER_END_HOUR,
  PLANNER_SLOT_MINUTES,
  PLANNER_START_HOUR,
  minutesToTime,
  parseTimeToMinutes,
} from "../helpers";
import type {
  RouteOptimizationComparison,
} from "../routing/optimization/types";

export type ApplyOptimizerRouteInput = {
  events: PlannerEventWithDate[];
  technicianName: string;
  date: string;
  comparison: RouteOptimizationComparison;
  gapMinutes?: number;
  defaultDurationMinutes?: number;
};

export type ApplyOptimizerRouteUpdate = {
  workOrderId: number;
  technician: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type ApplyOptimizerRouteSuccess = {
  success: true;
  updatedEvents: PlannerEventWithDate[];
  updates: ApplyOptimizerRouteUpdate[];
};

export type ApplyOptimizerRouteFailure = {
  success: false;
  message: string;
  failedWorkOrderId?: number;
};

export type ApplyOptimizerRouteResult =
  | ApplyOptimizerRouteSuccess
  | ApplyOptimizerRouteFailure;

function roundToSlot(
  minutes: number,
) {
  return (
    Math.round(
      minutes /
        PLANNER_SLOT_MINUTES,
    ) * PLANNER_SLOT_MINUTES
  );
}

function getDurationMinutes({
  event,
  serviceDurationMinutes,
  defaultDurationMinutes,
}: {
  event: PlannerEventWithDate;
  serviceDurationMinutes:
    | number
    | null
    | undefined;
  defaultDurationMinutes: number;
}) {
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
      roundToSlot(
        end - start,
      ),
    );
  }

  if (
    typeof serviceDurationMinutes ===
      "number" &&
    Number.isFinite(
      serviceDurationMinutes,
    ) &&
    serviceDurationMinutes > 0
  ) {
    return Math.max(
      PLANNER_SLOT_MINUTES,
      roundToSlot(
        serviceDurationMinutes,
      ),
    );
  }

  return Math.max(
    PLANNER_SLOT_MINUTES,
    roundToSlot(
      defaultDurationMinutes,
    ),
  );
}

function getStartCursor(
  orderedEvents: PlannerEventWithDate[],
) {
  const existingStarts =
    orderedEvents
      .map((event) =>
        parseTimeToMinutes(
          event.startTime,
        ),
      )
      .filter(
        (
          value,
        ): value is number =>
          value !== null,
      );

  if (existingStarts.length === 0) {
    return (
      PLANNER_START_HOUR * 60
    );
  }

  return Math.max(
    PLANNER_START_HOUR * 60,
    roundToSlot(
      Math.min(
        ...existingStarts,
      ),
    ),
  );
}

function buildUpdates({
  events,
  technicianName,
  date,
  comparison,
  gapMinutes,
  defaultDurationMinutes,
}: Required<
  Pick<
    ApplyOptimizerRouteInput,
    | "events"
    | "technicianName"
    | "date"
    | "comparison"
    | "gapMinutes"
    | "defaultDurationMinutes"
  >
>) {
  const eventMap = new Map(
    events.map((event) => [
      event.id,
      event,
    ]),
  );

  const stopMap = new Map(
    comparison.candidate.stops.map(
      (stop) => [
        stop.id,
        stop,
      ],
    ),
  );

  const orderedItems =
    comparison.candidate.stopOrder
      .map((stopId) => {
        const stop =
          stopMap.get(stopId);

        const workOrderId =
          stop?.workOrderId;

        if (
          !stop ||
          typeof workOrderId !==
            "number"
        ) {
          return null;
        }

        const event =
          eventMap.get(
            workOrderId,
          );

        if (!event) {
          return null;
        }

        return {
          stop,
          event,
        };
      })
      .filter(
        (
          item,
        ): item is NonNullable<
          typeof item
        > => item !== null,
      );

  if (orderedItems.length === 0) {
    throw new Error(
      "Den verifierade kandidaten innehåller inga arbetsorder som kan appliceras.",
    );
  }

  const orderedEvents =
    orderedItems.map(
      (item) => item.event,
    );

  let cursorMinutes =
    getStartCursor(
      orderedEvents,
    );

  const plannerEndMinutes =
    PLANNER_END_HOUR * 60;

  const updates:
    ApplyOptimizerRouteUpdate[] =
      [];

  for (const {
    stop,
    event,
  } of orderedItems) {
    const durationMinutes =
      getDurationMinutes({
        event,
        serviceDurationMinutes:
          stop.serviceDurationMinutes,
        defaultDurationMinutes,
      });

    const startMinutes =
      cursorMinutes;

    const endMinutes =
      startMinutes +
      durationMinutes;

    if (
      endMinutes >
      plannerEndMinutes
    ) {
      throw new Error(
        `Den optimerade rutten ryms inte inom Planner-dagen. Arbetsorder #${event.id} skulle sluta efter ${PLANNER_END_HOUR}:00.`,
      );
    }

    updates.push({
      workOrderId:
        event.id,
      technician:
        technicianName,
      date,
      startTime:
        minutesToTime(
          startMinutes,
        ),
      endTime:
        minutesToTime(
          endMinutes,
        ),
    });

    cursorMinutes =
      roundToSlot(
        endMinutes +
          gapMinutes,
      );
  }

  return updates;
}

function applyUpdatesLocally({
  events,
  updates,
}: {
  events: PlannerEventWithDate[];
  updates: ApplyOptimizerRouteUpdate[];
}) {
  const updateMap = new Map(
    updates.map((update) => [
      update.workOrderId,
      update,
    ]),
  );

  return events.map((event) => {
    const update =
      updateMap.get(event.id);

    if (!update) {
      return event;
    }

    return {
      ...event,
      date: update.date,
      technician:
        update.technician,
      startTime:
        update.startTime,
      endTime:
        update.endTime,
    };
  });
}

export function prepareOptimizerRouteApply({
  events,
  technicianName,
  date,
  comparison,
  gapMinutes =
    PLANNER_SLOT_MINUTES,
  defaultDurationMinutes = 60,
}: ApplyOptimizerRouteInput): ApplyOptimizerRouteSuccess {
  if (
    !comparison.improved
  ) {
    throw new Error(
      "Förslaget förbättrar inte den nuvarande rutten.",
    );
  }

  if (
    !comparison.candidate.score
      .feasible
  ) {
    throw new Error(
      "Förslaget har blockerande constraints och kan inte appliceras.",
    );
  }

  const updates =
    buildUpdates({
      events,
      technicianName,
      date,
      comparison,
      gapMinutes,
      defaultDurationMinutes,
    });

  return {
    success: true,
    updates,
    updatedEvents:
      applyUpdatesLocally({
        events,
        updates,
      }),
  };
}

export async function persistOptimizerRoute(
  updates: ApplyOptimizerRouteUpdate[],
): Promise<ApplyOptimizerRouteResult> {
  for (const update of updates) {
    const timeResult =
      await updatePlannerEventTime({
        workOrderId:
          update.workOrderId,
        startTime:
          update.startTime,
        endTime:
          update.endTime,
      });

    if (!timeResult.success) {
      return {
        success: false,
        message:
          timeResult.message ??
          "Jobbets tider kunde inte sparas.",
        failedWorkOrderId:
          update.workOrderId,
      };
    }

    const technicianResult =
      await updatePlannerEventTechnician({
        workOrderId:
          update.workOrderId,
        technician:
          update.technician,
      });

    if (
      !technicianResult.success
    ) {
      return {
        success: false,
        message:
          technicianResult.message ??
          "Jobbets tekniker kunde inte sparas.",
        failedWorkOrderId:
          update.workOrderId,
      };
    }
  }

  return {
    success: true,
    updates,
    updatedEvents: [],
  };
}