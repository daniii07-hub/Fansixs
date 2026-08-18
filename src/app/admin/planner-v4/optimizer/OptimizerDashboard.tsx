"use client";

import OptimizerErrorCard from "./OptimizerErrorCard";
import OptimizerFooter from "./OptimizerFooter";
import OptimizerHeader from "./OptimizerHeader";
import OptimizerResultCard from "./OptimizerResultCard";
import OptimizerSummary from "./OptimizerSummary";

import type {
  RouteOptimizationComparison,
  RouteOptimizationResult,
} from "../routing/optimization/types";

type Props = {
  results: Record<
    string,
    RouteOptimizationResult
  >;
  previewTechnician?: string | null;
  acceptedTechnician?: string | null;
  rejectedTechnicians?: Set<string>;
  onPreview?: (
    technicianName: string,
    comparison:
      RouteOptimizationComparison,
  ) => void;
  onClearPreview?: () => void;
  onAccept?: (
    technicianName: string,
    comparison:
      RouteOptimizationComparison,
  ) => void;
  onReject?: (
    technicianName: string,
  ) => void;
  className?: string;
};

type SuccessfulEntry = {
  technicianName: string;
  result: Extract<
    RouteOptimizationResult,
    { success: true }
  >;
};

type FailedEntry = {
  technicianName: string;
  result: Extract<
    RouteOptimizationResult,
    { success: false }
  >;
};

function getSuccessfulEntries(
  results: Props["results"],
): SuccessfulEntry[] {
  return Object.entries(
    results,
  )
    .filter(
      (
        entry,
      ): entry is [
        string,
        Extract<
          RouteOptimizationResult,
          { success: true }
        >,
      ] =>
        entry[1].success,
    )
    .map(
      ([
        technicianName,
        result,
      ]) => ({
        technicianName,
        result,
      }),
    )
    .sort(
      (first, second) =>
        second.result
          .comparison
          .scoreImprovement -
        first.result
          .comparison
          .scoreImprovement,
    );
}

function getFailedEntries(
  results: Props["results"],
): FailedEntry[] {
  return Object.entries(
    results,
  )
    .filter(
      (
        entry,
      ): entry is [
        string,
        Extract<
          RouteOptimizationResult,
          { success: false }
        >,
      ] =>
        !entry[1].success,
    )
    .map(
      ([
        technicianName,
        result,
      ]) => ({
        technicianName,
        result,
      }),
    );
}

function getNumericDetail(
  details: unknown,
  key: string,
) {
  if (
    !details ||
    typeof details !==
      "object"
  ) {
    return 0;
  }

  const value =
    (
      details as Record<
        string,
        unknown
      >
    )[key];

  return typeof value ===
      "number" &&
    Number.isFinite(value)
    ? value
    : 0;
}

export default function OptimizerDashboard({
  results,
  previewTechnician = null,
  acceptedTechnician = null,
  rejectedTechnicians =
    new Set<string>(),
  onPreview,
  onClearPreview,
  onAccept,
  onReject,
  className = "",
}: Props) {
  const successfulEntries =
    getSuccessfulEntries(
      results,
    );

  const failedEntries =
    getFailedEntries(
      results,
    );

  const improvedEntries =
    successfulEntries.filter(
      ({ result }) =>
        result.comparison
          .improved,
    );

  const successfulCandidateCount =
    successfulEntries.reduce(
      (
        total,
        { result },
      ) =>
        total +
        result.evaluatedCandidates,
      0,
    );

  const failedCandidateCount =
    failedEntries.reduce(
      (
        total,
        { result },
      ) =>
        total +
        getNumericDetail(
          result.error.details,
          "evaluatedCandidates",
        ),
      0,
    );

  const totalCandidates =
    successfulCandidateCount +
    failedCandidateCount;

  const totalDriveMinutesSaved =
    improvedEntries.reduce(
      (
        total,
        { result },
      ) =>
        total +
        Math.max(
          0,
          result.comparison
            .driveMinutesSaved,
        ),
      0,
    );

  const totalDistanceSavedMeters =
    improvedEntries.reduce(
      (
        total,
        { result },
      ) =>
        total +
        Math.max(
          0,
          result.comparison
            .distanceSavedMeters,
        ),
      0,
    );

  if (
    successfulEntries.length ===
      0 &&
    failedEntries.length === 0
  ) {
    return null;
  }

  return (
    <section
      className={[
        "overflow-hidden rounded-[1.75rem] border border-white/[0.08]",
        "bg-[#0b1020] shadow-2xl shadow-black/20",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <OptimizerHeader
        previewTechnician={
          previewTechnician
        }
        onClearPreview={
          onClearPreview
        }
      />

      <OptimizerSummary
        improvedRouteCount={
          improvedEntries.length
        }
        totalCandidates={
          totalCandidates
        }
        totalDriveMinutesSaved={
          totalDriveMinutesSaved
        }
        totalDistanceSavedMeters={
          totalDistanceSavedMeters
        }
      />

      <div className="space-y-3 p-4">
        {successfulEntries.map(
          ({
            technicianName,
            result,
          }) => {
            const isPreviewing =
              previewTechnician ===
              technicianName;

            const isAccepted =
              acceptedTechnician ===
              technicianName;

            const isRejected =
              rejectedTechnicians.has(
                technicianName,
              );

            return (
              <OptimizerResultCard
                key={
                  technicianName
                }
                technicianName={
                  technicianName
                }
                comparison={
                  result.comparison
                }
                evaluatedCandidates={
                  result.evaluatedCandidates
                }
                score={
                  result.bestCandidate
                    .score.total
                }
                isPreviewing={
                  isPreviewing
                }
                isAccepted={
                  isAccepted
                }
                isRejected={
                  isRejected
                }
                onPreview={() =>
                  isPreviewing
                    ? onClearPreview?.()
                    : onPreview?.(
                        technicianName,
                        result.comparison,
                      )
                }
                onAccept={() =>
                  onAccept?.(
                    technicianName,
                    result.comparison,
                  )
                }
                onReject={() =>
                  onReject?.(
                    technicianName,
                  )
                }
              />
            );
          },
        )}

        {failedEntries.map(
          ({
            technicianName,
            result,
          }) => (
            <OptimizerErrorCard
              key={
                technicianName
              }
              technicianName={
                technicianName
              }
              message={
                result.error.message
              }
              evaluatedCandidates={
                getNumericDetail(
                  result.error.details,
                  "evaluatedCandidates",
                )
              }
              generatedCandidates={
                getNumericDetail(
                  result.error.details,
                  "generatedCandidates",
                )
              }
            />
          ),
        )}
      </div>

      <OptimizerFooter
        totalResults={
          successfulEntries.length +
          failedEntries.length
        }
        failedResults={
          failedEntries.length
        }
      />
    </section>
  );
}