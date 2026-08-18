"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  getSupabaseServerClient,
} from "@/lib/supabase/server";

import type {
  DispatcherVerificationSuccess,
} from "./verifyDispatcherCandidateAction";

export type DispatcherApplyRollbackSnapshot = {
  candidateId: string;
  workOrderId: number;
  bookingId: number;
  createdAt: string;

  sourceTechnician: string;
  targetTechnician: string;

  previousAssignedTo: string | null;

  previousBookingDate: string;
  previousStartTime: string | null;
  previousEndTime: string | null;

  appliedAssignedTo: string;

  appliedBookingDate: string;
  appliedStartTime: string | null;
  appliedEndTime: string | null;
};

export type ApplyDispatcherCandidateResult =
  | {
      success: true;
      message: string;
      rollback:
        DispatcherApplyRollbackSnapshot;
      runId: number;
    }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "NOT_VERIFIED_IMPROVEMENT"
        | "WORK_ORDER_NOT_FOUND"
        | "BOOKING_NOT_FOUND"
        | "STALE_PLANNER_DATA"
        | "ALREADY_APPLIED"
        | "DATABASE_ERROR"
        | "ROLLBACK_FAILED";
      message: string;
      details?: unknown;
    };

export type RollbackDispatcherCandidateResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      code:
        | "INVALID_ROLLBACK"
        | "WORK_ORDER_NOT_FOUND"
        | "BOOKING_NOT_FOUND"
        | "ROLLBACK_CONFLICT"
        | "DATABASE_ERROR";
      message: string;
      details?: unknown;
    };

type WorkOrderRow = {
  id: number;
  booking_id: number | null;
  assigned_to: string | null;
};

type BookingRow = {
  id: number;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
};

type DispatcherRunRow = {
  id: number;
};

function normalizeTime(
  value: string | null | undefined,
) {
  if (!value) {
    return null;
  }

  const trimmed =
    value.trim();

  if (
    /^\d{2}:\d{2}$/.test(
      trimmed,
    )
  ) {
    return `${trimmed}:00`;
  }

  return trimmed;
}

function refreshPlannerPages() {
  revalidatePath(
    "/admin/planner-v4",
  );

  revalidatePath(
    "/admin/planner",
  );

  revalidatePath(
    "/admin/calendar",
  );

  revalidatePath(
    "/admin/work-orders",
  );

  revalidatePath(
    "/admin",
  );
}

function findMovedJobStop(
  result:
    DispatcherVerificationSuccess,
) {
  return (
    result.targetRoute.stops.find(
      (stop) =>
        stop.workOrderId ===
        result.candidate.workOrderId,
    ) ?? null
  );
}

