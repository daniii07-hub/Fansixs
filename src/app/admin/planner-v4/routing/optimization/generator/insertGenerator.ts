import type {
  TechnicianRoute,
} from "../../types";
import {
  createCandidateId,
  getBaselineStopOrder,
  getMovableIndexes,
  moveItem,
  resolveCandidateGenerationOptions,
  validateGeneratedCandidate,
  type CandidateGenerationOptions,
  type GeneratedStopOrder,
} from "./helpers";

export function generateInsertCandidates({
  route,
  options,
}: {
  route: TechnicianRoute;
  options?: CandidateGenerationOptions;
}): GeneratedStopOrder[] {
  const resolved =
    resolveCandidateGenerationOptions(
      options,
    );

  if (!resolved.includeInsert) {
    return [];
  }

  const baselineOrder =
    getBaselineStopOrder(route);

  const movableIndexes =
    getMovableIndexes({
      route,
      preserveStartStop:
        resolved.preserveStartStop,
      preserveEndStop:
        resolved.preserveEndStop,
      preserveFixedStops:
        resolved.preserveFixedStops,
    });

  const candidates:
    GeneratedStopOrder[] = [];

  for (const fromIndex of movableIndexes) {
    for (const toIndex of movableIndexes) {
      if (fromIndex === toIndex) {
        continue;
      }

      const stopOrder =
        moveItem(
          baselineOrder,
          fromIndex,
          toIndex,
        );

      if (
        !validateGeneratedCandidate({
          baselineOrder,
          candidateOrder:
            stopOrder,
        })
      ) {
        continue;
      }

      candidates.push({
        id: createCandidateId({
          moveType: "insert",
          indexes: [
            fromIndex,
            toIndex,
          ],
          stopOrder,
        }),
        moveType: "insert",
        stopOrder,
        description:
          `Flytta stopp ${fromIndex + 1} till position ${toIndex + 1}.`,
      });
    }
  }

  return candidates;
}