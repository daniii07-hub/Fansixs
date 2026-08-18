import {
  compareRoutes,
} from "./compareRoutes";
import {
  generateRouteCandidates,
} from "./generator/candidateGenerator";
import {
  createBaselineCandidate,
  simulateRoute,
} from "./simulateRoute";
import {
  validateRouteForOptimization,
} from "./constraints";
import {
  DEFAULT_ROUTE_OPTIMIZATION_OPTIONS,
  type RouteOptimizationCandidate,
  type RouteOptimizationOptions,
  type RouteOptimizationRequest,
  type RouteOptimizationResult,
} from "./types";

function resolveOptions(
  options?: RouteOptimizationOptions,
) {
  return {
    ...DEFAULT_ROUTE_OPTIMIZATION_OPTIONS,
    ...options,
    constraints: {
      ...options?.constraints,
    },
    weights: {
      ...options?.weights,
    },
  };
}

function getCandidateLimit({
  maxCandidates,
  maxIterations,
}: {
  maxCandidates: number;
  maxIterations: number;
}) {
  const candidates =
    Number.isFinite(maxCandidates) &&
    maxCandidates > 0
      ? Math.floor(maxCandidates)
      : DEFAULT_ROUTE_OPTIMIZATION_OPTIONS
          .maxCandidates;

  const iterations =
    Number.isFinite(maxIterations) &&
    maxIterations > 0
      ? Math.floor(maxIterations)
      : DEFAULT_ROUTE_OPTIMIZATION_OPTIONS
          .maxIterations;

  return Math.max(
    1,
    Math.min(
      candidates,
      iterations,
    ),
  );
}

export function optimizeRoute({
  route,
  options,
}: RouteOptimizationRequest): RouteOptimizationResult {
  const resolvedOptions =
    resolveOptions(options);

  const routeViolations =
    validateRouteForOptimization({
      route,
      constraints:
        resolvedOptions.constraints,
    });

  const blockingViolation =
    routeViolations.find(
      (violation) =>
        violation.severity === "error",
    );

  if (blockingViolation) {
    return {
      success: false,
      error: {
        code:
          blockingViolation.code ===
          "MIN_JOB_COUNT"
            ? "INSUFFICIENT_STOPS"
            : blockingViolation.code ===
                "REQUIRE_JOB_COORDINATES"
              ? "MISSING_COORDINATES"
              : "CONSTRAINT_VIOLATION",
        message:
          blockingViolation.message,
        details: routeViolations,
      },
    };
  }

  const baselineResult =
    createBaselineCandidate({
      route,
      options:
        resolvedOptions,
    });

  if (!baselineResult.success) {
    return {
      success: false,
      error:
        baselineResult.error,
    };
  }

  const baseline =
    baselineResult.candidate;

  const candidateLimit =
    getCandidateLimit({
      maxCandidates:
        resolvedOptions.maxCandidates,
      maxIterations:
        resolvedOptions.maxIterations,
    });

  const generationResult =
    generateRouteCandidates({
      route,
      options: {
        maxCandidates:
          candidateLimit,
        includeSwap: true,
        includeInsert: true,
        includeReverse:
          resolvedOptions
            .allowReverseOrder,
        includeRelocate: true,
        preserveStartStop:
          resolvedOptions
            .constraints
            ?.preserveStartStop ??
          true,
        preserveEndStop:
          resolvedOptions
            .constraints
            ?.preserveEndStop ??
          true,
        preserveFixedStops:
          resolvedOptions
            .constraints
            ?.preserveFixedStops ??
          true,
      },
    });

  let bestCandidate:
    RouteOptimizationCandidate =
      baseline;

  let evaluatedCandidates = 1;

  for (
    const generatedCandidate of
      generationResult.candidates
  ) {
    const simulation =
      simulateRoute({
        route,
        stopOrder:
          generatedCandidate
            .stopOrder,
        options:
          resolvedOptions,
      });

    if (!simulation.success) {
      continue;
    }

    evaluatedCandidates += 1;

    const comparison =
      compareRoutes(
        bestCandidate,
        simulation.candidate,
      );

    if (comparison.improved) {
      bestCandidate = {
        ...simulation.candidate,
        id:
          generatedCandidate.id,
        source: "optimized",
      };
    }
  }

  return {
    success: true,
    baseline,
    bestCandidate,
    comparison: compareRoutes(
      baseline,
      bestCandidate,
    ),
    evaluatedCandidates,
    generatedAt:
      new Date().toISOString(),
  };
}