import type {
  RouteCoordinate,
  RouteStop,
  TechnicianRoute,
} from "../routing";

import type {
  DispatcherAnalysis,
  DispatcherMoveCandidate,
  DispatcherMoveReason,
  DispatcherOptions,
  DispatcherTechnicianImpact,
} from "./types";

type RouteCollection =
  | Record<string, TechnicianRoute>
  | TechnicianRoute[];

type ResolvedDispatcherOptions = {
  maxCandidates: number;
  maxTargetWorkMinutes: number;
  minimumEstimatedDriveMinutesSaved: number;
  workloadBalanceWeight: number;
  driveTimeWeight: number;
  distanceWeight: number;
};

const DEFAULT_OPTIONS: ResolvedDispatcherOptions = {
  maxCandidates: 50,
  maxTargetWorkMinutes: 480,
  minimumEstimatedDriveMinutesSaved: 0,
  workloadBalanceWeight: 1,
  driveTimeWeight: 1,
  distanceWeight: 0.35,
};

function normalizeRoutes(routes: RouteCollection): TechnicianRoute[] {
  return Array.isArray(routes) ? routes : Object.values(routes);
}

function resolveOptions(
  options?: DispatcherOptions,
): ResolvedDispatcherOptions {
  return {
    maxCandidates: Math.max(
      1,
      Math.floor(
        options?.maxCandidates ??
          DEFAULT_OPTIONS.maxCandidates,
      ),
    ),
    maxTargetWorkMinutes:
      options?.maxTargetWorkMinutes ??
      DEFAULT_OPTIONS.maxTargetWorkMinutes,
    minimumEstimatedDriveMinutesSaved:
      options?.minimumEstimatedDriveMinutesSaved ??
      DEFAULT_OPTIONS.minimumEstimatedDriveMinutesSaved,
    workloadBalanceWeight:
      options?.workloadBalanceWeight ??
      DEFAULT_OPTIONS.workloadBalanceWeight,
    driveTimeWeight:
      options?.driveTimeWeight ??
      DEFAULT_OPTIONS.driveTimeWeight,
    distanceWeight:
      options?.distanceWeight ??
      DEFAULT_OPTIONS.distanceWeight,
  };
}

function isCoordinate(
  coordinate: RouteCoordinate | null | undefined,
): coordinate is RouteCoordinate {
  return Boolean(
    coordinate &&
      Number.isFinite(coordinate.latitude) &&
      Number.isFinite(coordinate.longitude),
  );
}

function toRadians(value: number) {
  return value * (Math.PI / 180);
}

function haversineDistanceMeters(
  a: RouteCoordinate,
  b: RouteCoordinate,
) {
  const earthRadiusMeters = 6_371_000;

  const latitudeDelta = toRadians(
    b.latitude - a.latitude,
  );

  const longitudeDelta = toRadians(
    b.longitude - a.longitude,
  );

  const latitudeA = toRadians(a.latitude);
  const latitudeB = toRadians(b.latitude);

  const sinLatitude = Math.sin(latitudeDelta / 2);
  const sinLongitude = Math.sin(longitudeDelta / 2);

  const h =
    sinLatitude * sinLatitude +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      sinLongitude *
      sinLongitude;

  return (
    2 *
    earthRadiusMeters *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(h),
      ),
    )
  );
}

function estimateAverageMetersPerMinute(
  routes: TechnicianRoute[],
) {
  const distance = routes.reduce(
    (sum, route) =>
      sum +
      route.summary.totalDistanceMeters,
    0,
  );

  const minutes = routes.reduce(
    (sum, route) =>
      sum +
      route.summary.totalDriveMinutes,
    0,
  );

  return distance > 0 && minutes > 0
    ? distance / minutes
    : 35_000 / 60;
}

function getJobStops(
  route: TechnicianRoute,
) {
  return route.stops.filter(
    (
      stop,
    ): stop is RouteStop & {
      workOrderId: number;
      coordinate: RouteCoordinate;
    } =>
      stop.type === "job" &&
      typeof stop.workOrderId === "number" &&
      Number.isInteger(stop.workOrderId) &&
      stop.workOrderId > 0 &&
      isCoordinate(stop.coordinate),
  );
}

