"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  getSupabaseServerClient,
} from "@/lib/supabase/server";

import {
  materializeSchedule,
} from "../routing/optimization/materializeSchedule";
import type {
  RouteOptimizationCandidate,
} from "../routing/optimization/types";

export type ApplyOptimizationInput = {
  candidate:
    RouteOptimizationCandidate;
};

export type AppliedOptimizationItem = {
  workOrderId: number;
  bookingId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export type OptimizationRollbackItem = {
  bookingId: number;
  bookingDate: string;
  startTime: string | null;
  endTime: string | null;

  appliedBookingDate: string;
  appliedStartTime: string | null;
  appliedEndTime: string | null;
};

export type OptimizationRollbackSnapshot = {
  technicianName: string;
  candidateId: string;
  createdAt: string;
  items:
    OptimizationRollbackItem[];
};

export type ApplyOptimizationResult =
  | {
      success: true;
      message: string;
      applied:
        AppliedOptimizationItem[];
      rollback:
        OptimizationRollbackSnapshot;
      runId: number;
    }
  | {
      success: false;
      message: string;
      code:
        | "INVALID_CANDIDATE"
        | "NOT_GOOGLE_VERIFIED"
        | "SCHEDULE_INVALID"
        | "WORK_ORDER_NOT_FOUND"
        | "BOOKING_NOT_FOUND"
        | "DUPLICATE_BOOKING"
        | "ALREADY_APPLIED"
        | "STALE_PLANNER_DATA"
        | "DATABASE_ERROR"
        | "ROLLBACK_FAILED";
      details?: unknown;
    };

export type RollbackOptimizationInput = {
  snapshot:
    OptimizationRollbackSnapshot;
};

export type RollbackOptimizationResult =
  | {
      success: true;
      message: string;
      restoredCount: number;
    }
  | {
      success: false;
      message: string;
      code:
        | "INVALID_ROLLBACK"
        | "BOOKING_NOT_FOUND"
        | "ROLLBACK_CONFLICT"
        | "DATABASE_ERROR";
      details?: unknown;
    };

type ExistingWorkOrderRow = {
  id: number;
  booking_id: number | null;
};

type ExistingBookingRow = {
  id: number;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
};

type OptimizationRunRow = {
  id: number;
};

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

function hasGoogleVerifiedLegs(
  candidate:
    RouteOptimizationCandidate,
) {
  if (
    candidate.legs.length === 0
  ) {
    return false;
  }

  return candidate.legs.every(
    (leg) =>
      typeof leg.encodedPolyline ===
        "string" &&
      leg.encodedPolyline.length > 0 &&
      typeof leg.departureTime ===
        "string" &&
      leg.departureTime.length > 0 &&
      typeof leg.arrivalTime ===
        "string" &&
      leg.arrivalTime.length > 0,
  );
}

function hasUniquePositiveIds(
  values: number[],
) {
  return (
    values.every(
      (value) =>
        Number.isInteger(value) &&
        value > 0,
    ) &&
    new Set(values).size ===
      values.length
  );
}

function isValidDate(
  value: string,
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value,
  );
}

function isValidNullableTime(
  value: string | null,
) {
  return (
    value === null ||
    /^\d{2}:\d{2}(:\d{2})?$/.test(
      value,
    )
  );
}

function isValidRollbackSnapshot(
  snapshot:
    OptimizationRollbackSnapshot,
) {
  if (
    !snapshot ||
    typeof snapshot.candidateId !==
      "string" ||
    !snapshot.candidateId.trim() ||
    typeof snapshot.technicianName !==
      "string" ||
    !snapshot.technicianName.trim() ||
    typeof snapshot.createdAt !==
      "string" ||
    !Array.isArray(snapshot.items) ||
    snapshot.items.length === 0
  ) {
    return false;
  }

  const bookingIds =
    snapshot.items.map(
      (item) =>
        item.bookingId,
    );

  if (
    !hasUniquePositiveIds(
      bookingIds,
    )
  ) {
    return false;
  }

  return snapshot.items.every(
    (item) =>
      isValidDate(
        item.bookingDate,
      ) &&
      isValidNullableTime(
        item.startTime,
      ) &&
      isValidNullableTime(
        item.endTime,
      ) &&
      isValidDate(
        item.appliedBookingDate,
      ) &&
      isValidNullableTime(
        item.appliedStartTime,
      ) &&
      isValidNullableTime(
        item.appliedEndTime,
      ),
  );
}

