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
  verifyRouteCandidate,
} from "./verifyCandidate";
import {
  DEFAULT_ROUTE_OPTIMIZATION_OPTIONS,
  type RouteOptimizationCandidate,
  type RouteOptimizationError,
  type RouteOptimizationOptions,
  type RouteOptimizationRequest,
  type RouteOptimizationResult,
} from "./types";

export type VerifiedRouteOptimizationSuccess = {
  success: true;
  baseline:
    Extract<
      RouteOptimizationResult,
      { success: true }
    >["baseline"];
  localCandidate:
    Extract<
      RouteOptimizationResult,
      { success: true }
    >["bestCandidate"];
  verifiedCandidate:
    Extract<
      RouteOptimizationResult,
      { success: true }
    >["bestCandidate"];
  comparison:
    Extract<
      RouteOptimizationResult,
      { success: true }
    >["comparison"];
  evaluatedCandidates: number;
  generatedAt: string;
  verifiedAt: string;
  verificationMode:
    | "google"
    | "local-fallback";
  verificationFailures: number;
};

export type VerifiedRouteOptimizationFailure = {
  success: false;
  error: RouteOptimizationError;
};

export type VerifiedRouteOptimizationResult =
  | VerifiedRouteOptimizationSuccess
  | VerifiedRouteOptimizationFailure;

export type OptimizeAndVerifyRouteInput = {
  request: RouteOptimizationRequest;
  departureTime?: string | null;
  requireImprovement?: boolean;
};

function buildFailure(
  error: RouteOptimizationError,
): VerifiedRouteOptimizationFailure {
  return {
    success: false,
    error,
  };
}

type ResolvedOptimizationOptions =
  RouteOptimizationOptions &
  Required<
    Pick<
      RouteOptimizationOptions,
      | "objective"
      | "maxCandidates"
      | "maxIterations"
      | "allowReverseOrder"
    >
  > & {
    constraints: NonNullable<
      RouteOptimizationOptions[
        "constraints"
      ]
    >;
    weights: NonNullable<
      RouteOptimizationOptions[
        "weights"
      ]
    >;
  };

