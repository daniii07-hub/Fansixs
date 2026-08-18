export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RouteAddress = {
  formattedAddress: string;
  city?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
};

export type RouteStopType =
  | "start"
  | "job"
  | "break"
  | "end";

export type RouteStop = {
  id: string;
  type: RouteStopType;
  label: string;
  address: RouteAddress;
  coordinate?: RouteCoordinate | null;
  workOrderId?: number | null;
  bookingId?: number | null;
  technician?: string | null;
  plannedStartTime?: string | null;
  plannedEndTime?: string | null;
  serviceDurationMinutes?: number | null;
};

export type RouteTravelMode =
  | "DRIVE"
  | "BICYCLE"
  | "WALK"
  | "TWO_WHEELER";

export type RouteTrafficPreference =
  | "TRAFFIC_UNAWARE"
  | "TRAFFIC_AWARE"
  | "TRAFFIC_AWARE_OPTIMAL";

export type RouteLeg = {
  id: string;
  fromStopId: string;
  toStopId: string;
  distanceMeters: number;
  durationSeconds: number;
  staticDurationSeconds?: number | null;
  encodedPolyline?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
};

export type RouteSummary = {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalStaticDurationSeconds?: number | null;
  totalServiceMinutes: number;
  totalDriveMinutes: number;
  totalWorkMinutes: number;
  stopCount: number;
  jobCount: number;
};

export type TechnicianRoute = {
  technicianId: string;
  technicianName: string;
  date: string;
  travelMode: RouteTravelMode;
  trafficPreference: RouteTrafficPreference;
  stops: RouteStop[];
  legs: RouteLeg[];
  summary: RouteSummary;
  warnings: string[];
};

export type RouteEngineRequest = {
  technicianId: string;
  technicianName: string;
  date: string;
  stops: RouteStop[];
  travelMode?: RouteTravelMode;
  trafficPreference?: RouteTrafficPreference;
  optimizeWaypointOrder?: boolean;
  departureTime?: string | null;
};

export type RouteEngineSuccess = {
  success: true;
  route: TechnicianRoute;
  provider: "google";
  cacheHit: boolean;
};

export type RouteEngineFailure = {
  success: false;
  error: {
    code:
      | "INVALID_INPUT"
      | "GEOCODING_FAILED"
      | "ROUTE_NOT_FOUND"
      | "PROVIDER_ERROR"
      | "MISSING_API_KEY"
      | "UNKNOWN";
    message: string;
    details?: unknown;
  };
};

export type RouteEngineResult =
  | RouteEngineSuccess
  | RouteEngineFailure;

export type CachedRouteEntry = {
  key: string;
  createdAt: string;
  expiresAt: string;
  result: RouteEngineSuccess;
};

export type GoogleRouteWaypoint = {
  address?: string;
  location?: {
    latLng: {
      latitude: number;
      longitude: number;
    };
  };
  via?: boolean;
};

export type GoogleRouteMatrixElement = {
  originIndex: number;
  destinationIndex: number;
  status: {
    code: number;
    message?: string;
  };
  distanceMeters?: number;
  duration?: string;
  staticDuration?: string;
  condition?: string;
};