import type {
  RouteStop,
  TechnicianRoute,
} from "../types";
import {
  DEFAULT_ROUTE_OPTIMIZATION_CONSTRAINTS,
  type RouteOptimizationCandidate,
  type RouteOptimizationConstraints,
  type RouteOptimizationViolation,
} from "./types";

function isFinitePositiveNumber(
  value: number | null | undefined,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function mergeConstraints(
  constraints?: RouteOptimizationConstraints,
): Required<RouteOptimizationConstraints> {
  return {
    ...DEFAULT_ROUTE_OPTIMIZATION_CONSTRAINTS,
    ...constraints,
  };
}

function getJobStops(
  stops: RouteStop[],
) {
  return stops.filter(
    (stop) => stop.type === "job",
  );
}

function getStartStop(
  stops: RouteStop[],
) {
  return (
    stops.find(
      (stop) =>
        stop.type === "start",
    ) ?? null
  );
}

function getEndStop(
  stops: RouteStop[],
) {
  return (
    [...stops]
      .reverse()
      .find(
        (stop) =>
          stop.type === "end",
      ) ?? null
  );
}

function hasCoordinate(
  stop: RouteStop,
) {
  const latitude =
    stop.coordinate?.latitude;

  const longitude =
    stop.coordinate?.longitude;

  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function hasUsableAddress(
  stop: RouteStop,
) {
  return Boolean(
    stop.address
      ?.formattedAddress
      ?.trim(),
  );
}

function hasUsableLocation(
  stop: RouteStop,
) {
  return (
    hasCoordinate(stop) ||
    hasUsableAddress(stop)
  );
}

function isFixedStop(
  stop: RouteStop,
) {
  return (
    stop.type === "start" ||
    stop.type === "break" ||
    stop.type === "end"
  );
}

export function validateRouteForOptimization({
  route,
  constraints,
}: {
  route: TechnicianRoute;
  constraints?: RouteOptimizationConstraints;
}): RouteOptimizationViolation[] {
  const resolved =
    mergeConstraints(constraints);

  const violations:
    RouteOptimizationViolation[] = [];

  const jobStops =
    getJobStops(route.stops);

  if (
    jobStops.length <
    resolved.minimumJobCount
  ) {
    violations.push({
      code: "MIN_JOB_COUNT",
      severity: "error",
      message:
        `Minst ${resolved.minimumJobCount} jobb krävs för optimering.`,
      actualValue:
        jobStops.length,
      limitValue:
        resolved.minimumJobCount,
    });
  }

  if (
    resolved.requireJobCoordinates
  ) {
    for (const stop of jobStops) {
      if (
        hasUsableLocation(stop)
      ) {
        if (
          !hasCoordinate(stop) &&
          hasUsableAddress(stop)
        ) {
          violations.push({
            code:
              "REQUIRE_JOB_COORDINATES",
            severity: "warning",
            message:
              `Jobbstoppet "${stop.label}" saknar sparade koordinater och simuleras med adressbaserad fallback.`,
            stopId: stop.id,
            workOrderId:
              stop.workOrderId ??
              null,
            bookingId:
              stop.bookingId ??
              null,
          });
        }

        continue;
      }

      violations.push({
        code:
          "REQUIRE_JOB_COORDINATES",
        severity: "error",
        message:
          `Jobbstoppet "${stop.label}" saknar både giltiga koordinater och användbar adress.`,
        stopId: stop.id,
        workOrderId:
          stop.workOrderId ?? null,
        bookingId:
          stop.bookingId ?? null,
      });
    }
  }

  if (
    resolved.preserveStartStop &&
    !getStartStop(route.stops)
  ) {
    violations.push({
      code:
        "PRESERVE_START_STOP",
      severity: "warning",
      message:
        "Rutten saknar ett markerat startstopp.",
    });
  }

  if (
    resolved.preserveEndStop &&
    !getEndStop(route.stops)
  ) {
    violations.push({
      code:
        "PRESERVE_END_STOP",
      severity: "warning",
      message:
        "Rutten saknar ett markerat slutstopp.",
    });
  }

  return violations;
}

export function validateCandidateConstraints({
  baseline,
  candidate,
  constraints,
}: {
  baseline: TechnicianRoute;
  candidate: RouteOptimizationCandidate;
  constraints?: RouteOptimizationConstraints;
}): RouteOptimizationViolation[] {
  const resolved =
    mergeConstraints(constraints);

  const violations:
    RouteOptimizationViolation[] = [];

  if (
    isFinitePositiveNumber(
      resolved.maxWorkMinutes,
    ) &&
    candidate.metrics
      .totalWorkMinutes >
      resolved.maxWorkMinutes
  ) {
    violations.push({
      code:
        "MAX_WORK_MINUTES",
      severity: "error",
      message:
        "Kandidaten överskrider maximal total arbetstid.",
      actualValue:
        candidate.metrics
          .totalWorkMinutes,
      limitValue:
        resolved.maxWorkMinutes,
    });
  }

  if (
    isFinitePositiveNumber(
      resolved.maxDriveMinutes,
    ) &&
    candidate.metrics
      .totalDriveMinutes >
      resolved.maxDriveMinutes
  ) {
    violations.push({
      code:
        "MAX_DRIVE_MINUTES",
      severity: "error",
      message:
        "Kandidaten överskrider maximal körtid.",
      actualValue:
        candidate.metrics
          .totalDriveMinutes,
      limitValue:
        resolved.maxDriveMinutes,
    });
  }

  if (
    isFinitePositiveNumber(
      resolved.maxDistanceMeters,
    ) &&
    candidate.metrics
      .totalDistanceMeters >
      resolved.maxDistanceMeters
  ) {
    violations.push({
      code:
        "MAX_DISTANCE_METERS",
      severity: "error",
      message:
        "Kandidaten överskrider maximal körsträcka.",
      actualValue:
        candidate.metrics
          .totalDistanceMeters,
      limitValue:
        resolved.maxDistanceMeters,
    });
  }

  const candidateStopIds =
    new Set(
      candidate.stopOrder,
    );

  if (
    resolved.preserveStartStop
  ) {
    const startStop =
      getStartStop(
        baseline.stops,
      );

    if (
      startStop &&
      candidate.stopOrder[0] !==
        startStop.id
    ) {
      violations.push({
        code:
          "PRESERVE_START_STOP",
        severity: "error",
        message:
          "Startstoppet har flyttats från första positionen.",
        stopId: startStop.id,
      });
    }
  }

  if (
    resolved.preserveEndStop
  ) {
    const endStop =
      getEndStop(
        baseline.stops,
      );

    if (
      endStop &&
      candidate.stopOrder[
        candidate.stopOrder.length -
          1
      ] !== endStop.id
    ) {
      violations.push({
        code:
          "PRESERVE_END_STOP",
        severity: "error",
        message:
          "Slutstoppet har flyttats från sista positionen.",
        stopId: endStop.id,
      });
    }
  }

  if (
    resolved.preserveFixedStops
  ) {
    const baselineFixedStops =
      baseline.stops.filter(
        isFixedStop,
      );

    for (const stop of baselineFixedStops) {
      if (
        !candidateStopIds.has(
          stop.id,
        )
      ) {
        violations.push({
          code:
            "PRESERVE_FIXED_STOPS",
          severity: "error",
          message:
            `Det fasta stoppet "${stop.label}" saknas i kandidaten.`,
          stopId: stop.id,
        });

        continue;
      }

      const baselineIndex =
        baseline.stops.findIndex(
          (candidateStop) =>
            candidateStop.id ===
            stop.id,
        );

      const candidateIndex =
        candidate.stopOrder.indexOf(
          stop.id,
        );

      if (
        baselineIndex !==
        candidateIndex
      ) {
        violations.push({
          code:
            "PRESERVE_FIXED_STOPS",
          severity: "error",
          message:
            `Det fasta stoppet "${stop.label}" har flyttats.`,
          stopId: stop.id,
          actualValue:
            candidateIndex,
          limitValue:
            baselineIndex,
        });
      }
    }
  }

  if (
    resolved.preserveTimeWindows
  ) {
    for (
      const stop of
        baseline.stops
    ) {
      if (
        stop.type !== "job" ||
        (!stop.plannedStartTime &&
          !stop.plannedEndTime)
      ) {
        continue;
      }

      const candidateStop =
        candidate.stops.find(
          (candidateItem) =>
            candidateItem.id ===
            stop.id,
        );

      if (!candidateStop) {
        violations.push({
          code:
            "PRESERVE_TIME_WINDOWS",
          severity: "error",
          message:
            `Jobbstoppet "${stop.label}" saknas i kandidaten.`,
          stopId: stop.id,
          workOrderId:
            stop.workOrderId ??
            null,
          bookingId:
            stop.bookingId ??
            null,
        });

        continue;
      }

      if (
        candidateStop
          .plannedStartTime !==
          stop.plannedStartTime ||
        candidateStop
          .plannedEndTime !==
          stop.plannedEndTime
      ) {
        violations.push({
          code:
            "PRESERVE_TIME_WINDOWS",
          severity: "error",
          message:
            `Tidsfönstret för "${stop.label}" har ändrats.`,
          stopId: stop.id,
          workOrderId:
            stop.workOrderId ??
            null,
          bookingId:
            stop.bookingId ??
            null,
        });
      }
    }
  }

  if (
    resolved.requireJobCoordinates
  ) {
    const baselineStopMap =
      new Map(
        baseline.stops.map(
          (stop) => [
            stop.id,
            stop,
          ],
        ),
      );

    for (
      const candidateStop of
        candidate.stops
    ) {
      if (
        candidateStop.type !==
        "job"
      ) {
        continue;
      }

      const latitude =
        candidateStop.coordinate
          ?.latitude;

      const longitude =
        candidateStop.coordinate
          ?.longitude;

      const validCoordinate =
        typeof latitude ===
          "number" &&
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        typeof longitude ===
          "number" &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180;

      if (validCoordinate) {
        continue;
      }

      const baselineStop =
        baselineStopMap.get(
          candidateStop.id,
        );

      if (
        baselineStop &&
        hasUsableAddress(
          baselineStop,
        )
      ) {
        violations.push({
          code:
            "REQUIRE_JOB_COORDINATES",
          severity: "warning",
          message:
            `Jobbstoppet "${candidateStop.label}" saknar koordinater men har en adress som verifieras via Google Routes.`,
          stopId:
            candidateStop.id,
          workOrderId:
            candidateStop
              .workOrderId ??
            null,
          bookingId:
            candidateStop
              .bookingId ??
            null,
        });

        continue;
      }

      violations.push({
        code:
          "REQUIRE_JOB_COORDINATES",
        severity: "error",
        message:
          `Jobbstoppet "${candidateStop.label}" saknar både koordinater och användbar adress.`,
        stopId:
          candidateStop.id,
        workOrderId:
          candidateStop
            .workOrderId ?? null,
        bookingId:
          candidateStop
            .bookingId ?? null,
      });
    }
  }

  return violations;
}

export function hasBlockingViolations(
  violations:
    RouteOptimizationViolation[],
) {
  return violations.some(
    (violation) =>
      violation.severity ===
      "error",
  );
}