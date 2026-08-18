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

function relocatePair(
  stopOrder: string[],
  firstIndex: number,
  secondIndex: number,
  targetIndex: number,
) {
  const next = [...stopOrder];

  const firstStop =
    next[firstIndex];

  const secondStop =
    next[secondIndex];

  if (
    firstStop === undefined ||
    secondStop === undefined
  ) {
    return next;
  }

  const pair = [
    firstStop,
    secondStop,
  ];

  const indexesToRemove = [
    firstIndex,
    secondIndex,
  ].sort((a, b) => b - a);

  for (const index of indexesToRemove) {
    next.splice(index, 1);
  }

  const removedBeforeTarget =
    indexesToRemove.filter(
      (index) => index < targetIndex,
    ).length;

  const adjustedTarget =
    Math.max(
      0,
      targetIndex -
        removedBeforeTarget,
    );

  next.splice(
    adjustedTarget,
    0,
    ...pair,
  );

  return next;
}

export function generateRelocateCandidates({
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

  if (!resolved.includeRelocate) {
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
    let pointer = 0;
    pointer <
    movableIndexes.length - 1;
    pointer += 1
  ) {
    const firstIndex =
      movableIndexes[pointer];

    const secondIndex =
      movableIndexes[pointer + 1];

    if (
      secondIndex !==
      firstIndex + 1
    ) {
      continue;
    }

    for (
      let targetPointer = 0;
      targetPointer <
      movableIndexes.length;
      targetPointer += 1
    ) {
      const targetIndex =
        movableIndexes[
          targetPointer
        ];

      if (
        targetIndex ===
          firstIndex ||
        targetIndex ===
          secondIndex
      ) {
        continue;
      }

      const stopOrder =
        relocatePair(
          baselineOrder,
          firstIndex,
          secondIndex,
          targetIndex,
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
          moveType:
            "relocate",
          indexes: [
            firstIndex,
            secondIndex,
            targetIndex,
          ],
          stopOrder,
        }),
        moveType: "relocate",
        stopOrder,
        description:
          `Flytta stopp ${firstIndex + 1}–${secondIndex + 1} till position ${targetIndex + 1}.`,
      });
    }
  }

  return candidates;
}