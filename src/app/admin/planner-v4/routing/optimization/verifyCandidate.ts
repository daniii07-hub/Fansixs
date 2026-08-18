import {
  calculateTechnicianRoute,
} from "../routeEngine";
import type {
  RouteEngineRequest,
  RouteStop,
  TechnicianRoute,
} from "../types";
import {
  scoreRoute,
} from "./scoreRoute";
import type {
  RouteOptimizationCandidate,
  RouteOptimizationOptions,
  RouteOptimizationSimulationResult,
} from "./types";

export type VerifyRouteCandidateInput = {
  baselineRoute: TechnicianRoute;
  candidate: RouteOptimizationCandidate;
  options?: RouteOptimizationOptions;
  departureTime?: string | null;
};

function buildOrderedStops({
  baselineRoute,
  candidate,
}: {
  baselineRoute: TechnicianRoute;
  candidate: RouteOptimizationCandidate;
}): RouteStop[] {
  const stopMap = new Map(
    baselineRoute.stops.map((stop) => [
      stop.id,
      stop,
    ]),
  );

  return candidate.stopOrder.map(
    (stopId) => {
      const stop =
        stopMap.get(stopId);

      if (!stop) {
        throw new Error(
          `Stoppet "${stopId}" saknas i basrutten.`,
        );
      }

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
    },
  );
}

function buildRouteRequest({
  baselineRoute,
  candidate,
  departureTime,
}: {
  baselineRoute: TechnicianRoute;
  candidate: RouteOptimizationCandidate;
  departureTime?: string | null;
}): RouteEngineRequest {
  return {
    technicianId:
      baselineRoute.technicianId,
    technicianName:
      baselineRoute.technicianName,
    date:
      baselineRoute.date,
    stops:
      buildOrderedStops({
        baselineRoute,
        candidate,
      }),
    travelMode:
      baselineRoute.travelMode,
    trafficPreference:
      baselineRoute.trafficPreference,
    optimizeWaypointOrder: false,
    departureTime:
      departureTime ?? null,
  };
}

function buildVerifiedCandidate({
  baselineRoute,
  candidate,
  verifiedRoute,
  options,
}: {
  baselineRoute: TechnicianRoute;
  candidate: RouteOptimizationCandidate;
  verifiedRoute: TechnicianRoute;
  options?: RouteOptimizationOptions;
}): RouteOptimizationCandidate {
  const candidateWithoutScore: Omit<
    RouteOptimizationCandidate,
    "score"
  > = {
    ...candidate,
    stopOrder:
      verifiedRoute.stops.map(
        (stop) => stop.id,
      ),
    stops:
      verifiedRoute.stops.map(
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
            stop.plannedStartTime ?? null,
          plannedEndTime:
            stop.plannedEndTime ?? null,
          serviceDurationMinutes:
            stop.serviceDurationMinutes ??
            null,
          coordinate:
            stop.coordinate ?? null,
        }),
      ),
    legs:
      verifiedRoute.legs.map(
        (leg) => ({
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
          encodedPolyline:
            leg.encodedPolyline ?? null,
          departureTime:
            leg.departureTime ?? null,
          arrivalTime:
            leg.arrivalTime ?? null,
        }),
      ),
    metrics: {
      totalDistanceMeters:
        verifiedRoute.summary
          .totalDistanceMeters,
      totalDriveMinutes:
        verifiedRoute.summary
          .totalDriveMinutes,
      totalServiceMinutes:
        verifiedRoute.summary
          .totalServiceMinutes,
      totalWorkMinutes:
        verifiedRoute.summary
          .totalWorkMinutes,
      totalDurationSeconds:
        verifiedRoute.summary
          .totalDurationSeconds,
      jobCount:
        verifiedRoute.summary.jobCount,
      stopCount:
        verifiedRoute.summary.stopCount,
    },
    source: "optimized",
  };

  const score = scoreRoute({
    baseline: baselineRoute,
    candidate:
      candidateWithoutScore,
    objective:
      options?.objective,
    constraints:
      options?.constraints,
    weights:
      options?.weights,
  });

  return {
    ...candidateWithoutScore,
    score,
  };
}

export async function verifyRouteCandidate({
  baselineRoute,
  candidate,
  options,
  departureTime,
}: VerifyRouteCandidateInput): Promise<RouteOptimizationSimulationResult> {
  try {
    const request =
      buildRouteRequest({
        baselineRoute,
        candidate,
        departureTime,
      });

    const result =
      await calculateTechnicianRoute(
        request,
      );

    if (!result.success) {
      return {
        success: false,
        error: {
          code:
            "SIMULATION_FAILED",
          message:
            result.error.message,
          details:
            result.error.details,
        },
      };
    }

    const verifiedCandidate =
      buildVerifiedCandidate({
        baselineRoute,
        candidate,
        verifiedRoute:
          result.route,
        options,
      });

    return {
      success: true,
      candidate:
        verifiedCandidate,
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
            : "Kandidaten kunde inte verifieras via Google Routes.",
        details: error,
      },
    };
  }
}