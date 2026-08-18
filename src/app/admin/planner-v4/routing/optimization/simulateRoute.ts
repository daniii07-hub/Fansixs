import type {
  RouteLeg,
  RouteStop,
  TechnicianRoute,
} from "../types";
import {
  scoreRoute,
} from "./scoreRoute";
import type {
  RouteOptimizationCandidate,
  RouteOptimizationLegSnapshot,
  RouteOptimizationMetrics,
  RouteOptimizationRequest,
  RouteOptimizationSimulationRequest,
  RouteOptimizationSimulationResult,
  RouteOptimizationStopSnapshot,
} from "./types";

const EARTH_RADIUS_METERS =
  6_371_000;

const DEFAULT_DRIVE_SPEED_KMH =
  35;

const MIN_SPEED_KMH = 10;
const MAX_SPEED_KMH = 110;

type OrderedStop = RouteStop & {
  coordinate: NonNullable<
    RouteStop["coordinate"]
  >;
};

function createCandidateId(
  route: TechnicianRoute,
  stopOrder: string[],
) {
  const raw = [
    route.technicianId,
    route.date,
    ...stopOrder,
  ].join("|");

  let hash = 2166136261;

  for (
    let index = 0;
    index < raw.length;
    index += 1
  ) {
    hash ^= raw.charCodeAt(index);
    hash = Math.imul(
      hash,
      16777619,
    );
  }

  return `candidate-${(
    hash >>> 0
  ).toString(36)}`;
}

function toRadians(
  degrees: number,
) {
  return (
    degrees *
    (Math.PI / 180)
  );
}

function getAirDistanceMeters(
  from: OrderedStop,
  to: OrderedStop,
) {
  const fromLatitude =
    toRadians(
      from.coordinate.latitude,
    );

  const toLatitude =
    toRadians(
      to.coordinate.latitude,
    );

  const latitudeDelta =
    toRadians(
      to.coordinate.latitude -
        from.coordinate.latitude,
    );

  const longitudeDelta =
    toRadians(
      to.coordinate.longitude -
        from.coordinate.longitude,
    );

  const haversine =
    Math.sin(
      latitudeDelta / 2,
    ) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(
        longitudeDelta / 2,
      ) ** 2;

  const centralAngle =
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine),
    );

  return Math.max(
    0,
    EARTH_RADIUS_METERS *
      centralAngle,
  );
}

function getKnownLegMap(
  legs: RouteLeg[],
) {
  return new Map(
    legs.map((leg) => [
      `${leg.fromStopId}|${leg.toStopId}`,
      leg,
    ]),
  );
}

function reverseKnownLeg(
  leg: RouteLeg,
  fromStopId: string,
  toStopId: string,
): RouteOptimizationLegSnapshot {
  return {
    id: `reversed-${fromStopId}-${toStopId}`,
    fromStopId,
    toStopId,
    distanceMeters:
      leg.distanceMeters,
    durationSeconds:
      leg.durationSeconds,
    staticDurationSeconds:
      leg.staticDurationSeconds ??
      null,
    departureTime: null,
    arrivalTime: null,
  };
}

function getFallbackLegMetrics(
  route: TechnicianRoute,
) {
  const usableLegs =
    route.legs.filter(
      (leg) =>
        leg.distanceMeters > 0 &&
        leg.durationSeconds > 0,
    );

  if (usableLegs.length === 0) {
    const fallbackDistanceMeters =
      route.summary.stopCount > 1
        ? Math.max(
            1000,
            Math.round(
              route.summary
                .totalDistanceMeters /
                (route.summary.stopCount -
                  1),
            ),
          )
        : 5000;

    const fallbackDurationSeconds =
      route.summary.stopCount > 1
        ? Math.max(
            60,
            Math.round(
              route.summary
                .totalDurationSeconds /
                (route.summary.stopCount -
                  1),
            ),
          )
        : Math.round(
            (fallbackDistanceMeters /
              (DEFAULT_DRIVE_SPEED_KMH /
                3.6)),
          );

    return {
      distanceMeters:
        fallbackDistanceMeters,
      durationSeconds:
        fallbackDurationSeconds,
      staticDurationSeconds:
        fallbackDurationSeconds,
    };
  }

  const distanceMeters =
    Math.max(
      1,
      Math.round(
        usableLegs.reduce(
          (total, leg) =>
            total +
            leg.distanceMeters,
          0,
        ) / usableLegs.length,
      ),
    );

  const durationSeconds =
    Math.max(
      60,
      Math.round(
        usableLegs.reduce(
          (total, leg) =>
            total +
            leg.durationSeconds,
          0,
        ) / usableLegs.length,
      ),
    );

  const staticDurations =
    usableLegs
      .map(
        (leg) =>
          leg.staticDurationSeconds,
      )
      .filter(
        (
          value,
        ): value is number =>
          typeof value === "number" &&
          value > 0,
      );

  return {
    distanceMeters,
    durationSeconds,
    staticDurationSeconds:
      staticDurations.length > 0
        ? Math.max(
            60,
            Math.round(
              staticDurations.reduce(
                (total, value) =>
                  total + value,
                0,
              ) /
                staticDurations.length,
            ),
          )
        : durationSeconds,
  };
}

