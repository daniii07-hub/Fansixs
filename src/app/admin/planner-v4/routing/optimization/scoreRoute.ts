import {
  hasBlockingViolations,
  validateCandidateConstraints,
} from "./constraints";
import {
  DEFAULT_ROUTE_OPTIMIZATION_CONSTRAINTS,
  DEFAULT_ROUTE_OPTIMIZATION_WEIGHTS,
  type RouteOptimizationCandidate,
  type RouteOptimizationConstraints,
  type RouteOptimizationObjective,
  type RouteOptimizationScore,
  type RouteOptimizationWeights,
} from "./types";
import type {
  TechnicianRoute,
} from "../types";

type ScoreRouteInput = {
  baseline: TechnicianRoute;
  candidate: Omit<
    RouteOptimizationCandidate,
    "score"
  >;
  objective?: RouteOptimizationObjective;
  constraints?: RouteOptimizationConstraints;
  weights?: Partial<RouteOptimizationWeights>;
};

function mergeWeights(
  weights?: Partial<RouteOptimizationWeights>,
): RouteOptimizationWeights {
  return {
    ...DEFAULT_ROUTE_OPTIMIZATION_WEIGHTS,
    ...weights,
  };
}

function mergeConstraints(
  constraints?: RouteOptimizationConstraints,
): Required<RouteOptimizationConstraints> {
  return {
    ...DEFAULT_ROUTE_OPTIMIZATION_CONSTRAINTS,
    ...constraints,
  };
}

function normalizeMetric({
  value,
  baselineValue,
}: {
  value: number;
  baselineValue: number;
}) {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  if (
    !Number.isFinite(baselineValue) ||
    baselineValue <= 0
  ) {
    return value;
  }

  return value / baselineValue;
}

function getObjectiveMultipliers(
  objective: RouteOptimizationObjective,
): RouteOptimizationWeights {
  switch (objective) {
    case "MINIMIZE_DRIVE_TIME":
      return {
        driveTime: 1.75,
        distance: 0.75,
        totalWorkTime: 1,
        workloadBalance: 0.5,
        constraintViolation: 1,
      };

    case "MINIMIZE_DISTANCE":
      return {
        driveTime: 0.75,
        distance: 1.75,
        totalWorkTime: 0.75,
        workloadBalance: 0.5,
        constraintViolation: 1,
      };

    case "MINIMIZE_TOTAL_WORK_TIME":
      return {
        driveTime: 1,
        distance: 0.5,
        totalWorkTime: 1.75,
        workloadBalance: 0.5,
        constraintViolation: 1,
      };

    case "BALANCE_WORKLOAD":
      return {
        driveTime: 0.75,
        distance: 0.5,
        totalWorkTime: 1,
        workloadBalance: 1.75,
        constraintViolation: 1,
      };

    case "BALANCED":
    default:
      return {
        driveTime: 1,
        distance: 1,
        totalWorkTime: 1,
        workloadBalance: 1,
        constraintViolation: 1,
      };
  }
}

function calculateWorkloadBalanceScore({
  candidate,
  baseline,
}: {
  candidate: Omit<
    RouteOptimizationCandidate,
    "score"
  >;
  baseline: TechnicianRoute;
}) {
  const candidateAverageMinutes =
    candidate.metrics.jobCount > 0
      ? candidate.metrics.totalWorkMinutes /
        candidate.metrics.jobCount
      : candidate.metrics.totalWorkMinutes;

  const baselineAverageMinutes =
    baseline.summary.jobCount > 0
      ? baseline.summary.totalWorkMinutes /
        baseline.summary.jobCount
      : baseline.summary.totalWorkMinutes;

  return normalizeMetric({
    value: candidateAverageMinutes,
    baselineValue:
      baselineAverageMinutes,
  });
}

export function scoreRoute({
  baseline,
  candidate,
  objective = "BALANCED",
  constraints,
  weights,
}: ScoreRouteInput): RouteOptimizationScore {
  const resolvedWeights =
    mergeWeights(weights);

  const resolvedConstraints =
    mergeConstraints(constraints);

  const objectiveMultipliers =
    getObjectiveMultipliers(objective);

  const violations =
    validateCandidateConstraints({
      baseline,
      candidate: {
        ...candidate,
        score: {
          total: 0,
          breakdown: {
            driveTimeScore: 0,
            distanceScore: 0,
            totalWorkTimeScore: 0,
            workloadBalanceScore: 0,
            constraintPenalty: 0,
          },
          violations: [],
          feasible: true,
        },
      },
      constraints:
        resolvedConstraints,
    });

  const driveTimeScore =
    normalizeMetric({
      value:
        candidate.metrics
          .totalDriveMinutes,
      baselineValue:
        baseline.summary
          .totalDriveMinutes,
    }) *
    resolvedWeights.driveTime *
    objectiveMultipliers.driveTime;

  const distanceScore =
    normalizeMetric({
      value:
        candidate.metrics
          .totalDistanceMeters,
      baselineValue:
        baseline.summary
          .totalDistanceMeters,
    }) *
    resolvedWeights.distance *
    objectiveMultipliers.distance;

  const totalWorkTimeScore =
    normalizeMetric({
      value:
        candidate.metrics
          .totalWorkMinutes,
      baselineValue:
        baseline.summary
          .totalWorkMinutes,
    }) *
    resolvedWeights.totalWorkTime *
    objectiveMultipliers.totalWorkTime;

  const workloadBalanceScore =
    calculateWorkloadBalanceScore({
      candidate,
      baseline,
    }) *
    resolvedWeights.workloadBalance *
    objectiveMultipliers.workloadBalance;

  const constraintPenalty =
    violations.reduce(
      (total, violation) => {
        const severityMultiplier =
          violation.severity === "error"
            ? 1
            : violation.severity ===
                "warning"
              ? 0.25
              : 0.05;

        return (
          total +
          resolvedWeights
            .constraintViolation *
            objectiveMultipliers
              .constraintViolation *
            severityMultiplier
        );
      },
      0,
    );

  const total =
    driveTimeScore +
    distanceScore +
    totalWorkTimeScore +
    workloadBalanceScore +
    constraintPenalty;

  return {
    total,
    breakdown: {
      driveTimeScore,
      distanceScore,
      totalWorkTimeScore,
      workloadBalanceScore,
      constraintPenalty,
    },
    violations,
    feasible:
      !hasBlockingViolations(
        violations,
      ),
  };
}