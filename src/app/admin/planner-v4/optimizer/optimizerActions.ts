"use server";

import {
  optimizeAndVerifyTechnicianRoute,
} from "../routing/optimization/optimizeAndVerifyRoute";
import type {
  RouteOptimizationOptions,
  RouteOptimizationResult,
} from "../routing/optimization/types";
import type {
  TechnicianRoute,
} from "../routing/types";

export type OptimizeRouteActionInput = {
  route: TechnicianRoute;
  options?: RouteOptimizationOptions;
  departureTime?: string | null;
};

export async function optimizeRouteAction({
  route,
  options,
  departureTime,
}: OptimizeRouteActionInput): Promise<RouteOptimizationResult> {
  const result =
    await optimizeAndVerifyTechnicianRoute({
      route,
      options,
      departureTime:
        departureTime ?? null,
      requireImprovement: true,
    });

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  /*
   * Viktigt:
   * verifiedCandidate innehåller nu Google Routes-
   * verifierade legs inklusive encodedPolyline.
   *
   * Genom att skicka verifiedCandidate vidare som
   * bestCandidate bevaras polyline-datan hela vägen
   * till klienten och preview-systemet.
   */
  return {
    success: true,
    baseline:
      result.baseline,
    bestCandidate:
      result.verifiedCandidate,
    comparison:
      result.comparison,
    evaluatedCandidates:
      result.evaluatedCandidates,
    generatedAt:
      result.verifiedAt,
  };
}