export async function applyDispatcherCandidateAction({
  verification,
}: {
  verification:
    DispatcherVerificationSuccess;
}): Promise<ApplyDispatcherCandidateResult> {
  try {
    if (
      !verification ||
      verification.status !==
        "improved"
    ) {
      return {
        success: false,
        code:
          "NOT_VERIFIED_IMPROVEMENT",
        message:
          "Endast en Google Routes-verifierad förbättring kan tillämpas.",
      };
    }

    const {
      candidate,
    } = verification;

    if (
      !Number.isInteger(
        candidate.workOrderId,
      ) ||
      candidate.workOrderId <=
        0 ||
      !candidate.sourceTechnician?.trim() ||
      !candidate.targetTechnician?.trim()
    ) {
      return {
        success: false,
        code:
          "INVALID_INPUT",
        message:
          "Dispatcher-kandidaten är ogiltig.",
      };
    }

    const movedStop =
      findMovedJobStop(
        verification,
      );

    if (!movedStop) {
      return {
        success: false,
        code:
          "INVALID_INPUT",
        message:
          "Det verifierade jobbet kunde inte hittas i mål-rutten.",
      };
    }

    const supabase =
      getSupabaseServerClient();

    /*
     * Idempotency guard.
     */
    const {
      data:
        existingRunRows,
      error:
        existingRunError,
    } = await supabase
      .from(
        "planner_dispatcher_runs",
      )
      .select("id")
      .eq(
        "candidate_id",
        candidate.id,
      )
      .eq(
        "status",
        "applied",
      )
      .limit(1);

    if (existingRunError) {
      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Det gick inte att kontrollera om Dispatcher-förslaget redan har tillämpats.",
        details:
          existingRunError,
      };
    }

    if (
      (existingRunRows ?? [])
        .length > 0
    ) {
      return {
        success: false,
        code:
          "ALREADY_APPLIED",
        message:
          "Det här Dispatcher-förslaget är redan tillämpat.",
      };
    }

    const {
      data:
        workOrderData,
      error:
        workOrderError,
    } = await supabase
      .from("work_orders")
      .select(
        "id, booking_id, assigned_to",
      )
      .eq(
        "id",
        candidate.workOrderId,
      )
      .maybeSingle();

    if (workOrderError) {
      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Arbetsordern kunde inte verifieras.",
        details:
          workOrderError,
      };
    }

    if (!workOrderData) {
      return {
        success: false,
        code:
          "WORK_ORDER_NOT_FOUND",
        message:
          "Arbetsordern kunde inte hittas.",
      };
    }

    const workOrder =
      workOrderData as WorkOrderRow;

    if (
      !workOrder.booking_id
    ) {
      return {
        success: false,
        code:
          "BOOKING_NOT_FOUND",
        message:
          "Arbetsordern saknar kopplad bokning.",
      };
    }

    const {
      data:
        bookingData,
      error:
        bookingError,
    } = await supabase
      .from("bookings")
      .select(
        "id, booking_date, start_time, end_time",
      )
      .eq(
        "id",
        workOrder.booking_id,
      )
      .maybeSingle();

    if (bookingError) {
      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Bokningen kunde inte verifieras.",
        details:
          bookingError,
      };
    }

    if (!bookingData) {
      return {
        success: false,
        code:
          "BOOKING_NOT_FOUND",
        message:
          "Bokningen kunde inte hittas.",
      };
    }

    const booking =
      bookingData as BookingRow;

    /*
     * Stale-data guard.
     * Jobbet måste fortfarande ligga hos source-teknikern
     * och ha samma tider som när verifieringen byggdes.
     */
    const expectedStart =
      normalizeTime(
        candidate.stop
          .plannedStartTime,
      );

    const expectedEnd =
      normalizeTime(
        candidate.stop
          .plannedEndTime,
      );

    const currentStart =
      normalizeTime(
        booking.start_time,
      );

    const currentEnd =
      normalizeTime(
        booking.end_time,
      );

    const expectedDate =
      verification.sourceRoute.date;

    if (
      workOrder.assigned_to !==
        candidate.sourceTechnician ||
      booking.booking_date !==
        expectedDate ||
      currentStart !==
        expectedStart ||
      currentEnd !==
        expectedEnd
    ) {
      return {
        success: false,
        code:
          "STALE_PLANNER_DATA",
        message:
          "Planeringen har ändrats sedan Dispatcher-förslaget verifierades. Kör analysen igen.",
        details: {
          expected: {
            technician:
              candidate.sourceTechnician,
            bookingDate:
              expectedDate,
            startTime:
              expectedStart,
            endTime:
              expectedEnd,
          },
          current: {
            technician:
              workOrder.assigned_to,
            bookingDate:
              booking.booking_date,
            startTime:
              currentStart,
            endTime:
              currentEnd,
          },
        },
      };
    }

    const appliedDate =
      verification.targetRoute.date;

    const appliedStart =
      normalizeTime(
        movedStop.plannedStartTime,
      );

    const appliedEnd =
      normalizeTime(
        movedStop.plannedEndTime,
      );

    const rollback:
      DispatcherApplyRollbackSnapshot = {
      candidateId:
        candidate.id,

      workOrderId:
        candidate.workOrderId,

      bookingId:
        booking.id,

      createdAt:
        new Date().toISOString(),

      sourceTechnician:
        candidate.sourceTechnician,

      targetTechnician:
        candidate.targetTechnician,

      previousAssignedTo:
        workOrder.assigned_to,

      previousBookingDate:
        booking.booking_date,

      previousStartTime:
        booking.start_time,

      previousEndTime:
        booking.end_time,

      appliedAssignedTo:
        candidate.targetTechnician,

      appliedBookingDate:
        appliedDate,

      appliedStartTime:
        appliedStart,

      appliedEndTime:
        appliedEnd,
    };

    const {
      error:
        workOrderUpdateError,
    } = await supabase
      .from("work_orders")
      .update({
        assigned_to:
          candidate.targetTechnician,
      })
      .eq(
        "id",
        candidate.workOrderId,
      );

    if (workOrderUpdateError) {
      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Teknikerbytet kunde inte sparas.",
        details:
          workOrderUpdateError,
      };
    }

    const {
      error:
        bookingUpdateError,
    } = await supabase
      .from("bookings")
      .update({
        booking_date:
          appliedDate,
        start_time:
          appliedStart,
        end_time:
          appliedEnd,
      })
      .eq(
        "id",
        booking.id,
      );

    if (bookingUpdateError) {
      const {
        error:
          rollbackAssignmentError,
      } = await supabase
        .from("work_orders")
        .update({
          assigned_to:
            rollback.previousAssignedTo,
        })
        .eq(
          "id",
          candidate.workOrderId,
        );

      return {
        success: false,
        code:
          rollbackAssignmentError
            ? "ROLLBACK_FAILED"
            : "DATABASE_ERROR",
        message:
          rollbackAssignmentError
            ? "Bokningen kunde inte uppdateras och teknikerbytet kunde inte återställas automatiskt."
            : "Bokningen kunde inte uppdateras. Teknikerbytet återställdes.",
        details:
          bookingUpdateError,
      };
    }

    const {
      data:
        runData,
      error:
        runError,
    } = await supabase
      .from(
        "planner_dispatcher_runs",
      )
      .insert({
        candidate_id:
          candidate.id,

        work_order_id:
          candidate.workOrderId,

        booking_id:
          booking.id,

        source_technician:
          candidate.sourceTechnician,

        target_technician:
          candidate.targetTechnician,

        status:
          "applied",

        verification_status:
          verification.status,

        total_drive_minutes_saved:
          verification.totalDriveMinutesSaved,

        total_distance_saved_meters:
          verification.totalDistanceSavedMeters,

        total_work_minutes_saved:
          verification.totalWorkMinutesSaved,

        rollback_snapshot:
          rollback,

        applied_at:
          rollback.createdAt,
      })
      .select("id")
      .maybeSingle();

    if (
      runError ||
      !runData
    ) {
      let rollbackFailed =
        false;

      const {
        error:
          bookingRestoreError,
      } = await supabase
        .from("bookings")
        .update({
          booking_date:
            rollback.previousBookingDate,
          start_time:
            rollback.previousStartTime,
          end_time:
            rollback.previousEndTime,
        })
        .eq(
          "id",
          booking.id,
        );

      if (bookingRestoreError) {
        rollbackFailed =
          true;
      }

      const {
        error:
          workOrderRestoreError,
      } = await supabase
        .from("work_orders")
        .update({
          assigned_to:
            rollback.previousAssignedTo,
        })
        .eq(
          "id",
          candidate.workOrderId,
        );

      if (workOrderRestoreError) {
        rollbackFailed =
          true;
      }

      return {
        success: false,
        code:
          rollbackFailed
            ? "ROLLBACK_FAILED"
            : "DATABASE_ERROR",
        message:
          rollbackFailed
            ? "Dispatcher-förslaget kunde inte historikföras och återställningen misslyckades delvis."
            : "Dispatcher-förslaget kunde inte historikföras. Ändringarna återställdes.",
        details:
          runError,
      };
    }

    const run =
      runData as DispatcherRunRow;

    refreshPlannerPages();

    return {
      success: true,
      message:
        `Jobb ${candidate.workOrderId} har flyttats från ${candidate.sourceTechnician} till ${candidate.targetTechnician}.`,
      rollback,
      runId:
        Number(run.id),
    };
  } catch (error) {
    console.error(
      "Apply dispatcher candidate error:",
      error,
    );

    return {
      success: false,
      code:
        "DATABASE_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Dispatcher-förslaget kunde inte tillämpas.",
      details:
        error,
    };
  }
}

