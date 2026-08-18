import type {
  RouteOptimizationCandidate,
} from "./types";

export type MaterializedScheduleItem = {
  workOrderId: number;
  stopId: string;
  technicianName: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceDurationMinutes: number;
  arrivalTime: string | null;
  departureTime: string | null;
};

export type MaterializedScheduleResult =
  | {
      success: true;
      items: MaterializedScheduleItem[];
    }
  | {
      success: false;
      error: {
        code:
          | "INVALID_CANDIDATE"
          | "MISSING_WORK_ORDER"
          | "MISSING_TIMING"
          | "INVALID_SERVICE_DURATION";
        message: string;
        stopId?: string | null;
        workOrderId?: number | null;
      };
    };

function isValidWorkOrderId(
  value: number | null | undefined,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
}

function isValidIsoTime(
  value: string | null | undefined,
) {
  if (!value) {
    return false;
  }

  const parsed =
    Date.parse(value);

  return Number.isFinite(
    parsed,
  );
}

function formatTime(
  iso: string,
) {
  const date =
    new Date(iso);

  const hours =
    String(
      date.getHours(),
    ).padStart(
      2,
      "0",
    );

  const minutes =
    String(
      date.getMinutes(),
    ).padStart(
      2,
      "0",
    );

  return `${hours}:${minutes}:00`;
}

function addMinutes(
  iso: string,
  minutes: number,
) {
  const milliseconds =
    Date.parse(iso);

  return new Date(
    milliseconds +
      minutes * 60_000,
  ).toISOString();
}

export function materializeSchedule(
  candidate:
    RouteOptimizationCandidate,
): MaterializedScheduleResult {
  if (
    !candidate ||
    !Array.isArray(
      candidate.stopOrder,
    ) ||
    !Array.isArray(
      candidate.stops,
    ) ||
    !Array.isArray(
      candidate.legs,
    )
  ) {
    return {
      success: false,
      error: {
        code:
          "INVALID_CANDIDATE",
        message:
          "Optimeringskandidaten är ogiltig.",
      },
    };
  }

  const stopMap =
    new Map(
      candidate.stops.map(
        (stop) => [
          stop.id,
          stop,
        ],
      ),
    );

  const incomingLegMap =
    new Map(
      candidate.legs.map(
        (leg) => [
          leg.toStopId,
          leg,
        ],
      ),
    );

  const outgoingLegMap =
    new Map(
      candidate.legs.map(
        (leg) => [
          leg.fromStopId,
          leg,
        ],
      ),
    );

  const items:
    MaterializedScheduleItem[] =
      [];

  for (
    const stopId of
      candidate.stopOrder
  ) {
    const stop =
      stopMap.get(
        stopId,
      );

    if (!stop) {
      return {
        success: false,
        error: {
          code:
            "INVALID_CANDIDATE",
          message:
            `Stoppet "${stopId}" saknas i kandidaten.`,
          stopId,
        },
      };
    }

    if (
      stop.type !== "job"
    ) {
      continue;
    }

    if (
      !isValidWorkOrderId(
        stop.workOrderId,
      )
    ) {
      return {
        success: false,
        error: {
          code:
            "MISSING_WORK_ORDER",
          message:
            `Jobbstoppet "${stop.label}" saknar ett giltigt arbetsorder-ID.`,
          stopId:
            stop.id,
          workOrderId:
            stop.workOrderId ??
            null,
        },
      };
    }

    const serviceDurationMinutes =
      stop.serviceDurationMinutes ??
      0;

    if (
      !Number.isFinite(
        serviceDurationMinutes,
      ) ||
      serviceDurationMinutes <=
        0
    ) {
      return {
        success: false,
        error: {
          code:
            "INVALID_SERVICE_DURATION",
          message:
            `Jobbet "${stop.label}" saknar en giltig servicetid.`,
          stopId:
            stop.id,
          workOrderId:
            stop.workOrderId,
        },
      };
    }

    const incomingLeg =
      incomingLegMap.get(
        stop.id,
      );

    const outgoingLeg =
      outgoingLegMap.get(
        stop.id,
      );

    /*
     * För ett jobbstopp är Google-legens arrivalTime
     * vår säkraste faktiska startpunkt.
     *
     * Vi skriver aldrig till databasen från denna funktion.
     * Saknas verifierad timing stoppas materialiseringen.
     */
    const arrivalTime =
      incomingLeg
        ?.arrivalTime ??
      null;

    if (
      !isValidIsoTime(
        arrivalTime,
      )
    ) {
      return {
        success: false,
        error: {
          code:
            "MISSING_TIMING",
          message:
            `Jobbet "${stop.label}" saknar Google-verifierad ankomsttid.`,
          stopId:
            stop.id,
          workOrderId:
            stop.workOrderId,
        },
      };
    }

    const verifiedArrivalTime =
      arrivalTime as string;

    const calculatedEndTime =
      addMinutes(
        verifiedArrivalTime,
        serviceDurationMinutes,
      );

    items.push({
      workOrderId:
        stop.workOrderId,
      stopId:
        stop.id,
      technicianName:
        candidate.technicianName,
      date:
        candidate.date,
      startTime:
        formatTime(
          verifiedArrivalTime,
        ),
      endTime:
        formatTime(
          calculatedEndTime,
        ),
      serviceDurationMinutes,
      arrivalTime:
        verifiedArrivalTime,
      departureTime:
        outgoingLeg
          ?.departureTime ??
        null,
    });
  }

  if (
    items.length === 0
  ) {
    return {
      success: false,
      error: {
        code:
          "INVALID_CANDIDATE",
        message:
          "Kandidaten innehåller inga materialiserbara jobb.",
      },
    };
  }

  return {
    success: true,
    items,
  };
}