function normalizeComparableTime(
  value: string | null | undefined,
) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  return trimmed;
}

function getCandidateBaselineByWorkOrderId(
  candidate: RouteOptimizationCandidate,
) {
  const result = new Map<
    number,
    {
      date: string;
      startTime: string | null;
      endTime: string | null;
    }
  >();

  for (const stop of candidate.stops) {
    if (
      stop.type !== "job" ||
      !stop.workOrderId ||
      !Number.isInteger(stop.workOrderId) ||
      stop.workOrderId <= 0
    ) {
      continue;
    }

    result.set(stop.workOrderId, {
      date: candidate.date,
      startTime:
        normalizeComparableTime(
          stop.plannedStartTime,
        ),
      endTime:
        normalizeComparableTime(
          stop.plannedEndTime,
        ),
    });
  }

  return result;
}

export async function applyOptimizationAction({
  candidate,
}: ApplyOptimizationInput): Promise<ApplyOptimizationResult> {
  try {
    if (
      !candidate ||
      candidate.source !==
        "optimized" ||
      !candidate.score.feasible ||
      candidate.stopOrder.length ===
        0
    ) {
      return {
        success: false,
        code:
          "INVALID_CANDIDATE",
        message:
          "Optimeringsförslaget är ogiltigt eller inte genomförbart.",
      };
    }

    if (
      !hasGoogleVerifiedLegs(
        candidate,
      )
    ) {
      return {
        success: false,
        code:
          "NOT_GOOGLE_VERIFIED",
        message:
          "Förslaget måste vara Google Routes-verifierat innan det kan tillämpas.",
      };
    }

    const materialized =
      materializeSchedule(
        candidate,
      );

    if (!materialized.success) {
      return {
        success: false,
        code:
          "SCHEDULE_INVALID",
        message:
          materialized.error
            .message,
        details:
          materialized.error,
      };
    }

    const workOrderIds =
      materialized.items.map(
        (item) =>
          item.workOrderId,
      );

    if (
      !hasUniquePositiveIds(
        workOrderIds,
      )
    ) {
      return {
        success: false,
        code:
          "INVALID_CANDIDATE",
        message:
          "Förslaget innehåller duplicerade eller ogiltiga arbetsorder.",
      };
    }

    const supabase =
      getSupabaseServerClient();

    /*
     * Idempotency guard:
     * samma optimeringskandidat får inte tillämpas igen
     * medan en aktiv audit-run redan finns.
     */
    const {
      data:
        existingRunRows,
      error:
        existingRunError,
    } = await supabase
      .from(
        "planner_optimization_runs",
      )
      .select("id")
      .eq(
        "candidate_id",
        candidate.id,
      )
      .eq(
        "technician_name",
        candidate.technicianName,
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
      .limit(1);

    if (existingRunError) {
      console.error(
        "Apply optimization duplicate-run check error:",
        existingRunError,
      );

      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Det gick inte att kontrollera om AI-förslaget redan har tillämpats.",
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
          "Det här AI-förslaget är redan tillämpat. Återställ den aktiva optimeringen innan samma kandidat kan tillämpas igen.",
        details: {
          runId:
            Number(
              (
                existingRunRows ??
                []
              )[0]?.id,
            ),
          candidateId:
            candidate.id,
          technicianName:
            candidate.technicianName,
        },
      };
    }

    const {
      data:
        workOrderRows,
      error:
        workOrderError,
    } = await supabase
      .from("work_orders")
      .select(
        "id, booking_id",
      )
      .in(
        "id",
        workOrderIds,
      );

    if (workOrderError) {
      console.error(
        "Apply optimization work-orders error:",
        workOrderError,
      );

      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Arbetsordrarna kunde inte verifieras före tillämpning.",
        details:
          workOrderError,
      };
    }

    const workOrders =
      (workOrderRows ??
        []) as ExistingWorkOrderRow[];

    if (
      workOrders.length !==
      workOrderIds.length
    ) {
      return {
        success: false,
        code:
          "WORK_ORDER_NOT_FOUND",
        message:
          "Minst en arbetsorder i AI-förslaget kunde inte hittas.",
      };
    }

    const bookingIdByWorkOrderId =
      new Map<
        number,
        number
      >();

    for (
      const workOrder of
        workOrders
    ) {
      if (
        !workOrder.booking_id ||
        !Number.isInteger(
          workOrder.booking_id,
        ) ||
        workOrder.booking_id <=
          0
      ) {
        return {
          success: false,
          code:
            "BOOKING_NOT_FOUND",
          message:
            `Arbetsorder ${workOrder.id} saknar en giltig bokning.`,
        };
      }

      bookingIdByWorkOrderId.set(
        workOrder.id,
        workOrder.booking_id,
      );
    }

    const bookingIds =
      workOrderIds.map(
        (workOrderId) =>
          bookingIdByWorkOrderId.get(
            workOrderId,
          ) as number,
      );

    if (
      new Set(
        bookingIds,
      ).size !==
      bookingIds.length
    ) {
      return {
        success: false,
        code:
          "DUPLICATE_BOOKING",
        message:
          "Flera arbetsordrar i förslaget pekar på samma bokning. Tillämpningen stoppades.",
      };
    }

    const {
      data:
        bookingRows,
      error:
        bookingReadError,
    } = await supabase
      .from("bookings")
      .select(
        "id, booking_date, start_time, end_time",
      )
      .in(
        "id",
        bookingIds,
      );

    if (bookingReadError) {
      console.error(
        "Apply optimization bookings read error:",
        bookingReadError,
      );

      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Bokningarna kunde inte verifieras före tillämpning.",
        details:
          bookingReadError,
      };
    }

    const existingBookings =
      (bookingRows ??
        []) as ExistingBookingRow[];

    if (
      existingBookings.length !==
      bookingIds.length
    ) {
      return {
        success: false,
        code:
          "BOOKING_NOT_FOUND",
        message:
          "Minst en bokning i AI-förslaget kunde inte hittas.",
      };
    }

    const existingBookingMap =
      new Map(
        existingBookings.map(
          (booking) => [
            booking.id,
            booking,
          ],
        ),
      );

    /*
     * Stale-data guard:
     * skriv inte över en bokning som ändrats efter att
     * AI-kandidaten skapades.
     */
    const candidateBaselineByWorkOrderId =
      getCandidateBaselineByWorkOrderId(
        candidate,
      );

    const staleBookings: Array<{
      workOrderId: number;
      bookingId: number;
      expected: unknown;
      current: unknown;
    }> = [];

    for (const workOrderId of workOrderIds) {
      const bookingId =
        bookingIdByWorkOrderId.get(
          workOrderId,
        );

      const expected =
        candidateBaselineByWorkOrderId.get(
          workOrderId,
        );

      const current =
        bookingId
          ? existingBookingMap.get(
              bookingId,
            )
          : undefined;

      if (!bookingId || !expected || !current) {
        continue;
      }

      const currentStart =
        normalizeComparableTime(
          current.start_time,
        );

      const currentEnd =
        normalizeComparableTime(
          current.end_time,
        );

      if (
        current.booking_date !== expected.date ||
        currentStart !== expected.startTime ||
        currentEnd !== expected.endTime
      ) {
        staleBookings.push({
          workOrderId,
          bookingId,
          expected,
          current: {
            date: current.booking_date,
            startTime: currentStart,
            endTime: currentEnd,
          },
        });
      }
    }

    if (staleBookings.length > 0) {
      return {
        success: false,
        code: "STALE_PLANNER_DATA",
        message:
          "Planeringen har ändrats sedan AI-förslaget skapades. Kör optimeringen igen innan förslaget tillämpas.",
        details: {
          candidateId: candidate.id,
          technicianName:
            candidate.technicianName,
          changedBookings:
            staleBookings,
        },
      };
    }

    const rollback:
      OptimizationRollbackSnapshot = {
      technicianName:
        candidate.technicianName,
      candidateId:
        candidate.id,
      createdAt:
        new Date().toISOString(),
      items:
        existingBookings.map(
          (booking) => {
            const workOrderId =
              workOrderIds.find(
                (id) =>
                  bookingIdByWorkOrderId.get(
                    id,
                  ) === booking.id,
              );

            const appliedItem =
              materialized.items.find(
                (item) =>
                  item.workOrderId ===
                  workOrderId,
              );

            if (!appliedItem) {
              throw new Error(
                `Tillämpad plan saknas för bokning ${booking.id}.`,
              );
            }

            return {
              bookingId:
                booking.id,
              bookingDate:
                booking.booking_date,
              startTime:
                booking.start_time,
              endTime:
                booking.end_time,

              appliedBookingDate:
                appliedItem.date,
              appliedStartTime:
                appliedItem.startTime,
              appliedEndTime:
                appliedItem.endTime,
            };
          },
        ),
    };

    const applied:
      AppliedOptimizationItem[] =
      [];

    for (
      const item of
        materialized.items
    ) {
      const bookingId =
        bookingIdByWorkOrderId.get(
          item.workOrderId,
        );

      if (!bookingId) {
        return {
          success: false,
          code:
            "BOOKING_NOT_FOUND",
          message:
            `Bokningen för arbetsorder ${item.workOrderId} kunde inte hittas.`,
        };
      }

      const {
        data:
          updatedBooking,
        error:
          updateError,
      } = await supabase
        .from("bookings")
        .update({
          booking_date:
            item.date,
          start_time:
            item.startTime,
          end_time:
            item.endTime,
        })
        .eq(
          "id",
          bookingId,
        )
        .select("id")
        .maybeSingle();

      if (
        updateError ||
        !updatedBooking
      ) {
        console.error(
          "Apply optimization booking update error:",
          updateError,
        );

        let rollbackFailed =
          false;

        for (
          const appliedItem of
            [...applied].reverse()
        ) {
          const previous =
            existingBookingMap.get(
              appliedItem.bookingId,
            );

          if (!previous) {
            rollbackFailed =
              true;
            continue;
          }

          const {
            error:
              rollbackError,
          } = await supabase
            .from("bookings")
            .update({
              booking_date:
                previous.booking_date,
              start_time:
                previous.start_time,
              end_time:
                previous.end_time,
            })
            .eq(
              "id",
              previous.id,
            );

          if (rollbackError) {
            rollbackFailed =
              true;

            console.error(
              "Apply optimization rollback error:",
              rollbackError,
            );
          }
        }

        return {
          success: false,
          code:
            rollbackFailed
              ? "ROLLBACK_FAILED"
              : "DATABASE_ERROR",
          message:
            rollbackFailed
              ? "Tillämpningen misslyckades och minst en tidigare ändring kunde inte återställas automatiskt."
              : "Tillämpningen misslyckades. Redan gjorda ändringar återställdes.",
          details:
            updateError,
        };
      }

      applied.push({
        workOrderId:
          item.workOrderId,
        bookingId,
        bookingDate:
          item.date,
        startTime:
          item.startTime,
        endTime:
          item.endTime,
      });
    }

    /*
     * När alla bokningar har uppdaterats sparar vi
     * själva AI-optimeringen permanent. Om audit-posten
     * inte kan skapas återställer vi bokningarna så att
     * Planner och historiken aldrig hamnar ur synk.
     */
    const {
      data:
        optimizationRun,
      error:
        optimizationRunError,
    } = await supabase
      .from(
        "planner_optimization_runs",
      )
      .insert({
        candidate_id:
          candidate.id,
        technician_name:
          candidate.technicianName,
        status:
          "applied",
        applied_job_count:
          applied.length,
        rollback_snapshot:
          rollback,
        applied_at:
          rollback.createdAt,
      })
      .select("id")
      .maybeSingle();

    if (
      optimizationRunError ||
      !optimizationRun
    ) {
      console.error(
        "Apply optimization audit insert error:",
        optimizationRunError,
      );

      let rollbackFailed =
        false;

      for (
        const rollbackItem of
          rollback.items
      ) {
        const {
          error:
            restoreError,
        } = await supabase
          .from("bookings")
          .update({
            booking_date:
              rollbackItem.bookingDate,
            start_time:
              rollbackItem.startTime,
            end_time:
              rollbackItem.endTime,
          })
          .eq(
            "id",
            rollbackItem.bookingId,
          );

        if (restoreError) {
          rollbackFailed =
            true;

          console.error(
            "Apply optimization audit rollback error:",
            restoreError,
          );
        }
      }

      return {
        success: false,
        code:
          rollbackFailed
            ? "ROLLBACK_FAILED"
            : "DATABASE_ERROR",
        message:
          rollbackFailed
            ? "AI-planen kunde inte historikföras och minst en bokning kunde inte återställas automatiskt."
            : "AI-planen kunde inte historikföras. Bokningsändringarna återställdes.",
        details:
          optimizationRunError,
      };
    }

    const run =
      optimizationRun as OptimizationRunRow;

    refreshPlannerPages();

    return {
      success: true,
      message:
        `${applied.length} jobb har uppdaterats enligt det Google-verifierade AI-förslaget.`,
      applied,
      rollback,
      runId:
        Number(run.id),
    };
  } catch (error) {
    console.error(
      "Apply optimization action error:",
      error,
    );

    return {
      success: false,
      code:
        "DATABASE_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "AI-förslaget kunde inte tillämpas.",
      details:
        error,
    };
  }
}

