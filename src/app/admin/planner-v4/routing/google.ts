import type {
  GoogleRouteWaypoint,
  RouteEngineRequest,
  RouteEngineResult,
  RouteLeg,
  RouteStop,
  TechnicianRoute,
} from "./types";

const GOOGLE_ROUTES_API =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

type GoogleDuration = string;

type GoogleRouteLeg = {
  distanceMeters?: number;
  duration?: GoogleDuration;
  staticDuration?: GoogleDuration;
  polyline?: {
    encodedPolyline?: string;
  };
};

type GoogleRoute = {
  distanceMeters?: number;
  duration?: GoogleDuration;
  staticDuration?: GoogleDuration;
  optimizedIntermediateWaypointIndex?: number[];
  polyline?: {
    encodedPolyline?: string;
  };
  legs?: GoogleRouteLeg[];
};

type GoogleRoutesResponse = {
  routes?: GoogleRoute[];
};

function secondsFromDuration(value?: string) {
  if (!value) return 0;
  const parsed = Number(value.replace(/s$/, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toWaypoint(stop: RouteStop): GoogleRouteWaypoint {
  if (stop.coordinate) {
    return {
      location: {
        latLng: {
          latitude: stop.coordinate.latitude,
          longitude: stop.coordinate.longitude,
        },
      },
    };
  }

  return { address: stop.address.formattedAddress };
}

function reorderStops(
  stops: RouteStop[],
  optimizedIndexes?: number[],
) {
  if (
    !optimizedIndexes ||
    optimizedIndexes.length === 0 ||
    stops.length <= 2
  ) {
    return stops;
  }

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const intermediates = stops.slice(1, -1);

  const optimizedIntermediates =
    optimizedIndexes
      .map((index) => intermediates[index])
      .filter(
        (stop): stop is RouteStop =>
          Boolean(stop),
      );

  return [
    origin,
    ...optimizedIntermediates,
    destination,
  ];
}

function parseDepartureTime(
  value?: string | null,
) {
  if (!value) return null;

  const milliseconds = Date.parse(value);

  return Number.isFinite(milliseconds)
    ? milliseconds
    : null;
}

function toIsoString(
  milliseconds: number | null,
) {
  return milliseconds === null
    ? null
    : new Date(milliseconds).toISOString();
}

function addLegTimes({
  legs,
  stops,
  departureTime,
}: {
  legs: RouteLeg[];
  stops: RouteStop[];
  departureTime?: string | null;
}): RouteLeg[] {
  let cursor = parseDepartureTime(
    departureTime,
  );

  return legs.map((leg, index) => {
    const legDeparture = cursor;

    const legArrival =
      cursor === null
        ? null
        : cursor +
          leg.durationSeconds * 1000;

    const nextStop =
      stops[index + 1];

    const serviceMinutes = Math.max(
      0,
      nextStop?.serviceDurationMinutes ?? 0,
    );

    cursor =
      legArrival === null
        ? null
        : legArrival +
          serviceMinutes * 60_000;

    return {
      ...leg,
      departureTime:
        toIsoString(legDeparture),
      arrivalTime:
        toIsoString(legArrival),
    };
  });
}

export async function calculateGoogleRoute(
  request: RouteEngineRequest,
): Promise<RouteEngineResult> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: {
        code: "MISSING_API_KEY",
        message:
          "GOOGLE_MAPS_API_KEY saknas i serverns miljövariabler.",
      },
    };
  }

  if (request.stops.length < 2) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Minst två stopp krävs.",
      },
    };
  }

  const origin = request.stops[0];
  const destination =
    request.stops[request.stops.length - 1];
  const intermediates =
    request.stops.slice(1, -1).map(toWaypoint);

  const fieldMask = [
    "routes.distanceMeters",
    "routes.duration",
    "routes.staticDuration",
    "routes.polyline.encodedPolyline",
    "routes.legs.distanceMeters",
    "routes.legs.duration",
    "routes.legs.staticDuration",
    "routes.legs.polyline.encodedPolyline",
  ];

  if (request.optimizeWaypointOrder) {
    fieldMask.push(
      "routes.optimizedIntermediateWaypointIndex",
    );
  }

  const body: Record<string, unknown> = {
    origin: toWaypoint(origin),
    destination: toWaypoint(destination),
    travelMode:
      request.travelMode ?? "DRIVE",
    routingPreference:
      request.trafficPreference ??
      "TRAFFIC_AWARE",
    optimizeWaypointOrder:
      request.optimizeWaypointOrder ?? false,
    computeAlternativeRoutes: false,
    languageCode: "sv-SE",
    units: "METRIC",
  };

  if (intermediates.length > 0) {
    body.intermediates = intermediates;
  }

  if (request.departureTime) {
    body.departureTime = request.departureTime;
  }

  try {
    const response = await fetch(
      GOOGLE_ROUTES_API,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            fieldMask.join(","),
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const responseText =
      await response.text();

    if (!response.ok) {
      console.error(
        "Google Routes API error:",
        response.status,
        responseText,
      );

      return {
        success: false,
        error: {
          code: "PROVIDER_ERROR",
          message:
            "Google Routes kunde inte beräkna rutten.",
          details: {
            status: response.status,
            response: responseText,
          },
        },
      };
    }

    const json =
      JSON.parse(
        responseText,
      ) as GoogleRoutesResponse;

    const route = json.routes?.[0];

    if (!route) {
      return {
        success: false,
        error: {
          code: "ROUTE_NOT_FOUND",
          message:
            "Ingen körbar rutt hittades mellan stoppen.",
        },
      };
    }

    const orderedStops =
      reorderStops(
        request.stops,
        route.optimizedIntermediateWaypointIndex,
      );

    const rawLegs: RouteLeg[] =
      (route.legs ?? []).map(
        (leg, index) => ({
          id: `${orderedStops[index]?.id ?? index}-${orderedStops[index + 1]?.id ?? index + 1}`,
          fromStopId:
            orderedStops[index]?.id ??
            String(index),
          toStopId:
            orderedStops[index + 1]?.id ??
            String(index + 1),
          distanceMeters:
            leg.distanceMeters ?? 0,
          durationSeconds:
            secondsFromDuration(
              leg.duration,
            ),
          staticDurationSeconds:
            secondsFromDuration(
              leg.staticDuration,
            ),
          encodedPolyline:
            leg.polyline?.encodedPolyline ??
            null,
          departureTime: null,
          arrivalTime: null,
        }),
      );

    const legs = addLegTimes({
      legs: rawLegs,
      stops: orderedStops,
      departureTime:
        request.departureTime ?? null,
    });

    const totalDurationSeconds =
      secondsFromDuration(
        route.duration,
      );

    const totalServiceMinutes =
      orderedStops.reduce(
        (sum, stop) =>
          sum +
          (stop.serviceDurationMinutes ?? 0),
        0,
      );

    const totalDriveMinutes =
      Math.round(
        totalDurationSeconds / 60,
      );

    const technicianRoute:
      TechnicianRoute = {
        technicianId:
          request.technicianId,
        technicianName:
          request.technicianName,
        date: request.date,
        travelMode:
          request.travelMode ?? "DRIVE",
        trafficPreference:
          request.trafficPreference ??
          "TRAFFIC_AWARE",
        stops: orderedStops,
        legs,
        warnings: [],
        summary: {
          totalDistanceMeters:
            route.distanceMeters ??
            legs.reduce(
              (sum, leg) =>
                sum + leg.distanceMeters,
              0,
            ),
          totalDurationSeconds,
          totalStaticDurationSeconds:
            secondsFromDuration(
              route.staticDuration,
            ),
          totalServiceMinutes,
          totalDriveMinutes,
          totalWorkMinutes:
            totalDriveMinutes +
            totalServiceMinutes,
          stopCount:
            orderedStops.length,
          jobCount:
            orderedStops.filter(
              (stop) =>
                stop.type === "job",
            ).length,
        },
      };

    return {
      success: true,
      provider: "google",
      cacheHit: false,
      route: technicianRoute,
    };
  } catch (error) {
    console.error(
      "Google route request failed:",
      error,
    );

    return {
      success: false,
      error: {
        code: "PROVIDER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Google Routes-anropet misslyckades.",
        details: error,
      },
    };
  }
}