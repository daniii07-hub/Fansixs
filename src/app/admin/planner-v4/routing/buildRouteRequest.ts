import type { PlannerEventWithDate } from "../../planner/queries";
import type {
  RouteEngineRequest,
  RouteStop,
} from "./types";

function parseTimeToMinutes(
  value?: string | null,
) {
  if (!value) return 0;

  const [h, m] = value
    .slice(0, 5)
    .split(":")
    .map(Number);

  return h * 60 + m;
}

function serviceDuration(
  event: PlannerEventWithDate,
) {
  const start =
    parseTimeToMinutes(
      event.startTime,
    );

  const end =
    parseTimeToMinutes(
      event.endTime,
    );

  return Math.max(
    0,
    end - start,
  );
}

export function buildRouteRequest({
  technician,
  date,
  events,
}: {
  technician: string;
  date: string;
  events: PlannerEventWithDate[];
}): RouteEngineRequest {
  const jobs = events
    .filter(
      (event) =>
        event.date === date &&
        (event.technician ??
          "Ej tilldelad") ===
          technician,
    )
    .sort((a, b) =>
      (a.startTime ?? "").localeCompare(
        b.startTime ?? "",
      ),
    );

  const stops: RouteStop[] =
    jobs.map((job) => ({
      id: String(job.id),

      type: "job",

      label: job.customer,

      workOrderId: job.id,

      technician,

      plannedStartTime:
        job.startTime,

      plannedEndTime:
        job.endTime,

      serviceDurationMinutes:
        serviceDuration(job),

      address: {
        formattedAddress:
          job.city ??
          "Adress saknas",
        city:
          job.city ?? null,
      },

      coordinate: null,
    }));

  return {
    technicianId: technician,

    technicianName: technician,

    date,

    stops,

    travelMode: "DRIVE",

    trafficPreference:
      "TRAFFIC_AWARE",

    optimizeWaypointOrder:
      false,
  };
}