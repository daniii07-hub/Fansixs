import type {
  RouteStop,
} from "../routing";

export type DispatcherCandidateStatus =
  | "candidate"
  | "blocked";

export type DispatcherMoveReason =
  | "balance_workload"
  | "reduce_drive_time"
  | "reduce_distance";

export type DispatcherTechnicianImpact = {
  technicianName: string;

  beforeWorkMinutes: number;
  estimatedAfterWorkMinutes: number;

  beforeDriveMinutes: number;
  estimatedAfterDriveMinutes: number;

  beforeJobCount: number;
  estimatedAfterJobCount: number;
};

export type DispatcherMoveCandidate = {
  id: string;

  workOrderId: number;
  bookingId: number | null;

  sourceTechnician: string;
  targetTechnician: string;

  stop: RouteStop;

  reason: DispatcherMoveReason;
  status: DispatcherCandidateStatus;

  estimatedDriveMinutesSaved: number;
  estimatedDistanceMetersSaved: number;

  sourceImpact: DispatcherTechnicianImpact;
  targetImpact: DispatcherTechnicianImpact;

  score: number;

  warnings: string[];
};

export type DispatcherAnalysis = {
  generatedAt: string;

  technicianCount: number;
  jobCount: number;

  candidatesEvaluated: number;

  candidates: DispatcherMoveCandidate[];

  bestCandidate:
    | DispatcherMoveCandidate
    | null;
};

export type DispatcherOptions = {
  maxCandidates?: number;

  maxTargetWorkMinutes?: number;

  minimumEstimatedDriveMinutesSaved?: number;

  workloadBalanceWeight?: number;
  driveTimeWeight?: number;
  distanceWeight?: number;
};