function estimateRemovalDistance(
  route: TechnicianRoute,
  stop: RouteStop & {
    coordinate: RouteCoordinate;
  },
) {
  const index = route.stops.findIndex(
    (candidate) => candidate.id === stop.id,
  );

  const previous = route.stops[index - 1];
  const next = route.stops[index + 1];

  if (
    index < 0 ||
    !previous ||
    !next ||
    !isCoordinate(previous.coordinate) ||
    !isCoordinate(next.coordinate)
  ) {
    return 0;
  }

  const currentDistance =
    haversineDistanceMeters(
      previous.coordinate,
      stop.coordinate,
    ) +
    haversineDistanceMeters(
      stop.coordinate,
      next.coordinate,
    );

  const directDistance =
    haversineDistanceMeters(
      previous.coordinate,
      next.coordinate,
    );

  return Math.max(
    0,
    currentDistance - directDistance,
  );
}

function estimateBestInsertionDistance(
  route: TechnicianRoute,
  stop: RouteStop & {
    coordinate: RouteCoordinate;
  },
) {
  const stops = route.stops.filter(
    (
      candidate,
    ): candidate is RouteStop & {
      coordinate: RouteCoordinate;
    } => isCoordinate(candidate.coordinate),
  );

  if (stops.length < 2) {
    return null;
  }

  let best = Number.POSITIVE_INFINITY;

  for (
    let index = 0;
    index < stops.length - 1;
    index += 1
  ) {
    const from = stops[index];
    const to = stops[index + 1];

    const existing =
      haversineDistanceMeters(
        from.coordinate,
        to.coordinate,
      );

    const inserted =
      haversineDistanceMeters(
        from.coordinate,
        stop.coordinate,
      ) +
      haversineDistanceMeters(
        stop.coordinate,
        to.coordinate,
      );

    best = Math.min(
      best,
      Math.max(
        0,
        inserted - existing,
      ),
    );
  }

  return Number.isFinite(best)
    ? best
    : null;
}

function impact(
  value: DispatcherTechnicianImpact,
): DispatcherTechnicianImpact {
  return value;
}

function getReason({
  driveSaved,
  distanceSaved,
  workloadImprovement,
}: {
  driveSaved: number;
  distanceSaved: number;
  workloadImprovement: number;
}): DispatcherMoveReason {
  if (
    workloadImprovement > driveSaved &&
    workloadImprovement > 10
  ) {
    return "balance_workload";
  }

  if (driveSaved >= 5) {
    return "reduce_drive_time";
  }

  return distanceSaved > 0
    ? "reduce_distance"
    : "balance_workload";
}

