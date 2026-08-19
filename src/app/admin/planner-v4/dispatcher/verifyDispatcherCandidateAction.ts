"use server";

import type {
  DispatcherMoveCandidate,
} from "./types";

import type {
  PlannerEventWithDate,
} from "../../planner/queries";

import {
  buildRouteRequest,
} from "../routing/buildRouteRequest";

import {
  calculateTechnicianRoute,
} from "../routing/routeEngine";

import type {
  RouteEngineRequest,
  RouteStop,
  TechnicianRoute,
} from "../routing/types";

export type DispatcherVerificationStatus =
  | "improved"
  | "neutral"
  | "worse";

export type DispatcherVerifiedRouteImpact = {
  technicianName: string;

  beforeDistanceMeters: number;
  afterDistanceMeters: number;
  distanceDeltaMeters: number;

  beforeDriveMinutes: number;
  afterDriveMinutes: number;
  driveMinutesDelta: number;

  beforeWorkMinutes: number;
  afterWorkMinutes: number;
  workMinutesDelta: number;

  beforeJobCount: number;
  afterJobCount: number;
};

export type DispatcherVerificationSuccess = {
  success: true;

  status:
    DispatcherVerificationStatus;

  candidate:
    DispatcherMoveCandidate;

  sourceRoute:
    TechnicianRoute;

  targetRoute:
    TechnicianRoute;

  sourceImpact:
    DispatcherVerifiedRouteImpact;

  targetImpact:
    DispatcherVerifiedRouteImpact;

  totalBeforeDistanceMeters:
    number;

  totalAfterDistanceMeters:
    number;

  totalDistanceSavedMeters:
    number;

  totalBeforeDriveMinutes:
    number;

  totalAfterDriveMinutes:
    number;

  totalDriveMinutesSaved:
    number;

  totalBeforeWorkMinutes:
    number;

  totalAfterWorkMinutes:
    number;

  totalWorkMinutesSaved:
    number;

  verifiedAt: string;
};

export type DispatcherVerificationFailure = {
  success: false;

  code:
    | "INVALID_INPUT"
    | "SOURCE_ROUTE_INVALID"
    | "TARGET_ROUTE_INVALID"
    | "SOURCE_VERIFICATION_FAILED"
    | "TARGET_VERIFICATION_FAILED"
    | "UNKNOWN";

  message: string;

  details?: unknown;
};

export type DispatcherVerificationResult =
  | DispatcherVerificationSuccess
  | DispatcherVerificationFailure;

export type VerifyDispatcherCandidateInput = {
  candidate:
    DispatcherMoveCandidate;

  sourceRoute:
    TechnicianRoute;

  targetRoute?:
    TechnicianRoute | null;

  events:
    PlannerEventWithDate[];

  departureTime?: string | null;
};

function cloneStop(
  stop: RouteStop,
): RouteStop {
  return {
    ...stop,

    address: {
      ...stop.address,
    },

    coordinate:
      stop.coordinate
        ? {
            ...stop.coordinate,
          }
        : null,
  };
}

function getDepartureTime(
  route: TechnicianRoute,
  explicit?: string | null,
) {
  if (explicit) {
    return explicit;
  }

  return (
    route.legs.find(
      (leg) =>
        Boolean(
          leg.departureTime,
        ),
    )?.departureTime ??
    null
  );
}

function buildSourceStops({
  sourceRoute,
  workOrderId,
}: {
  sourceRoute:
    TechnicianRoute;

  workOrderId: number;
}) {
  return sourceRoute.stops
    .filter(
      (stop) =>
        stop.workOrderId !==
        workOrderId,
    )
    .map(cloneStop);
}