function resolveOptions(
  options?: RouteOptimizationOptions,
): ResolvedOptimizationOptions {
  return {
    ...options,
    objective:
      options?.objective ??
      DEFAULT_ROUTE_OPTIMIZATION_OPTIONS
        .objective,
    maxCandidates:
      options?.maxCandidates ??
      DEFAULT_ROUTE_OPTIMIZATION_OPTIONS
        .maxCandidates,
    maxIterations:
      options?.maxIterations ??
      DEFAULT_ROUTE_OPTIMIZATION_OPTIONS
        .maxIterations,
    allowReverseOrder:
      options?.allowReverseOrder ??
      DEFAULT_ROUTE_OPTIMIZATION_OPTIONS
        .allowReverseOrder,
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
    Number.isFinite(
      maxCandidates,
    ) &&
    maxCandidates > 0
      ? Math.floor(
          maxCandidates,
        )
      : DEFAULT_ROUTE_OPTIMIZATION_OPTIONS
          .maxCandidates;

  const iterations =
    Number.isFinite(
      maxIterations,
    ) &&
    maxIterations > 0
      ? Math.floor(
          maxIterations,
        )
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

function isBetter(
  current:
    RouteOptimizationCandidate,
  candidate:
    RouteOptimizationCandidate,
) {
  return compareRoutes(
    current,
    candidate,
  ).improved;
}

export async function optimizeAndVerifyRoute({
  request,
  departureTime,
  requireImprovement = true,
}: OptimizeAndVerifyRouteInput): Promise<VerifiedRouteOptimizationResult> {
  const resolvedOptions =
    resolveOptions(
      request.options,
    );

  const baselineResult =
    createBaselineCandidate({
      route:
        request.route,
      options:
        resolvedOptions,
    });

  if (!baselineResult.success) {
    return buildFailure(
      baselineResult.error,
    );
  }

  const baseline =
    baselineResult.candidate;

  const candidateLimit =
    getCandidateLimit({
      maxCandidates:
        resolvedOptions
          .maxCandidates,
      maxIterations:
        resolvedOptions
          .maxIterations,
    });

  const generated =
    generateRouteCandidates({
      route:
        request.route,
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
            .preserveStartStop ??
          true,
        preserveEndStop:
          resolvedOptions
            .constraints
            .preserveEndStop ??
          true,
        preserveFixedStops:
          resolvedOptions
            .constraints
            .preserveFixedStops ??
          true,
      },
    });

  let bestLocal:
    RouteOptimizationCandidate =
      baseline;

  let bestVerified:
    RouteOptimizationCandidate =
      baseline;

  let evaluatedCandidates = 1;
  let verifiedCandidates = 0;
  let verificationFailures = 0;

  for (
    const generatedCandidate of
      generated.candidates
  ) {
    const localSimulation =
      simulateRoute({
        route:
          request.route,
        stopOrder:
          generatedCandidate
            .stopOrder,
        options:
          resolvedOptions,
      });

    if (
      !localSimulation.success
    ) {
      continue;
    }

    evaluatedCandidates += 1;

    const localCandidate = {
      ...localSimulation.candidate,
      id:
        generatedCandidate.id,
      source:
        "optimized" as const,
    };

    if (
      isBetter(
        bestLocal,
        localCandidate,
      )
    ) {
      bestLocal =
        localCandidate;
    }

    try {
      const verification =
        await verifyRouteCandidate({
          baselineRoute:
            request.route,
          candidate:
            localCandidate,
          options:
            resolvedOptions,
          departureTime:
            departureTime ??
            null,
        });

      if (
        !verification.success
      ) {
        verificationFailures += 1;
        continue;
      }

      verifiedCandidates += 1;

      /*
       * Viktigt:
       * verification.candidate innehåller nu Google Routes-
       * verifierade legs inklusive encodedPolyline.
       * Vi behåller därför kandidaten intakt här.
       */
      const verifiedCandidate =
        verification.candidate;

      if (
        isBetter(
          bestVerified,
          verifiedCandidate,
        )
      ) {
        bestVerified =
          verifiedCandidate;
      }
    } catch (error) {
      verificationFailures += 1;

      console.warn(
        "Google verification failed; using local optimizer fallback:",
        error,
      );
    }
  }

  const useGoogleResult =
    verifiedCandidates > 0;

  const finalCandidate =
    useGoogleResult
      ? bestVerified
      : bestLocal;

  const comparison =
    compareRoutes(
      baseline,
      finalCandidate,
    );

  if (
    requireImprovement &&
    !comparison.improved
  ) {
    return buildFailure({
      code:
        "NO_BETTER_ROUTE",
      message:
        useGoogleResult
          ? "Ingen Google Routes-verifierad kandidat förbättrade den nuvarande rutten."
          : verificationFailures > 0
            ? "Google Routes kunde inte verifiera kandidaterna och ingen lokal kandidat förbättrade den nuvarande rutten."
            : "Ingen lokalt simulerad kandidat förbättrade den nuvarande rutten.",
      details: {
        generatedCandidates:
          generated.candidates
            .length,
        evaluatedCandidates,
        verifiedCandidates,
        verificationFailures,
        verificationMode:
          useGoogleResult
            ? "google"
            : "local-fallback",
      },
    });
  }

  return {
    success: true,
    baseline,
    localCandidate:
      bestLocal,
    verifiedCandidate:
      finalCandidate,
    comparison,
    evaluatedCandidates,
    generatedAt:
      new Date().toISOString(),
    verifiedAt:
      new Date().toISOString(),
    verificationMode:
      useGoogleResult
        ? "google"
        : "local-fallback",
    verificationFailures,
  };
}

export async function optimizeAndVerifyTechnicianRoute({
  route,
  options,
  departureTime,
  requireImprovement,
}: {
  route:
    RouteOptimizationRequest["route"];
  options?:
    RouteOptimizationOptions;
  departureTime?:
    string | null;
  requireImprovement?:
    boolean;
}) {
  return optimizeAndVerifyRoute({
    request: {
      route,
      options,
    },
    departureTime,
    requireImprovement,
  });
}