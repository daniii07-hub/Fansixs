"use server";

import {
  getSupabaseServerClient,
} from "@/lib/supabase/server";

import type {
  OptimizationRollbackSnapshot,
} from "./applyOptimizationAction";

export type PersistedAppliedOptimization = {
  runId: number;
  candidateId: string;
  technicianName: string;
  appliedJobCount: number;
  appliedAt: string;
  rollbackSnapshot:
    OptimizationRollbackSnapshot;
};

export type GetLatestAppliedOptimizationResult =
  | {
      success: true;
      optimization:
        PersistedAppliedOptimization | null;
    }
  | {
      success: false;
      message: string;
      details?: unknown;
    };

type OptimizationRunRow = {
  id: number;
  candidate_id: string;
  technician_name: string;
  applied_job_count: number;
  applied_at: string;
  rollback_snapshot: unknown;
};

function isValidRollbackSnapshot(
  value: unknown,
): value is OptimizationRollbackSnapshot {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const snapshot =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof snapshot.technicianName !==
      "string" ||
    typeof snapshot.candidateId !==
      "string" ||
    typeof snapshot.createdAt !==
      "string" ||
    !Array.isArray(
      snapshot.items,
    )
  ) {
    return false;
  }

  return snapshot.items.every(
    (item) => {
      if (
        typeof item !==
          "object" ||
        item === null
      ) {
        return false;
      }

      const row =
        item as Record<
          string,
          unknown
        >;

      return (
        typeof row.bookingId ===
          "number" &&
        typeof row.bookingDate ===
          "string" &&
        (
          row.startTime === null ||
          typeof row.startTime ===
            "string"
        ) &&
        (
          row.endTime === null ||
          typeof row.endTime ===
            "string"
        )
      );
    },
  );
}

export async function getLatestAppliedOptimizationAction(): Promise<GetLatestAppliedOptimizationResult> {
  try {
    const supabase =
      getSupabaseServerClient();

    const {
      data,
      error,
    } = await supabase
      .from(
        "planner_optimization_runs",
      )
      .select(
        `
          id,
          candidate_id,
          technician_name,
          applied_job_count,
          applied_at,
          rollback_snapshot
        `,
      )
      .eq(
        "status",
        "applied",
      )
      .order(
        "applied_at",
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Get latest applied optimization error:",
        error,
      );

      return {
        success: false,
        message:
          "Senaste AI-optimeringen kunde inte hämtas.",
        details:
          error,
      };
    }

    if (!data) {
      return {
        success: true,
        optimization:
          null,
      };
    }

    const row =
      data as OptimizationRunRow;

    if (
      !isValidRollbackSnapshot(
        row.rollback_snapshot,
      )
    ) {
      return {
        success: false,
        message:
          "Den sparade AI-optimeringen har ogiltig rollback-data.",
        details: {
          runId:
            row.id,
        },
      };
    }

    return {
      success: true,
      optimization: {
        runId:
          Number(row.id),
        candidateId:
          row.candidate_id,
        technicianName:
          row.technician_name,
        appliedJobCount:
          Number(
            row.applied_job_count,
          ),
        appliedAt:
          row.applied_at,
        rollbackSnapshot:
          row.rollback_snapshot,
      },
    };
  } catch (error) {
    console.error(
      "Get latest applied optimization action error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Senaste AI-optimeringen kunde inte hämtas.",
      details:
        error,
    };
  }
}