function buildTargetStops({
  targetRoute,
  movedStop,
}: {
  targetRoute:
    TechnicianRoute;

  movedStop:
    RouteStop;
}) {
  const clonedMovedStop:
    RouteStop = {
    ...cloneStop(
      movedStop,
    ),

    technician:
      targetRoute.technicianName,
  };

  const existingTargetStops =
    targetRoute.stops.map(
      cloneStop,
    );

  const endIndex =
    existingTargetStops.findIndex(
      (stop) =>
        stop.type ===
        "end",
    );

  if (endIndex < 0) {
    return [
      ...existingTargetStops,
      clonedMovedStop,
    ];
  }

  return [
    ...existingTargetStops.slice(
      0,
      endIndex,
    ),
    clonedMovedStop,
    ...existingTargetStops.slice(
      endIndex,
    ),
  ];
}

function buildRequest({
  route,
  stops,
  departureTime,
}: {
  route:
    TechnicianRoute;

  stops:
    RouteStop[];

  departureTime?:
    string | null;
}): RouteEngineRequest {
  return {
    technicianId:
      route.technicianId,

    technicianName:
      route.technicianName,

    date:
      route.date,

    stops,

    travelMode:
      route.travelMode,

    trafficPreference:
      route.trafficPreference,

    /*
     * Google får optimera waypoint-ordningen
     * inom respektive teknikers simulerade rutt.
     * Start/end förblir route-engine-ruttens
     * origin/destination.
     */
    optimizeWaypointOrder:
      true,

    departureTime:
      getDepartureTime(
        route,
        departureTime,
      ),
  };
}

function buildPlannerBaselineRoute({
  technicianName,
  date,
  events,
}: {
  technicianName: string;
  date: string;
  events: PlannerEventWithDate[];
}): TechnicianRoute {
  const request =
    buildRouteRequest({
      technician:
        technicianName,
      date,
      events,
    });

  const totalServiceMinutes =
    request.stops.reduce(
      (total, stop) =>
        total +
        (stop.serviceDurationMinutes ??
          0),
      0,
    );

  return {
    technicianId:
      request.technicianId,
    technicianName:
      request.technicianName,
    date:
      request.date,
    travelMode:
      request.travelMode ??
      "DRIVE",
    trafficPreference:
      request.trafficPreference ??
      "TRAFFIC_AWARE",
    stops:
      request.stops.map(cloneStop),
    legs: [],
    warnings: [
      "Baslinjen saknar en tidigare Route Engine-rutt.",
    ],
    summary: {
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      totalStaticDurationSeconds:
        0,
      totalServiceMinutes,
      totalDriveMinutes: 0,
      totalWorkMinutes:
        totalServiceMinutes,
      stopCount:
        request.stops.length,
      jobCount:
        request.stops.filter(
          (stop) =>
            stop.type === "job",
        ).length,
    },
  };
}

function buildPlannerTargetRequest({
  candidate,
  sourceRoute,
  events,
  departureTime,
}: {
  candidate:
    DispatcherMoveCandidate;
  sourceRoute:
    TechnicianRoute;
  events:
    PlannerEventWithDate[];
  departureTime?: string | null;
}): RouteEngineRequest {
  const simulatedEvents =
    events.map((event) =>
      event.id ===
      candidate.workOrderId
        ? {
            ...event,
            technician:
              candidate.targetTechnician,
          }
        : event,
    );

  const request =
    buildRouteRequest({
      technician:
        candidate.targetTechnician,
      date:
        sourceRoute.date,
      events:
        simulatedEvents,
    });

  return {
    ...request,
    optimizeWaypointOrder: true,
    departureTime:
      departureTime ?? null,
  };
}

function buildImpact({
  before,
  after,
}: {
  before:
    TechnicianRoute;

  after:
    TechnicianRoute;
}): DispatcherVerifiedRouteImpact {
  return {
    technicianName:
      before.technicianName,

    beforeDistanceMeters:
      before.summary
        .totalDistanceMeters,

    afterDistanceMeters:
      after.summary
        .totalDistanceMeters,

    distanceDeltaMeters:
      after.summary
        .totalDistanceMeters -
      before.summary
        .totalDistanceMeters,

    beforeDriveMinutes:
      before.summary
        .totalDriveMinutes,

    afterDriveMinutes:
      after.summary
        .totalDriveMinutes,

    driveMinutesDelta:
      after.summary
        .totalDriveMinutes -
      before.summary
        .totalDriveMinutes,

    beforeWorkMinutes:
      before.summary
        .totalWorkMinutes,

    afterWorkMinutes:
      after.summary
        .totalWorkMinutes,

    workMinutesDelta:
      after.summary
        .totalWorkMinutes -
      before.summary
        .totalWorkMinutes,

    beforeJobCount:
      before.summary.jobCount,

    afterJobCount:
      after.summary.jobCount,
  };
}

