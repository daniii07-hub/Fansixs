"use server";

import {
  getSupabaseServerClient,
} from "@/lib/supabase/server";

export type PlannerOptimizationHistoryItem = {
  id: number;
  candidateId: string;
  technicianName: string;
  status:
    | "applied"
    | "rolled_back";
  appliedJobCount: number;
  appliedAt: string;
  rolledBackAt: string | null;
  createdAt: string;
};

export type GetPlannerOptimizationHistoryResult =
  | {
      success: true;
      items:
        PlannerOptimizationHistoryItem[];
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
  status:
    | "applied"
    | "rolled_back";
  applied_job_count: number;
  applied_at: string;
  rolled_back_at: string | null;
  created_at: string;
};

export async function getPlannerOptimizationHistoryAction({
  limit = 20,
}: {
  limit?: number;
} = {}): Promise<GetPlannerOptimizationHistoryResult> {
  try {
    const safeLimit =
      Number.isFinite(limit)
        ? Math.min(
            100,
            Math.max(
              1,
              Math.floor(limit),
            ),
          )
        : 20;

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
          status,
          applied_job_count,
          applied_at,
          rolled_back_at,
          created_at
        `,
      )
      .order(
        "applied_at",
        {
          ascending: false,
        },
      )
      .limit(
        safeLimit,
      );

    if (error) {
      console.error(
        "Get planner optimization history error:",
        error,
      );

      return {
        success: false,
        message:
          "AI-optimeringshistoriken kunde inte hämtas.",
        details:
          error,
      };
    }

    const rows =
      (data ??
        []) as OptimizationRunRow[];

    return {
      success: true,
      items:
        rows.map(
          (row) => ({
            id:
              Number(row.id),
            candidateId:
              row.candidate_id,
            technicianName:
              row.technician_name,
            status:
              row.status,
            appliedJobCount:
              Number(
                row.applied_job_count,
              ),
            appliedAt:
              row.applied_at,
            rolledBackAt:
              row.rolled_back_at,
            createdAt:
              row.created_at,
          }),
        ),
    };
  } catch (error) {
    console.error(
      "Get planner optimization history action error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "AI-optimeringshistoriken kunde inte hämtas.",
      details:
        error,
    };
  }
}