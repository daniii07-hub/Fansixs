"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type MovePlannerEventInput = {
  workOrderId: number;
  bookingDate: string;
  startTime?: string | null;
  endTime?: string | null;
};

type PlannerActionResult = {
  success: boolean;
  message?: string;
};

function isValidId(value: number) {
  return Number.isInteger(value) && value > 0;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function refreshPlannerPages() {
  revalidatePath("/admin/planner");
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/work-orders");
}

export async function movePlannerEvent(
  input: MovePlannerEventInput,
): Promise<PlannerActionResult> {
  try {
    if (!isValidId(input.workOrderId)) {
      return {
        success: false,
        message: "Ogiltigt arbetsorder-ID.",
      };
    }

    if (!isValidDate(input.bookingDate)) {
      return {
        success: false,
        message: "Det nya datumet är ogiltigt.",
      };
    }

    const startTime =
      input.startTime === undefined
        ? undefined
        : normalizeTime(input.startTime);

    const endTime =
      input.endTime === undefined
        ? undefined
        : normalizeTime(input.endTime);

    if (
      input.startTime &&
      startTime === null
    ) {
      return {
        success: false,
        message: "Starttiden är ogiltig.",
      };
    }

    if (
      input.endTime &&
      endTime === null
    ) {
      return {
        success: false,
        message: "Sluttiden är ogiltig.",
      };
    }

    if (
      startTime &&
      endTime &&
      startTime >= endTime
    ) {
      return {
        success: false,
        message:
          "Sluttiden måste vara senare än starttiden.",
      };
    }

    const supabase =
      getSupabaseServerClient();

    const {
      data: workOrder,
      error: workOrderError,
    } = await supabase
      .from("work_orders")
      .select("id, booking_id")
      .eq("id", input.workOrderId)
      .maybeSingle();

    if (workOrderError) {
      console.error(
        "Move planner event work-order error:",
        workOrderError,
      );

      throw new Error(
        "Arbetsordern kunde inte hämtas.",
      );
    }

    if (!workOrder) {
      return {
        success: false,
        message: "Arbetsordern kunde inte hittas.",
      };
    }

    if (!workOrder.booking_id) {
      return {
        success: false,
        message:
          "Arbetsordern saknar kopplad bokning.",
      };
    }

    const update: {
      booking_date: string;
      start_time?: string | null;
      end_time?: string | null;
    } = {
      booking_date: input.bookingDate,
    };

    if (input.startTime !== undefined) {
      update.start_time = startTime ?? null;
    }

    if (input.endTime !== undefined) {
      update.end_time = endTime ?? null;
    }

    const {
      data: booking,
      error: bookingError,
    } = await supabase
      .from("bookings")
      .update(update)
      .eq("id", workOrder.booking_id)
      .select("id")
      .maybeSingle();

    if (bookingError) {
      console.error(
        "Move planner event booking error:",
        bookingError,
      );

      throw new Error(
        "Bokningen kunde inte flyttas.",
      );
    }

    if (!booking) {
      return {
        success: false,
        message: "Bokningen kunde inte hittas.",
      };
    }

    refreshPlannerPages();

    return {
      success: true,
      message:
        "Jobbet har flyttats och planeringen har uppdaterats.",
    };
  } catch (error) {
    console.error(
      "Move planner event error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Jobbet kunde inte flyttas.",
    };
  }
}

export async function updatePlannerEventTime({
  workOrderId,
  startTime,
  endTime,
}: {
  workOrderId: number;
  startTime: string | null;
  endTime: string | null;
}): Promise<PlannerActionResult> {
  try {
    if (!isValidId(workOrderId)) {
      return {
        success: false,
        message: "Ogiltigt arbetsorder-ID.",
      };
    }

    const normalizedStart =
      normalizeTime(startTime);

    const normalizedEnd =
      normalizeTime(endTime);

    if (startTime && !normalizedStart) {
      return {
        success: false,
        message: "Starttiden är ogiltig.",
      };
    }

    if (endTime && !normalizedEnd) {
      return {
        success: false,
        message: "Sluttiden är ogiltig.",
      };
    }

    if (
      normalizedStart &&
      normalizedEnd &&
      normalizedStart >= normalizedEnd
    ) {
      return {
        success: false,
        message:
          "Sluttiden måste vara senare än starttiden.",
      };
    }

    const supabase =
      getSupabaseServerClient();

    const {
      data: workOrder,
      error: workOrderError,
    } = await supabase
      .from("work_orders")
      .select("booking_id")
      .eq("id", workOrderId)
      .maybeSingle();

    if (workOrderError) {
      throw new Error(
        "Arbetsordern kunde inte hämtas.",
      );
    }

    if (!workOrder?.booking_id) {
      return {
        success: false,
        message:
          "Arbetsordern saknar kopplad bokning.",
      };
    }

    const { error: bookingError } =
      await supabase
        .from("bookings")
        .update({
          start_time:
            normalizedStart ?? null,
          end_time:
            normalizedEnd ?? null,
        })
        .eq("id", workOrder.booking_id);

    if (bookingError) {
      throw new Error(
        "Tiderna kunde inte uppdateras.",
      );
    }

    refreshPlannerPages();

    return {
      success: true,
      message:
        "Jobbets tider har uppdaterats.",
    };
  } catch (error) {
    console.error(
      "Update planner event time error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Tiderna kunde inte uppdateras.",
    };
  }
}