function getStatus({
  distanceSavedMeters,
  driveMinutesSaved,
  workMinutesSaved,
}: {
  distanceSavedMeters: number;
  driveMinutesSaved: number;
  workMinutesSaved: number;
}): DispatcherVerificationStatus {
  const positiveSignals = [
    distanceSavedMeters > 0,
    driveMinutesSaved > 0,
    workMinutesSaved > 0,
  ].filter(Boolean).length;

  const negativeSignals = [
    distanceSavedMeters < 0,
    driveMinutesSaved < 0,
    workMinutesSaved < 0,
  ].filter(Boolean).length;

  if (
    positiveSignals >
    negativeSignals
  ) {
    return "improved";
  }

  if (
    negativeSignals >
    positiveSignals
  ) {
    return "worse";
  }

  return "neutral";
}

export async function verifyDispatcherCandidateAction({
  candidate,
  sourceRoute,
  targetRoute = null,
  events,
  departureTime,
}: VerifyDispatcherCandidateInput): Promise<DispatcherVerificationResult> {
  try {
    if (
      !candidate ||
      !sourceRoute ||
      !Array.isArray(events) ||
      candidate.workOrderId <=
        0
    ) {
      return {
        success: false,
        code:
          "INVALID_INPUT",
        message:
          "Dispatcher-kandidaten eller ruttdatan är ogiltig.",
      };
    }

    if (
      sourceRoute.technicianName !==
      candidate.sourceTechnician
    ) {
      return {
        success: false,
        code:
          "SOURCE_ROUTE_INVALID",
        message:
          "Källrutten matchar inte Dispatcher-kandidatens tekniker.",
      };
    }

    if (
      targetRoute &&
      targetRoute.technicianName !==
        candidate.targetTechnician
    ) {
      return {
        success: false,
        code:
          "TARGET_ROUTE_INVALID",
        message:
          "Mål-rutten matchar inte Dispatcher-kandidatens tekniker.",
      };
    }

    if (
      targetRoute &&
      sourceRoute.date !==
        targetRoute.date
    ) {
      return {
        success: false,
        code:
          "INVALID_INPUT",
        message:
          "Dispatcher-verifiering kräver att båda teknikerna ligger på samma datum.",
      };
    }

    const movedStop =
      sourceRoute.stops.find(
        (stop) =>
          stop.workOrderId ===
          candidate.workOrderId,
      );

    if (!movedStop) {
      return {
        success: false,
        code:
          "SOURCE_ROUTE_INVALID",
        message:
          "Jobbet kunde inte hittas i källrutten.",
      };
    }

    const sourceStops =
      buildSourceStops({
        sourceRoute,
        workOrderId:
          candidate.workOrderId,
      });

    if (
      sourceStops.length < 2
    ) {
      return {
        success: false,
        code:
          "SOURCE_ROUTE_INVALID",
        message:
          "Källrutten skulle få för få stopp efter flytten.",
      };
    }

    const targetBeforeRoute =
      targetRoute ??
      buildPlannerBaselineRoute({
        technicianName:
          candidate.targetTechnician,
        date:
          sourceRoute.date,
        events,
      });

    const targetRequest =
      targetRoute
        ? buildRequest({
            route:
              targetRoute,
            stops:
              buildTargetStops({
                targetRoute,
                movedStop,
              }),
            departureTime:
              departureTime ??
              null,
          })
        : buildPlannerTargetRequest({
            candidate,
            sourceRoute,
            events,
            departureTime:
              departureTime ??
              null,
          });

    if (
      targetRequest.stops.length < 2
    ) {
      return {
        success: false,
        code:
          "TARGET_ROUTE_INVALID",
        message:
          "Målteknikern får fortfarande för få jobb/stopp för att Google Routes ska kunna verifiera flytten.",
      };
    }

    const [
      sourceResult,
      targetResult,
    ] = await Promise.all([
      calculateTechnicianRoute(
        buildRequest({
          route:
            sourceRoute,

          stops:
            sourceStops,

          departureTime:
            departureTime ??
            null,
        }),
      ),

      calculateTechnicianRoute(
        targetRequest,
      ),
    ]);

    if (!sourceResult.success) {
      return {
        success: false,
        code:
          "SOURCE_VERIFICATION_FAILED",
        message:
          sourceResult.error
            .message,
        details:
          sourceResult.error
            .details,
      };
    }

    if (!targetResult.success) {
      return {
        success: false,
        code:
          "TARGET_VERIFICATION_FAILED",
        message:
          targetResult.error
            .message,
        details:
          targetResult.error
            .details,
      };
    }

    const verifiedSourceRoute =
      sourceResult.route;

    const verifiedTargetRoute =
      targetResult.route;

    const sourceImpact =
      buildImpact({
        before:
          sourceRoute,

        after:
          verifiedSourceRoute,
      });

    const targetImpact =
      buildImpact({
        before:
          targetBeforeRoute,

        after:
          verifiedTargetRoute,
      });

    const totalBeforeDistanceMeters =
      sourceRoute.summary
        .totalDistanceMeters +
      targetBeforeRoute.summary
        .totalDistanceMeters;

    const totalAfterDistanceMeters =
      verifiedSourceRoute.summary
        .totalDistanceMeters +
      verifiedTargetRoute.summary
        .totalDistanceMeters;

    const totalDistanceSavedMeters =
      totalBeforeDistanceMeters -
      totalAfterDistanceMeters;

    const totalBeforeDriveMinutes =
      sourceRoute.summary
        .totalDriveMinutes +
      targetBeforeRoute.summary
        .totalDriveMinutes;

    const totalAfterDriveMinutes =
      verifiedSourceRoute.summary
        .totalDriveMinutes +
      verifiedTargetRoute.summary
        .totalDriveMinutes;

    const totalDriveMinutesSaved =
      totalBeforeDriveMinutes -
      totalAfterDriveMinutes;

    const totalBeforeWorkMinutes =
      sourceRoute.summary
        .totalWorkMinutes +
      targetBeforeRoute.summary
        .totalWorkMinutes;

    const totalAfterWorkMinutes =
      verifiedSourceRoute.summary
        .totalWorkMinutes +
      verifiedTargetRoute.summary
        .totalWorkMinutes;

    const totalWorkMinutesSaved =
      totalBeforeWorkMinutes -
      totalAfterWorkMinutes;

    return {
      success: true,

      status:
        getStatus({
          distanceSavedMeters:
            totalDistanceSavedMeters,

          driveMinutesSaved:
            totalDriveMinutesSaved,

          workMinutesSaved:
            totalWorkMinutesSaved,
        }),

      candidate,

      sourceRoute:
        verifiedSourceRoute,

      targetRoute:
        verifiedTargetRoute,

      sourceImpact,

      targetImpact,

      totalBeforeDistanceMeters,
      totalAfterDistanceMeters,
      totalDistanceSavedMeters,

      totalBeforeDriveMinutes,
      totalAfterDriveMinutes,
      totalDriveMinutesSaved,

      totalBeforeWorkMinutes,
      totalAfterWorkMinutes,
      totalWorkMinutesSaved,

      verifiedAt:
        new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      "Verify dispatcher candidate error:",
      error,
    );

    return {
      success: false,
      code:
        "UNKNOWN",
      message:
        error instanceof Error
          ? error.message
          : "Dispatcher-kandidaten kunde inte verifieras.",
      details:
        error,
    };
  }
}