export async function rollbackOptimizationAction({
  snapshot,
}: RollbackOptimizationInput): Promise<RollbackOptimizationResult> {
  try {
    if (
      !isValidRollbackSnapshot(
        snapshot,
      )
    ) {
      return {
        success: false,
        code:
          "INVALID_ROLLBACK",
        message:
          "Rollback-datan är ogiltig eller ofullständig.",
      };
    }

    const supabase =
      getSupabaseServerClient();

    const bookingIds =
      snapshot.items.map(
        (item) =>
          item.bookingId,
      );

    const {
      data:
        existingRows,
      error:
        readError,
    } = await supabase
      .from("bookings")
      .select(
        "id, booking_date, start_time, end_time",
      )
      .in(
        "id",
        bookingIds,
      );

    if (readError) {
      console.error(
        "Rollback optimization bookings read error:",
        readError,
      );

      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Bokningarna kunde inte verifieras före återställning.",
        details:
          readError,
      };
    }

    if (
      (existingRows ?? [])
        .length !==
      bookingIds.length
    ) {
      return {
        success: false,
        code:
          "BOOKING_NOT_FOUND",
        message:
          "Minst en bokning som ska återställas finns inte längre.",
      };
    }

    const currentBookings =
      (existingRows ??
        []) as ExistingBookingRow[];

    const currentBookingMap =
      new Map(
        currentBookings.map(
          (booking) => [
            booking.id,
            booking,
          ],
        ),
      );

    /*
     * Safe rollback guard:
     * rollback får bara ske om bokningarna fortfarande
     * motsvarar exakt det läge som Apply skrev.
     * Manuella ändringar efter AI-planen bevaras därmed.
     */
    const rollbackConflicts: Array<{
      bookingId: number;
      expectedApplied: {
        bookingDate: string;
        startTime: string | null;
        endTime: string | null;
      };
      current: {
        bookingDate: string;
        startTime: string | null;
        endTime: string | null;
      };
    }> = [];

    for (const item of snapshot.items) {
      const current =
        currentBookingMap.get(
          item.bookingId,
        );

      if (!current) {
        continue;
      }

      const currentStart =
        normalizeComparableTime(
          current.start_time,
        );

      const currentEnd =
        normalizeComparableTime(
          current.end_time,
        );

      const expectedStart =
        normalizeComparableTime(
          item.appliedStartTime,
        );

      const expectedEnd =
        normalizeComparableTime(
          item.appliedEndTime,
        );

      if (
        current.booking_date !==
          item.appliedBookingDate ||
        currentStart !==
          expectedStart ||
        currentEnd !==
          expectedEnd
      ) {
        rollbackConflicts.push({
          bookingId:
            item.bookingId,
          expectedApplied: {
            bookingDate:
              item.appliedBookingDate,
            startTime:
              expectedStart,
            endTime:
              expectedEnd,
          },
          current: {
            bookingDate:
              current.booking_date,
            startTime:
              currentStart,
            endTime:
              currentEnd,
          },
        });
      }
    }

    if (
      rollbackConflicts.length >
      0
    ) {
      return {
        success: false,
        code:
          "ROLLBACK_CONFLICT",
        message:
          "Minst en bokning har ändrats efter AI-optimeringen. Automatisk återställning stoppades för att inte skriva över nyare ändringar.",
        details: {
          candidateId:
            snapshot.candidateId,
          technicianName:
            snapshot.technicianName,
          conflicts:
            rollbackConflicts,
        },
      };
    }

    let restoredCount = 0;

    for (
      const item of
        snapshot.items
    ) {
      const {
        data:
          restoredBooking,
        error:
          restoreError,
      } = await supabase
        .from("bookings")
        .update({
          booking_date:
            item.bookingDate,
          start_time:
            item.startTime,
          end_time:
            item.endTime,
        })
        .eq(
          "id",
          item.bookingId,
        )
        .select("id")
        .maybeSingle();

      if (
        restoreError ||
        !restoredBooking
      ) {
        console.error(
          "Rollback optimization restore error:",
          restoreError,
        );

        return {
          success: false,
          code:
            "DATABASE_ERROR",
          message:
            `Återställningen avbröts efter ${restoredCount} återställda bokningar.`,
          details:
            restoreError,
        };
      }

      restoredCount += 1;
    }

    /*
     * Hitta den senaste fortfarande aktiva körningen
     * för samma kandidat/tekniker och markera den som
     * återställd. Själva bokningarna är redan återställda
     * ovan, så historiken speglar nu verkligt läge.
     */
    const {
      data:
        runRows,
      error:
        runReadError,
    } = await supabase
      .from(
        "planner_optimization_runs",
      )
      .select("id")
      .eq(
        "candidate_id",
        snapshot.candidateId,
      )
      .eq(
        "technician_name",
        snapshot.technicianName,
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
      .limit(1);

    if (runReadError) {
      console.error(
        "Rollback optimization run read error:",
        runReadError,
      );

      return {
        success: false,
        code:
          "DATABASE_ERROR",
        message:
          "Bokningarna återställdes, men optimeringshistoriken kunde inte uppdateras.",
        details:
          runReadError,
      };
    }

    const latestRun =
      (
        runRows ??
        []
      )[0] as
        | OptimizationRunRow
        | undefined;

    if (latestRun) {
      const {
        error:
          runUpdateError,
      } = await supabase
        .from(
          "planner_optimization_runs",
        )
        .update({
          status:
            "rolled_back",
          rolled_back_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          latestRun.id,
        );

      if (runUpdateError) {
        console.error(
          "Rollback optimization run update error:",
          runUpdateError,
        );

        return {
          success: false,
          code:
            "DATABASE_ERROR",
          message:
            "Bokningarna återställdes, men optimeringshistoriken kunde inte markeras som återställd.",
          details:
            runUpdateError,
        };
      }
    }

    refreshPlannerPages();

    return {
      success: true,
      message:
        `${restoredCount} jobb har återställts till planen som gällde före AI-optimeringen.`,
      restoredCount,
    };
  } catch (error) {
    console.error(
      "Rollback optimization action error:",
      error,
    );

    return {
      success: false,
      code:
        "DATABASE_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Planeringen kunde inte återställas.",
      details:
        error,
    };
  }
}