function getRouteDistanceFactor(
  route: TechnicianRoute,
) {
  const stopMap = new Map(
    route.stops.map((stop) => [
      stop.id,
      stop,
    ]),
  );

  let totalAirDistance = 0;
  let totalRoadDistance = 0;

  for (const leg of route.legs) {
    const from =
      stopMap.get(
        leg.fromStopId,
      );

    const to =
      stopMap.get(
        leg.toStopId,
      );

    if (
      !from?.coordinate ||
      !to?.coordinate
    ) {
      continue;
    }

    const airDistance =
      getAirDistanceMeters(
        from as OrderedStop,
        to as OrderedStop,
      );

    if (airDistance <= 0) {
      continue;
    }

    totalAirDistance +=
      airDistance;

    totalRoadDistance +=
      Math.max(
        0,
        leg.distanceMeters,
      );
  }

  if (
    totalAirDistance <= 0 ||
    totalRoadDistance <= 0
  ) {
    return 1.3;
  }

  return Math.min(
    2.5,
    Math.max(
      1,
      totalRoadDistance /
        totalAirDistance,
    ),
  );
}

function getAverageSpeedMetersPerSecond(
  route: TechnicianRoute,
) {
  const validLegs =
    route.legs.filter(
      (leg) =>
        leg.distanceMeters > 0 &&
        leg.durationSeconds > 0,
    );

  if (validLegs.length === 0) {
    return (
      DEFAULT_DRIVE_SPEED_KMH /
      3.6
    );
  }

  const totalDistance =
    validLegs.reduce(
      (total, leg) =>
        total +
        leg.distanceMeters,
      0,
    );

  const totalDuration =
    validLegs.reduce(
      (total, leg) =>
        total +
        leg.durationSeconds,
      0,
    );

  if (totalDuration <= 0) {
    return (
      DEFAULT_DRIVE_SPEED_KMH /
      3.6
    );
  }

  const speedKmh =
    (totalDistance /
      totalDuration) *
    3.6;

  return (
    Math.min(
      MAX_SPEED_KMH,
      Math.max(
        MIN_SPEED_KMH,
        speedKmh,
      ),
    ) / 3.6
  );
}

function getTrafficMultiplier(
  route: TechnicianRoute,
) {
  const staticSeconds =
    route.summary
      .totalStaticDurationSeconds;

  const actualSeconds =
    route.summary
      .totalDurationSeconds;

  if (
    !staticSeconds ||
    staticSeconds <= 0 ||
    actualSeconds <= 0
  ) {
    return 1;
  }

  return Math.min(
    2.5,
    Math.max(
      1,
      actualSeconds /
        staticSeconds,
    ),
  );
}

function buildStopSnapshots(
  orderedStops: RouteStop[],
): RouteOptimizationStopSnapshot[] {
  return orderedStops.map(
    (stop) => ({
      id: stop.id,
      type: stop.type,
      label: stop.label,
      workOrderId:
        stop.workOrderId ?? null,
      bookingId:
        stop.bookingId ?? null,
      technician:
        stop.technician ?? null,
      plannedStartTime:
        stop.plannedStartTime ??
        null,
      plannedEndTime:
        stop.plannedEndTime ??
        null,
      serviceDurationMinutes:
        stop.serviceDurationMinutes ??
        null,
      coordinate:
        stop.coordinate ?? null,
    }),
  );
}

