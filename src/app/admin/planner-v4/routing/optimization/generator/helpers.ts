import type {
  RouteStop,
  TechnicianRoute,
} from "../../types";

export type CandidateMoveType =
  | "swap"
  | "insert"
  | "reverse"
  | "relocate";

export type GeneratedStopOrder = {
  id: string;
  moveType: CandidateMoveType;
  stopOrder: string[];
  description: string;
};

export type CandidateGenerationOptions = {
  maxCandidates?: number;
  includeSwap?: boolean;
  includeInsert?: boolean;
  includeReverse?: boolean;
  includeRelocate?: boolean;
  preserveStartStop?: boolean;
  preserveEndStop?: boolean;
  preserveFixedStops?: boolean;
};

export const DEFAULT_CANDIDATE_GENERATION_OPTIONS: Required<CandidateGenerationOptions> =
  {
    maxCandidates: 250,
    includeSwap: true,
    includeInsert: true,
    includeReverse: true,
    includeRelocate: true,
    preserveStartStop: true,
    preserveEndStop: true,
    preserveFixedStops: true,
  };

export function resolveCandidateGenerationOptions(
  options?: CandidateGenerationOptions,
): Required<CandidateGenerationOptions> {
  return {
    ...DEFAULT_CANDIDATE_GENERATION_OPTIONS,
    ...options,
  };
}

export function getStopMap(
  route: TechnicianRoute,
) {
  return new Map(
    route.stops.map((stop) => [
      stop.id,
      stop,
    ]),
  );
}

export function getBaselineStopOrder(
  route: TechnicianRoute,
) {
  return route.stops.map(
    (stop) => stop.id,
  );
}

export function isFixedStop(
  stop: RouteStop,
) {
  return (
    stop.type === "start" ||
    stop.type === "break" ||
    stop.type === "end"
  );
}

export function getMovableIndexes({
  route,
  preserveStartStop,
  preserveEndStop,
  preserveFixedStops,
}: {
  route: TechnicianRoute;
  preserveStartStop: boolean;
  preserveEndStop: boolean;
  preserveFixedStops: boolean;
}) {
  const lastIndex =
    route.stops.length - 1;

  return route.stops
    .map((stop, index) => ({
      stop,
      index,
    }))
    .filter(({ stop, index }) => {
      if (
        preserveStartStop &&
        index === 0 &&
        stop.type === "start"
      ) {
        return false;
      }

      if (
        preserveEndStop &&
        index === lastIndex &&
        stop.type === "end"
      ) {
        return false;
      }

      if (
        preserveFixedStops &&
        isFixedStop(stop)
      ) {
        return false;
      }

      return stop.type === "job";
    })
    .map(({ index }) => index);
}

export function createCandidateId({
  moveType,
  indexes,
  stopOrder,
}: {
  moveType: CandidateMoveType;
  indexes: number[];
  stopOrder: string[];
}) {
  return [
    moveType,
    indexes.join("-"),
    hashStopOrder(stopOrder),
  ].join(":");
}

export function hashStopOrder(
  stopOrder: string[],
) {
  let hash = 2166136261;

  for (const stopId of stopOrder) {
    for (
      let index = 0;
      index < stopId.length;
      index += 1
    ) {
      hash ^= stopId.charCodeAt(index);
      hash = Math.imul(
        hash,
        16777619,
      );
    }
  }

  return (
    hash >>> 0
  ).toString(36);
}

export function isSameStopOrder(
  first: string[],
  second: string[],
) {
  if (
    first.length !== second.length
  ) {
    return false;
  }

  return first.every(
    (stopId, index) =>
      stopId === second[index],
  );
}

export function hasSameStops(
  baseline: string[],
  candidate: string[],
) {
  if (
    baseline.length !==
    candidate.length
  ) {
    return false;
  }

  const baselineSet =
    new Set(baseline);

  return candidate.every(
    (stopId) =>
      baselineSet.has(stopId),
  );
}

export function deduplicateCandidates(
  candidates: GeneratedStopOrder[],
) {
  const seen = new Set<string>();

  return candidates.filter(
    (candidate) => {
      const key =
        candidate.stopOrder.join("|");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    },
  );
}

export function limitCandidates(
  candidates: GeneratedStopOrder[],
  maxCandidates: number,
) {
  if (
    maxCandidates <= 0 ||
    candidates.length <=
      maxCandidates
  ) {
    return candidates;
  }

  return candidates.slice(
    0,
    maxCandidates,
  );
}

export function validateGeneratedCandidate({
  baselineOrder,
  candidateOrder,
}: {
  baselineOrder: string[];
  candidateOrder: string[];
}) {
  return (
    hasSameStops(
      baselineOrder,
      candidateOrder,
    ) &&
    !isSameStopOrder(
      baselineOrder,
      candidateOrder,
    )
  );
}

export function moveItem(
  stopOrder: string[],
  fromIndex: number,
  toIndex: number,
) {
  const next = [...stopOrder];

  const [item] = next.splice(
    fromIndex,
    1,
  );

  if (item === undefined) {
    return next;
  }

  next.splice(
    toIndex,
    0,
    item,
  );

  return next;
}