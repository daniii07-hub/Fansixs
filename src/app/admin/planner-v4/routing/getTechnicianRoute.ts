import type { PlannerEventWithDate } from "../../planner/queries";
import { buildRouteRequest } from "./buildRouteRequest";
import { calculateTechnicianRoute } from "./routeEngine";
import type { RouteEngineResult } from "./types";

type Params = {
  technician: string;
  date: string;
  events: PlannerEventWithDate[];
};

function summarizeRequest(
  technician: string,
  request: ReturnType<typeof buildRouteRequest>,
) {
  return {
    technician,
    date: request.date,
    stopCount: request.stops.length,
    stops: request.stops.map((stop) => ({
      id: stop.id,
      workOrderId: stop.workOrderId ?? null,
      label: stop.label,
      address:
        stop.address?.formattedAddress ?? null,
      coordinate:
        stop.coordinate ?? null,
      plannedStartTime:
        stop.plannedStartTime ?? null,
      plannedEndTime:
        stop.plannedEndTime ?? null,
      serviceDurationMinutes:
        stop.serviceDurationMinutes ?? null,
    })),
  };
}

export async function getTechnicianRoute({
  technician,
  date,
  events,
}: Params): Promise<RouteEngineResult> {
  const request = buildRouteRequest({
    technician,
    date,
    events,
  });

  console.info(
    "[Planner Route Debug] Request",
    summarizeRequest(
      technician,
      request,
    ),
  );

  const result =
    await calculateTechnicianRoute(
      request,
    );

  if (!result.success) {
    console.error(
      "[Planner Route Debug] Failure",
      {
        technician,
        date,
        code:
          result.error.code,
        message:
          result.error.message,
        details:
          result.error.details ?? null,
        request:
          summarizeRequest(
            technician,
            request,
          ),
      },
    );
  } else {
    console.info(
      "[Planner Route Debug] Success",
      {
        technician,
        date,
        stopCount:
          result.route.stops.length,
        totalDriveMinutes:
          result.route.summary
            .totalDriveMinutes,
        totalDistanceMeters:
          result.route.summary
            .totalDistanceMeters,
      },
    );
  }

  return result;
}

export async function getRoutesForTechnicians({
  technicians,
  date,
  events,
}: {
  technicians: string[];
  date: string;
  events: PlannerEventWithDate[];
}): Promise<Record<string, RouteEngineResult>> {
  const entries =
    await Promise.all(
      technicians.map(
        async (technician) => {
          const result =
            await getTechnicianRoute({
              technician,
              date,
              events,
            });

          return [
            technician,
            result,
          ] as const;
        },
      ),
    );

  return Object.fromEntries(
    entries,
  );
}