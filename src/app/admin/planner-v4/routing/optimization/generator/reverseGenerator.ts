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

export function generateReverseCandidates({
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

  if (!resolved.includeReverse) {
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
    let startPointer = 0;
    startPointer <
    movableIndexes.length;
    startPointer += 1
  ) {
    for (
      let endPointer =
        startPointer + 1;
      endPointer <
      movableIndexes.length;
      endPointer += 1
    ) {
      const startIndex =
        movableIndexes[
          startPointer
        ];

      const endIndex =
        movableIndexes[
          endPointer
        ];

      const indexesInSegment =
        movableIndexes.filter(
          (index) =>
            index >= startIndex &&
            index <= endIndex,
        );

      if (
        indexesInSegment.length < 2
      ) {
        continue;
      }

      const stopOrder =
        [...baselineOrder];

      const reversedStops =
        indexesInSegment
          .map(
            (index) =>
              baselineOrder[index],
          )
          .reverse();

      indexesInSegment.forEach(
        (index, reverseIndex) => {
          stopOrder[index] =
            reversedStops[
              reverseIndex
            ];
        },
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
          moveType: "reverse",
          indexes: [
            startIndex,
            endIndex,
          ],
          stopOrder,
        }),
        moveType: "reverse",
        stopOrder,
        description:
          `Vänd ordningen mellan stopp ${startIndex + 1} och ${endIndex + 1}.`,
      });
    }
  }

  return candidates;
}