export async function rollbackDispatcherCandidateAction({
  snapshot,
}: {
  snapshot:
    DispatcherApplyRollbackSnapshot;
}): Promise<RollbackDispatcherCandidateResult> {
  try {
    if (
      !snapshot ||
      snapshot.workOrderId <=
        0 ||
      snapshot.bookingId <=
        0
    ) {
      return {
        success: false,
        code:
          "INVALID_ROLLBACK",
        message:
          "Rollback-datan är ogiltig.",
      };
    }

    const supabase =
      getSupabaseServerClient();

    const {
      data:
        workOrderData,
      error:
        workOrderError,
    } = await supabase
      .from("work_orders")
      .select(
        "id, assigned_to",
      )
      .eq(
        "id",
        snapshot.workOrderId,
      )
      .maybeSingle();

    if (workOrderError) {
      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Arbetsordern kunde inte verifieras före rollback.",
        details:
          workOrderError,
      };
    }

    if (!workOrderData) {
      return {
        success: false,
        code:
          "WORK_ORDER_NOT_FOUND",
        message:
          "Arbetsordern finns inte längre.",
      };
    }

    const {
      data:
        bookingData,
      error:
        bookingError,
    } = await supabase
      .from("bookings")
      .select(
        "id, booking_date, start_time, end_time",
      )
      .eq(
        "id",
        snapshot.bookingId,
      )
      .maybeSingle();

    if (bookingError) {
      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Bokningen kunde inte verifieras före rollback.",
        details:
          bookingError,
      };
    }

    if (!bookingData) {
      return {
        success: false,
        code:
          "BOOKING_NOT_FOUND",
        message:
          "Bokningen finns inte längre.",
      };
    }

    const booking =
      bookingData as BookingRow;

    const currentAssignedTo =
      (
        workOrderData as {
          assigned_to:
            string | null;
        }
      ).assigned_to;

    if (
      currentAssignedTo !==
        snapshot.appliedAssignedTo ||
      booking.booking_date !==
        snapshot.appliedBookingDate ||
      normalizeTime(
        booking.start_time,
      ) !==
        normalizeTime(
          snapshot.appliedStartTime,
        ) ||
      normalizeTime(
        booking.end_time,
      ) !==
        normalizeTime(
          snapshot.appliedEndTime,
        )
    ) {
      return {
        success: false,
        code:
          "ROLLBACK_CONFLICT",
        message:
          "Jobbet har ändrats efter Dispatcher-Apply. Automatisk rollback stoppades för att inte skriva över nyare ändringar.",
      };
    }

    const {
      error:
        bookingRestoreError,
    } = await supabase
      .from("bookings")
      .update({
        booking_date:
          snapshot.previousBookingDate,
        start_time:
          snapshot.previousStartTime,
        end_time:
          snapshot.previousEndTime,
      })
      .eq(
        "id",
        snapshot.bookingId,
      );

    if (bookingRestoreError) {
      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Bokningen kunde inte återställas.",
        details:
          bookingRestoreError,
      };
    }

    const {
      error:
        assignmentRestoreError,
    } = await supabase
      .from("work_orders")
      .update({
        assigned_to:
          snapshot.previousAssignedTo,
      })
      .eq(
        "id",
        snapshot.workOrderId,
      );

    if (assignmentRestoreError) {
      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Bokningen återställdes men teknikerbytet kunde inte återställas.",
        details:
          assignmentRestoreError,
      };
    }

    const {
      error:
        runUpdateError,
    } = await supabase
      .from(
        "planner_dispatcher_runs",
      )
      .update({
        status:
          "rolled_back",
        rolled_back_at:
          new Date().toISOString(),
      })
      .eq(
        "candidate_id",
        snapshot.candidateId,
      )
      .eq(
        "status",
        "applied",
      );

    if (runUpdateError) {
      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Dispatcher-ändringen återställdes, men historiken kunde inte uppdateras.",
        details:
          runUpdateError,
      };
    }

    refreshPlannerPages();

    return {
      success: true,
      message:
        `Jobb ${snapshot.workOrderId} har återställts till ${snapshot.sourceTechnician}.`,
    };
  } catch (error) {
    console.error(
      "Rollback dispatcher candidate error:",
      error,
    );

    return {
      success: false,
      code:
        "DATABASE_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Dispatcher-ändringen kunde inte återställas.",
      details:
        error,
    };
  }
}