function buildEstimatedLegs({
  route,
  orderedStops,
}: {
  route: TechnicianRoute;
  orderedStops: RouteStop[];
}): RouteOptimizationLegSnapshot[] {
  const knownLegs =
    getKnownLegMap(route.legs);

  const distanceFactor =
    getRouteDistanceFactor(route);

  const speedMetersPerSecond =
    getAverageSpeedMetersPerSecond(
      route,
    );

  const trafficMultiplier =
    getTrafficMultiplier(route);

  const fallbackLeg =
    getFallbackLegMetrics(route);

  const legs:
    RouteOptimizationLegSnapshot[] =
      [];

  for (
    let index = 0;
    index <
    orderedStops.length - 1;
    index += 1
  ) {
    const from =
      orderedStops[index];

    const to =
      orderedStops[index + 1];

    const knownLeg =
      knownLegs.get(
        `${from.id}|${to.id}`,
      );

    if (knownLeg) {
      legs.push({
        id:
          knownLeg.id ||
          `${from.id}-${to.id}`,
        fromStopId: from.id,
        toStopId: to.id,
        distanceMeters:
          knownLeg.distanceMeters,
        durationSeconds:
          knownLeg.durationSeconds,
        staticDurationSeconds:
          knownLeg
            .staticDurationSeconds ??
          null,
        departureTime:
          knownLeg.departureTime ??
          null,
        arrivalTime:
          knownLeg.arrivalTime ??
          null,
      });

      continue;
    }

    const reverseLeg =
      knownLegs.get(
        `${to.id}|${from.id}`,
      );

    if (reverseLeg) {
      legs.push(
        reverseKnownLeg(
          reverseLeg,
          from.id,
          to.id,
        ),
      );

      continue;
    }

    if (
      !from.coordinate ||
      !to.coordinate
    ) {
      /*
       * Adressbaserade stopp kan verifieras av Google
       * Routes, men den lokala simulatorn kan inte
       * geokoda adresser. Använd därför en kalibrerad
       * genomsnittssträcka tills vinnaren verifieras.
       */
      legs.push({
        id: `fallback-${from.id}-${to.id}`,
        fromStopId: from.id,
        toStopId: to.id,
        distanceMeters:
          fallbackLeg.distanceMeters,
        durationSeconds:
          fallbackLeg.durationSeconds,
        staticDurationSeconds:
          fallbackLeg
            .staticDurationSeconds,
        departureTime: null,
        arrivalTime: null,
      });

      continue;
    }

    const airDistance =
      getAirDistanceMeters(
        from as OrderedStop,
        to as OrderedStop,
      );

    const distanceMeters =
      Math.max(
        1,
        Math.round(
          airDistance *
            distanceFactor,
        ),
      );

    const staticDurationSeconds =
      Math.max(
        60,
        Math.round(
          distanceMeters /
            speedMetersPerSecond,
        ),
      );

    const durationSeconds =
      Math.max(
        staticDurationSeconds,
        Math.round(
          staticDurationSeconds *
            trafficMultiplier,
        ),
      );

    legs.push({
      id: `estimated-${from.id}-${to.id}`,
      fromStopId: from.id,
      toStopId: to.id,
      distanceMeters,
      durationSeconds,
      staticDurationSeconds,
      departureTime: null,
      arrivalTime: null,
    });
  }

  return legs;
}

function getTotalServiceMinutes(
  orderedStops: RouteStop[],
  fallback: number,
) {
  const explicitTotal =
    orderedStops.reduce(
      (total, stop) =>
        total +
        Math.max(
          0,
          stop.serviceDurationMinutes ??
            0,
        ),
      0,
    );

  return explicitTotal > 0
    ? explicitTotal
    : fallback;
}

function buildMetrics({
  route,
  orderedStops,
  legs,
}: {
  route: TechnicianRoute;
  orderedStops: RouteStop[];
  legs: RouteOptimizationLegSnapshot[];
}): RouteOptimizationMetrics {
  const totalDistanceMeters =
    legs.reduce(
      (total, leg) =>
        total +
        leg.distanceMeters,
      0,
    );

  const totalDurationSeconds =
    legs.reduce(
      (total, leg) =>
        total +
        leg.durationSeconds,
      0,
    );

  const totalDriveMinutes =
    Math.round(
      totalDurationSeconds / 60,
    );

  const totalServiceMinutes =
    getTotalServiceMinutes(
      orderedStops,
      route.summary
        .totalServiceMinutes,
    );

  return {
    totalDistanceMeters,
    totalDriveMinutes,
    totalServiceMinutes,
    totalWorkMinutes:
      totalDriveMinutes +
      totalServiceMinutes,
    totalDurationSeconds,
    jobCount:
      orderedStops.filter(
        (stop) =>
          stop.type === "job",
      ).length,
    stopCount:
      orderedStops.length,
  };
}