function createCandidate({
  sourceRoute,
  targetRoute,
  stop,
  metersPerMinute,
  options,
}: {
  sourceRoute: TechnicianRoute;
  targetRoute: TechnicianRoute;
  stop: RouteStop & {
    workOrderId: number;
    coordinate: RouteCoordinate;
  };
  metersPerMinute: number;
  options: ResolvedDispatcherOptions;
}): DispatcherMoveCandidate | null {
  if (
    sourceRoute.technicianName ===
      targetRoute.technicianName ||
    sourceRoute.date !== targetRoute.date
  ) {
    return null;
  }

  const insertionDistance =
    estimateBestInsertionDistance(
      targetRoute,
      stop,
    );

  if (insertionDistance === null) {
    return null;
  }

  const removalDistance =
    estimateRemovalDistance(
      sourceRoute,
      stop,
    );

  const distanceSaved =
    Math.round(
      removalDistance -
        insertionDistance,
    );

  const sourceDriveSaved =
    removalDistance /
    metersPerMinute;

  const targetDriveAdded =
    insertionDistance /
    metersPerMinute;

  const driveSaved =
    Math.round(
      sourceDriveSaved -
        targetDriveAdded,
    );

  const serviceMinutes = Math.max(
    0,
    stop.serviceDurationMinutes ?? 0,
  );

  const sourceBefore =
    sourceRoute.summary.totalWorkMinutes;

  const targetBefore =
    targetRoute.summary.totalWorkMinutes;

  const sourceAfter = Math.max(
    0,
    sourceBefore -
      serviceMinutes -
      sourceDriveSaved,
  );

  const targetAfter = Math.max(
    0,
    targetBefore +
      serviceMinutes +
      targetDriveAdded,
  );

  const workloadBefore = Math.abs(
    sourceBefore - targetBefore,
  );

  const workloadAfter = Math.abs(
    sourceAfter - targetAfter,
  );

  const workloadImprovement =
    Math.round(
      workloadBefore -
        workloadAfter,
    );

  const warnings: string[] = [];

  if (
    targetAfter >
    options.maxTargetWorkMinutes
  ) {
    warnings.push(
      `Målteknikern uppskattas få ${Math.round(
        targetAfter,
      )} min total arbetstid.`,
    );
  }

  if (
    driveSaved <
    options.minimumEstimatedDriveMinutesSaved
  ) {
    warnings.push(
      "Den uppskattade körtidsvinsten är lägre än miniminivån.",
    );
  }

  const status =
    targetAfter >
    options.maxTargetWorkMinutes
      ? "blocked"
      : "candidate";

  const score =
    driveSaved *
      options.driveTimeWeight +
    (distanceSaved / 1000) *
      options.distanceWeight +
    workloadImprovement *
      options.workloadBalanceWeight;

  return {
    id:
      `${stop.workOrderId}:${sourceRoute.technicianName}->${targetRoute.technicianName}`,
    workOrderId: stop.workOrderId,
    bookingId: stop.bookingId ?? null,
    sourceTechnician:
      sourceRoute.technicianName,
    targetTechnician:
      targetRoute.technicianName,
    stop,
    reason: getReason({
      driveSaved,
      distanceSaved,
      workloadImprovement,
    }),
    status,
    estimatedDriveMinutesSaved:
      driveSaved,
    estimatedDistanceMetersSaved:
      distanceSaved,
    sourceImpact: impact({
      technicianName:
        sourceRoute.technicianName,
      beforeWorkMinutes:
        Math.round(sourceBefore),
      estimatedAfterWorkMinutes:
        Math.round(sourceAfter),
      beforeDriveMinutes:
        Math.round(
          sourceRoute.summary.totalDriveMinutes,
        ),
      estimatedAfterDriveMinutes:
        Math.round(
          Math.max(
            0,
            sourceRoute.summary.totalDriveMinutes -
              sourceDriveSaved,
          ),
        ),
      beforeJobCount:
        sourceRoute.summary.jobCount,
      estimatedAfterJobCount:
        Math.max(
          0,
          sourceRoute.summary.jobCount - 1,
        ),
    }),
    targetImpact: impact({
      technicianName:
        targetRoute.technicianName,
      beforeWorkMinutes:
        Math.round(targetBefore),
      estimatedAfterWorkMinutes:
        Math.round(targetAfter),
      beforeDriveMinutes:
        Math.round(
          targetRoute.summary.totalDriveMinutes,
        ),
      estimatedAfterDriveMinutes:
        Math.round(
          targetRoute.summary.totalDriveMinutes +
            targetDriveAdded,
        ),
      beforeJobCount:
        targetRoute.summary.jobCount,
      estimatedAfterJobCount:
        targetRoute.summary.jobCount + 1,
    }),
    score: Number(score.toFixed(2)),
    warnings,
  };
}

export function analyzeDispatcher(
  routes: RouteCollection,
  options?: DispatcherOptions,
): DispatcherAnalysis {
  const routeList =
    normalizeRoutes(routes);

  const resolvedOptions =
    resolveOptions(options);

  const metersPerMinute =
    estimateAverageMetersPerMinute(
      routeList,
    );

  const candidates:
    DispatcherMoveCandidate[] = [];

  let jobCount = 0;
  let candidatesEvaluated = 0;

  for (const sourceRoute of routeList) {
    const jobs =
      getJobStops(sourceRoute);

    jobCount += jobs.length;

    for (const stop of jobs) {
      for (const targetRoute of routeList) {
        if (
          targetRoute.technicianName ===
          sourceRoute.technicianName
        ) {
          continue;
        }

        candidatesEvaluated += 1;

        const candidate =
          createCandidate({
            sourceRoute,
            targetRoute,
            stop,
            metersPerMinute,
            options:
              resolvedOptions,
          });

        if (candidate) {
          candidates.push(candidate);
        }
      }
    }
  }

  const sortedCandidates =
    candidates
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status ===
            "candidate"
            ? -1
            : 1;
        }

        return b.score - a.score;
      })
      .slice(
        0,
        resolvedOptions.maxCandidates,
      );

  const bestCandidate =
    sortedCandidates.find(
      (candidate) =>
        candidate.status ===
          "candidate" &&
        candidate.score > 0,
    ) ?? null;

  return {
    generatedAt:
      new Date().toISOString(),
    technicianCount:
      routeList.length,
    jobCount,
    candidatesEvaluated,
    candidates:
      sortedCandidates,
    bestCandidate,
  };
}