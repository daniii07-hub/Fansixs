import type {
  RouteLeg,
  RouteStop,
  TechnicianRoute,
} from "../types";

export type RouteOptimizationObjective =
  | "BALANCED"
  | "MINIMIZE_DRIVE_TIME"
  | "MINIMIZE_DISTANCE"
  | "MINIMIZE_TOTAL_WORK_TIME"
  | "BALANCE_WORKLOAD";

export type RouteOptimizationConstraintCode =
  | "MAX_WORK_MINUTES"
  | "MAX_DRIVE_MINUTES"
  | "MAX_DISTANCE_METERS"
  | "PRESERVE_START_STOP"
  | "PRESERVE_END_STOP"
  | "PRESERVE_FIXED_STOPS"
  | "PRESERVE_TIME_WINDOWS"
  | "REQUIRE_JOB_COORDINATES"
  | "MIN_JOB_COUNT"
  | "CUSTOM";

export type RouteOptimizationSeverity =
  | "info"
  | "warning"
  | "error";

export type RouteOptimizationViolation = {
  code: RouteOptimizationConstraintCode;
  severity: RouteOptimizationSeverity;
  message: string;
  stopId?: string | null;
  workOrderId?: number | null;
  bookingId?: number | null;
  actualValue?: number | string | null;
  limitValue?: number | string | null;
};

export type RouteOptimizationConstraints = {
  maxWorkMinutes?: number | null;
  maxDriveMinutes?: number | null;
  maxDistanceMeters?: number | null;
  preserveStartStop?: boolean;
  preserveEndStop?: boolean;
  preserveFixedStops?: boolean;
  preserveTimeWindows?: boolean;
  requireJobCoordinates?: boolean;
  minimumJobCount?: number;
};

export type RouteOptimizationWeights = {
  driveTime: number;
  distance: number;
  totalWorkTime: number;
  workloadBalance: number;
  constraintViolation: number;
};

export type RouteOptimizationOptions = {
  objective?: RouteOptimizationObjective;
  constraints?: RouteOptimizationConstraints;
  weights?: Partial<RouteOptimizationWeights>;
  maxCandidates?: number;
  maxIterations?: number;
  allowReverseOrder?: boolean;
};

export type RouteOptimizationStopSnapshot = {
  id: string;
  type: RouteStop["type"];
  label: string;
  workOrderId?: number | null;
  bookingId?: number | null;
  technician?: string | null;
  plannedStartTime?: string | null;
  plannedEndTime?: string | null;
  serviceDurationMinutes?: number | null;
  coordinate: RouteStop["coordinate"];
};

export type RouteOptimizationLegSnapshot = {
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

export type RouteOptimizationMetrics = {
  totalDistanceMeters: number;
  totalDriveMinutes: number;
  totalServiceMinutes: number;
  totalWorkMinutes: number;
  totalDurationSeconds: number;
  jobCount: number;
  stopCount: number;
};

export type RouteOptimizationScoreBreakdown = {
  driveTimeScore: number;
  distanceScore: number;
  totalWorkTimeScore: number;
  workloadBalanceScore: number;
  constraintPenalty: number;
};

export type RouteOptimizationScore = {
  total: number;
  breakdown: RouteOptimizationScoreBreakdown;
  violations: RouteOptimizationViolation[];
  feasible: boolean;
};

export type RouteOptimizationCandidate = {
  id: string;
  technicianId: string;
  technicianName: string;
  date: string;
  stopOrder: string[];
  stops: RouteOptimizationStopSnapshot[];
  legs: RouteOptimizationLegSnapshot[];
  metrics: RouteOptimizationMetrics;
  score: RouteOptimizationScore;
  source: "current" | "simulated" | "optimized";
};

export type RouteOptimizationComparison = {
  baseline: RouteOptimizationCandidate;
  candidate: RouteOptimizationCandidate;
  distanceSavedMeters: number;
  driveMinutesSaved: number;
  workMinutesSaved: number;
  scoreImprovement: number;
  percentageImprovement: number;
  improved: boolean;
};

export type RouteOptimizationSimulationRequest = {
  route: TechnicianRoute;
  stopOrder: string[];
  options?: RouteOptimizationOptions;
};

export type RouteOptimizationSimulationResult =
  | {
      success: true;
      candidate: RouteOptimizationCandidate;
    }
  | {
      success: false;
      error: RouteOptimizationError;
    };

export type RouteOptimizationRequest = {
  route: TechnicianRoute;
  options?: RouteOptimizationOptions;
};

export type RouteOptimizationResult =
  | {
      success: true;
      baseline: RouteOptimizationCandidate;
      bestCandidate: RouteOptimizationCandidate;
      comparison: RouteOptimizationComparison;
      evaluatedCandidates: number;
      generatedAt: string;
    }
  | {
      success: false;
      error: RouteOptimizationError;
    };

export type RouteOptimizationErrorCode =
  | "INVALID_ROUTE"
  | "INSUFFICIENT_STOPS"
  | "MISSING_COORDINATES"
  | "CONSTRAINT_VIOLATION"
  | "SIMULATION_FAILED"
  | "NO_BETTER_ROUTE"
  | "UNKNOWN";

export type RouteOptimizationError = {
  code: RouteOptimizationErrorCode;
  message: string;
  details?: unknown;
};

export type RouteOptimizationContext = {
  route: TechnicianRoute;
  stops: RouteStop[];
  legs: RouteLeg[];
  options: Required<
    Pick<
      RouteOptimizationOptions,
      | "objective"
      | "maxCandidates"
      | "maxIterations"
      | "allowReverseOrder"
    >
  > & {
    constraints: Required<RouteOptimizationConstraints>;
    weights: RouteOptimizationWeights;
  };
};

export const DEFAULT_ROUTE_OPTIMIZATION_WEIGHTS: RouteOptimizationWeights =
  {
    driveTime: 1,
    distance: 0.35,
    totalWorkTime: 0.8,
    workloadBalance: 0.25,
    constraintViolation: 1000,
  };

export const DEFAULT_ROUTE_OPTIMIZATION_CONSTRAINTS: Required<RouteOptimizationConstraints> =
  {
    maxWorkMinutes: null,
    maxDriveMinutes: null,
    maxDistanceMeters: null,
    preserveStartStop: true,
    preserveEndStop: true,
    preserveFixedStops: true,
    preserveTimeWindows: true,
    requireJobCoordinates: true,
    minimumJobCount: 2,
  };

export const DEFAULT_ROUTE_OPTIMIZATION_OPTIONS: Required<
  Pick<
    RouteOptimizationOptions,
    | "objective"
    | "maxCandidates"
    | "maxIterations"
    | "allowReverseOrder"
  >
> = {
  objective: "BALANCED",
  maxCandidates: 50,
  maxIterations: 250,
  allowReverseOrder: false,
};