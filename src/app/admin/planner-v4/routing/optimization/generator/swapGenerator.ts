import type {
  TechnicianRoute,
} from "../../types";
import {
  createCandidateId,
  getBaselineStopOrder,
  getMovableIndexes,
  resolveCandidateGenerationOptions,
  validateGeneratedCandidate,
  type CandidateGenerationOptions,
  type GeneratedStopOrder,
} from "./helpers";

export function generateSwapCandidates({
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

  if (!resolved.includeSwap) {
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

  for (
    let firstIndex = 0;
    firstIndex <
    movableIndexes.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex =
        firstIndex + 1;
      secondIndex <
      movableIndexes.length;
      secondIndex += 1
    ) {
      const left =
        movableIndexes[firstIndex];

      const right =
        movableIndexes[secondIndex];

      const stopOrder =
        [...baselineOrder];

      [
        stopOrder[left],
        stopOrder[right],
      ] = [
        stopOrder[right],
        stopOrder[left],
      ];

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
          moveType: "swap",
          indexes: [left, right],
          stopOrder,
        }),
        moveType: "swap",
        stopOrder,
        description:
          `Byt plats på stopp ${left + 1} och ${right + 1}.`,
      });
    }
  }

  return candidates;
}