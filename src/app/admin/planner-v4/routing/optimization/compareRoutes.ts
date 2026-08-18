import type {
  RouteOptimizationCandidate,
  RouteOptimizationComparison,
} from "./types";

function round(
  value: number,
  decimals = 2,
) {
  const factor = 10 ** decimals;
  return (
    Math.round(value * factor) / factor
  );
}

export function compareRoutes(
  baseline: RouteOptimizationCandidate,
  candidate: RouteOptimizationCandidate,
): RouteOptimizationComparison {
  const distanceSavedMeters =
    baseline.metrics.totalDistanceMeters -
    candidate.metrics.totalDistanceMeters;

  const driveMinutesSaved =
    baseline.metrics.totalDriveMinutes -
    candidate.metrics.totalDriveMinutes;

  const workMinutesSaved =
    baseline.metrics.totalWorkMinutes -
    candidate.metrics.totalWorkMinutes;

  const scoreImprovement =
    baseline.score.total -
    candidate.score.total;

  const percentageImprovement =
    baseline.score.total > 0
      ? round(
          (scoreImprovement /
            baseline.score.total) *
            100,
        )
      : 0;

  return {
    baseline,
    candidate,
    distanceSavedMeters,
    driveMinutesSaved,
    workMinutesSaved,
    scoreImprovement,
    percentageImprovement,
    improved:
      candidate.score.feasible &&
      scoreImprovement > 0,
  };
}

export function isBetterRoute(
  baseline: RouteOptimizationCandidate,
  candidate: RouteOptimizationCandidate,
) {
  return compareRoutes(
    baseline,
    candidate,
  ).improved;
}

export function getRouteImprovementSummary(
  comparison: RouteOptimizationComparison,
) {
  return {
    improved: comparison.improved,
    scoreImprovement:
      comparison.scoreImprovement,
    percentageImprovement:
      comparison.percentageImprovement,
    distanceSavedKm: round(
      comparison.distanceSavedMeters /
        1000,
    ),
    driveMinutesSaved:
      comparison.driveMinutesSaved,
    workMinutesSaved:
      comparison.workMinutesSaved,
  };
}