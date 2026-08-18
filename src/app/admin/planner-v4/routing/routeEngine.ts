import { calculateGoogleRoute } from "./google";
import type {
  RouteEngineFailure,
  RouteEngineRequest,
  RouteEngineResult,
  RouteStop,
  RouteTravelMode,
  RouteTrafficPreference,
} from "./types";

const DEFAULT_TRAVEL_MODE: RouteTravelMode =
  "DRIVE";

const DEFAULT_TRAFFIC_PREFERENCE: RouteTrafficPreference =
  "TRAFFIC_AWARE";

function failure(
  code: RouteEngineFailure["error"]["code"],
  message: string,
  details?: unknown,
): RouteEngineFailure {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value,
  );
}

function isFiniteCoordinate(
  value: number | undefined,
) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function hasValidCoordinate(
  stop: RouteStop,
) {
  const coordinate =
    stop.coordinate;

  if (!coordinate) {
    return false;
  }

  const { latitude, longitude } =
    coordinate;

  return (
    isFiniteCoordinate(latitude) &&
    isFiniteCoordinate(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function hasUsableAddress(
  stop: RouteStop,
) {
  return Boolean(
    stop.address.formattedAddress?.trim(),
  );
}

function validateStops(
  stops: RouteStop[],
): RouteEngineFailure | null {
  if (stops.length < 2) {
    return failure(
      "INVALID_INPUT",
      "Minst två stopp krävs för att beräkna en rutt.",
    );
  }

  const ids = new Set<string>();

  for (const stop of stops) {
    if (!stop.id?.trim()) {
      return failure(
        "INVALID_INPUT",
        "Alla stopp måste ha ett ID.",
      );
    }

    if (ids.has(stop.id)) {
      return failure(
        "INVALID_INPUT",
        `Stopp-ID ${stop.id} förekommer flera gånger.`,
      );
    }

    ids.add(stop.id);

    if (
      !hasValidCoordinate(stop) &&
      !hasUsableAddress(stop)
    ) {
      return failure(
        "INVALID_INPUT",
        `Stoppet "${stop.label}" saknar både giltig adress och koordinat.`,
      );
    }

    if (
      stop.serviceDurationMinutes !==
        undefined &&
      stop.serviceDurationMinutes !==
        null &&
      (!Number.isFinite(
        stop.serviceDurationMinutes,
      ) ||
        stop.serviceDurationMinutes < 0)
    ) {
      return failure(
        "INVALID_INPUT",
        `Stoppet "${stop.label}" har en ogiltig servicetid.`,
      );
    }
  }

  return null;
}

function normalizeStops(
  stops: RouteStop[],
): RouteStop[] {
  return stops.map((stop) => ({
    ...stop,
    label:
      stop.label?.trim() ||
      stop.address.formattedAddress.trim(),
    address: {
      ...stop.address,
      formattedAddress:
        stop.address.formattedAddress.trim(),
      city:
        stop.address.city?.trim() || null,
      postalCode:
        stop.address.postalCode?.trim() ||
        null,
      countryCode:
        stop.address.countryCode?.trim() ||
        null,
    },
    technician:
      stop.technician?.trim() || null,
    serviceDurationMinutes:
      stop.serviceDurationMinutes ?? 0,
  }));
}

function normalizeRequest(
  request: RouteEngineRequest,
): RouteEngineRequest {
  return {
    ...request,
    technicianId:
      request.technicianId.trim(),
    technicianName:
      request.technicianName.trim(),
    date: request.date.trim(),
    stops: normalizeStops(request.stops),
    travelMode:
      request.travelMode ??
      DEFAULT_TRAVEL_MODE,
    trafficPreference:
      request.trafficPreference ??
      DEFAULT_TRAFFIC_PREFERENCE,
    optimizeWaypointOrder:
      request.optimizeWaypointOrder ??
      false,
    departureTime:
      request.departureTime ?? null,
  };
}

function validateRequest(
  request: RouteEngineRequest,
): RouteEngineFailure | null {
  if (!request.technicianId?.trim()) {
    return failure(
      "INVALID_INPUT",
      "Tekniker-ID saknas.",
    );
  }

  if (!request.technicianName?.trim()) {
    return failure(
      "INVALID_INPUT",
      "Teknikernamn saknas.",
    );
  }

  if (!isValidDate(request.date)) {
    return failure(
      "INVALID_INPUT",
      "Ruttdatumet måste anges som YYYY-MM-DD.",
    );
  }

  if (!Array.isArray(request.stops)) {
    return failure(
      "INVALID_INPUT",
      "Stopp måste skickas som en lista.",
    );
  }

  return validateStops(request.stops);
}

export async function calculateTechnicianRoute(
  request: RouteEngineRequest,
): Promise<RouteEngineResult> {
  try {
    const normalizedRequest =
      normalizeRequest(request);

    const validationError =
      validateRequest(normalizedRequest);

    if (validationError) {
      return validationError;
    }

    return await calculateGoogleRoute(
      normalizedRequest,
    );
  } catch (error) {
    console.error(
      "Route engine error:",
      error,
    );

    return failure(
      "UNKNOWN",
      error instanceof Error
        ? error.message
        : "Ett oväntat fel uppstod när rutten beräknades.",
      error,
    );
  }
}

export async function calculateRoutesForTechnicians(
  requests: RouteEngineRequest[],
): Promise<RouteEngineResult[]> {
  if (!Array.isArray(requests)) {
    return [
      failure(
        "INVALID_INPUT",
        "Ruttförfrågningar måste skickas som en lista.",
      ),
    ];
  }

  return Promise.all(
    requests.map((request) =>
      calculateTechnicianRoute(request),
    ),
  );
}