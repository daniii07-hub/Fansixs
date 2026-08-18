import type { PlannerEventWithDate } from "../../planner/queries";
import { buildRouteRequest } from "./buildRouteRequest";
import { calculateTechnicianRoute } from "./routeEngine";
import type { RouteEngineResult } from "./types";

type Params = {
  technician: string;
  date: string;
  events: PlannerEventWithDate[];
};

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

  return calculateTechnicianRoute(request);
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
  const results: Record<
    string,
    RouteEngineResult
  > = {};

  await Promise.all(
    technicians.map(async (technician) => {
      results[technician] =
        await getTechnicianRoute({
          technician,
          date,
          events,
        });
    }),
  );

  return results;
}