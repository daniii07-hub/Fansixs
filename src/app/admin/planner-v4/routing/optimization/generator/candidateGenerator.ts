import type {
  TechnicianRoute,
} from "../../types";
import {
  generateInsertCandidates,
} from "./insertGenerator";
import {
  generateRelocateCandidates,
} from "./relocateGenerator";
import {
  generateReverseCandidates,
} from "./reverseGenerator";
import {
  generateSwapCandidates,
} from "./swapGenerator";
import {
  deduplicateCandidates,
  getBaselineStopOrder,
  limitCandidates,
  resolveCandidateGenerationOptions,
  type CandidateGenerationOptions,
  type GeneratedStopOrder,
} from "./helpers";

export type CandidateGenerationResult = {
  baselineStopOrder: string[];
  candidates: GeneratedStopOrder[];
  generatedCount: number;
  returnedCount: number;
};

function interleaveCandidates(
  groups: GeneratedStopOrder[][],
) {
  const result:
    GeneratedStopOrder[] = [];

  const maxLength = Math.max(
    0,
    ...groups.map(
      (group) => group.length,
    ),
  );

  for (
    let index = 0;
    index < maxLength;
    index += 1
  ) {
    for (const group of groups) {
      const candidate =
        group[index];

      if (candidate) {
        result.push(candidate);
      }
    }
  }

  return result;
}

export function generateRouteCandidates({
  route,
  options,
}: {
  route: TechnicianRoute;
  options?: CandidateGenerationOptions;
}): CandidateGenerationResult {
  const resolved =
    resolveCandidateGenerationOptions(
      options,
    );

  const groups = [
    generateSwapCandidates({
      route,
      options: resolved,
    }),
    generateInsertCandidates({
      route,
      options: resolved,
    }),
    generateReverseCandidates({
      route,
      options: resolved,
    }),
    generateRelocateCandidates({
      route,
      options: resolved,
    }),
  ];

  const interleaved =
    interleaveCandidates(groups);

  const deduplicated =
    deduplicateCandidates(
      interleaved,
    );

  const limited =
    limitCandidates(
      deduplicated,
      resolved.maxCandidates,
    );

  return {
    baselineStopOrder:
      getBaselineStopOrder(route),
    candidates: limited,
    generatedCount:
      deduplicated.length,
    returnedCount:
      limited.length,
  };
}