function validateStopOrder(
  route: TechnicianRoute,
  stopOrder: string[],
) {
  if (
    stopOrder.length !==
    route.stops.length
  ) {
    throw new Error(
      "Stoppordningen innehåller fel antal stopp.",
    );
  }

  const expectedIds =
    new Set(
      route.stops.map(
        (stop) => stop.id,
      ),
    );

  const receivedIds =
    new Set(stopOrder);

  if (
    receivedIds.size !==
      stopOrder.length ||
    expectedIds.size !==
      receivedIds.size ||
    stopOrder.some(
      (stopId) =>
        !expectedIds.has(stopId),
    )
  ) {
    throw new Error(
      "Stoppordningen innehåller saknade eller duplicerade stopp.",
    );
  }
}

function buildCandidate(
  route: TechnicianRoute,
  stopOrder: string[],
  source:
    | "current"
    | "simulated",
): Omit<
  RouteOptimizationCandidate,
  "score"
> {
  validateStopOrder(
    route,
    stopOrder,
  );

  const stopMap = new Map(
    route.stops.map((stop) => [
      stop.id,
      stop,
    ]),
  );

  const orderedStops =
    stopOrder.map((stopId) => {
      const stop =
        stopMap.get(stopId);

      if (!stop) {
        throw new Error(
          `Stoppet "${stopId}" kunde inte hittas.`,
        );
      }

      return stop;
    });

  const isBaseline =
    source === "current";

  const legs = isBaseline
    ? route.legs.map(
        (
          leg,
        ): RouteOptimizationLegSnapshot => ({
          id: leg.id,
          fromStopId:
            leg.fromStopId,
          toStopId:
            leg.toStopId,
          distanceMeters:
            leg.distanceMeters,
          durationSeconds:
            leg.durationSeconds,
          staticDurationSeconds:
            leg.staticDurationSeconds ??
            null,
          departureTime:
            leg.departureTime ??
            null,
          arrivalTime:
            leg.arrivalTime ??
            null,
        }),
      )
    : buildEstimatedLegs({
        route,
        orderedStops,
      });

  const metrics = isBaseline
    ? {
        totalDistanceMeters:
          route.summary
            .totalDistanceMeters,
        totalDriveMinutes:
          route.summary
            .totalDriveMinutes,
        totalServiceMinutes:
          route.summary
            .totalServiceMinutes,
        totalWorkMinutes:
          route.summary
            .totalWorkMinutes,
        totalDurationSeconds:
          route.summary
            .totalDurationSeconds,
        jobCount:
          route.summary.jobCount,
        stopCount:
          route.summary.stopCount,
      }
    : buildMetrics({
        route,
        orderedStops,
        legs,
      });

  return {
    id: createCandidateId(
      route,
      stopOrder,
    ),
    technicianId:
      route.technicianId,
    technicianName:
      route.technicianName,
    date: route.date,
    stopOrder: [...stopOrder],
    stops:
      buildStopSnapshots(
        orderedStops,
      ),
    legs,
    metrics,
    source,
  };
}

export function simulateRoute({
  route,
  stopOrder,
  options,
}: RouteOptimizationSimulationRequest): RouteOptimizationSimulationResult {
  try {
    const baselineOrder =
      route.stops.map(
        (stop) => stop.id,
      );

    const isBaseline =
      baselineOrder.every(
        (stopId, index) =>
          stopId ===
          stopOrder[index],
      );

    const candidate =
      buildCandidate(
        route,
        stopOrder,
        isBaseline
          ? "current"
          : "simulated",
      );

    const score = scoreRoute({
      baseline: route,
      candidate,
      objective:
        options?.objective,
      constraints:
        options?.constraints,
      weights:
        options?.weights,
    });

    return {
      success: true,
      candidate: {
        ...candidate,
        score,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code:
          "SIMULATION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Rutten kunde inte simuleras.",
        details: error,
      },
    };
  }
}

export function createBaselineCandidate(
  request: RouteOptimizationRequest,
) {
  return simulateRoute({
    route: request.route,
    stopOrder:
      request.route.stops.map(
        (stop) => stop.id,
      ),
    options:
      request.options,
  });
}