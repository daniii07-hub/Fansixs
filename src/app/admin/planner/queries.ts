import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PlannerEvent } from "./PlannerEventCard";
import type { PlannerTechnician } from "./PlannerSidebar";

type BookingRow = {
  id: number;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  customer_name: string;
  service: string;
  city: string | null;
  status: string | null;
};

type WorkOrderRow = {
  id: number;
  booking_id: number | null;
  assigned_to: string | null;
  status: string | null;
};

export type PlannerEventWithDate = PlannerEvent & {
  date: string;
};

export type PlannerData = {
  events: PlannerEventWithDate[];
  technicians: PlannerTechnician[];
  plannedCount: number;
  activeCount: number;
  completedCount: number;
};

const completedStatuses = new Set([
  "Utförd",
  "Fakturerad",
  "Betald",
  "Avslutad",
]);

function normalizeStatus(
  workOrderStatus: string | null | undefined,
  bookingStatus: string | null | undefined,
) {
  return workOrderStatus || bookingStatus || "Planerad";
}

function formatSupabaseError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }

  if (typeof error === "object" && error !== null) {
    const value = error as Record<string, unknown>;

    return {
      message: typeof value.message === "string" ? value.message : undefined,
      details: typeof value.details === "string" ? value.details : undefined,
      hint: typeof value.hint === "string" ? value.hint : undefined,
      code: typeof value.code === "string" ? value.code : undefined,
      status: value.status,
      statusText: value.statusText,
      keys: Object.keys(value),
      raw: JSON.stringify(value),
    };
  }

  return { message: String(error) };
}

function buildPlannerEvents({
  bookings,
  workOrders,
}: {
  bookings: BookingRow[];
  workOrders: WorkOrderRow[];
}): PlannerEventWithDate[] {
  const workOrdersByBookingId = new Map<
    number,
    WorkOrderRow
  >();

  for (const workOrder of workOrders) {
    if (workOrder.booking_id) {
      workOrdersByBookingId.set(
        workOrder.booking_id,
        workOrder,
      );
    }
  }

  return bookings
    .filter((booking) =>
      Boolean(booking.booking_date),
    )
    .map((booking) => {
      const workOrder =
        workOrdersByBookingId.get(
          booking.id,
        );

      const status = normalizeStatus(
        workOrder?.status,
        booking.status,
      );

      return {
        id: workOrder?.id ?? booking.id,
        date: booking.booking_date,
        customer:
          booking.customer_name ||
          "Okänd kund",
        service:
          booking.service ||
          "Tjänst saknas",
        city: booking.city,
        technician:
          workOrder?.assigned_to ?? null,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status,
        href: workOrder
          ? `/admin/work-orders/${workOrder.id}`
          : "/admin/calendar",
      };
    })
    .sort((a, b) => {
      const dateComparison =
        a.date.localeCompare(b.date);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return (a.startTime ?? "").localeCompare(
        b.startTime ?? "",
      );
    });
}

function buildTechnicians(
  events: PlannerEventWithDate[],
): PlannerTechnician[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    const technician =
      event.technician?.trim();

    if (!technician) {
      continue;
    }

    counts.set(
      technician,
      (counts.get(technician) ?? 0) + 1,
    );
  }

  return Array.from(counts.entries())
    .map(([name, jobCount], index) => ({
      id: `${index + 1}-${name}`,
      name,
      jobCount,
    }))
    .sort((a, b) =>
      a.name.localeCompare(
        b.name,
        "sv-SE",
      ),
    );
}

function countStatuses(
  events: PlannerEventWithDate[],
) {
  let plannedCount = 0;
  let activeCount = 0;
  let completedCount = 0;

  for (const event of events) {
    if (
      completedStatuses.has(
        event.status,
      )
    ) {
      completedCount += 1;
      continue;
    }

    if (
      event.status === "Pågår" ||
      event.status === "Aktiv"
    ) {
      activeCount += 1;
      continue;
    }

    plannedCount += 1;
  }

  return {
    plannedCount,
    activeCount,
    completedCount,
  };
}

async function getWorkOrders(): Promise<WorkOrderRow[]> {
  const supabase =
    getSupabaseServerClient();

  const primaryResult = await supabase
    .from("work_orders")
    .select(
      `
        id,
        booking_id,
        assigned_to,
        status
      `,
    );

  if (!primaryResult.error) {
    return (primaryResult.data ??
      []) as WorkOrderRow[];
  }

  console.warn(
    "Planner work-orders primary query failed:",
    formatSupabaseError(
      primaryResult.error,
    ),
  );

  /*
   * Fallback:
   * Om databasen ännu inte har kolumnen "assigned_to"
   * kan Planner fortfarande laddas. Jobben visas då som
   * "Ej tilldelad" tills kolumnen har skapats eller rätt namn
   * har lagts in här.
   */
  const fallbackResult = await supabase
    .from("work_orders")
    .select(
      `
        id,
        booking_id,
        status
      `,
    );

  if (fallbackResult.error) {
    console.error(
      "Planner work-orders fallback query failed:",
      formatSupabaseError(
        fallbackResult.error,
      ),
    );

    throw new Error(
      "Plannerns arbetsorder kunde inte hämtas.",
    );
  }

  return (
    fallbackResult.data ?? []
  ).map((row) => ({
    id: Number(row.id),
    booking_id:
      row.booking_id === null
        ? null
        : Number(row.booking_id),
    assigned_to: null,
    status:
      typeof row.status === "string"
        ? row.status
        : null,
  }));
}

export async function getPlannerData(): Promise<PlannerData> {
  const supabase =
    getSupabaseServerClient();

  const [
    bookingsResult,
    workOrders,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        `
          id,
          booking_date,
          start_time,
          end_time,
          customer_name,
          service,
          city,
          status
        `,
      )
      .order("booking_date", {
        ascending: true,
      })
      .order("start_time", {
        ascending: true,
      }),

    getWorkOrders(),
  ]);

  if (bookingsResult.error) {
    const formattedError =
      formatSupabaseError(
        bookingsResult.error,
      );

    console.error(
      "Planner bookings query failed:",
      formattedError,
    );

    throw new Error(
      formattedError.message ??
        "Plannerns bokningar kunde inte hämtas.",
    );
  }

  const events = buildPlannerEvents({
    bookings:
      (bookingsResult.data ??
        []) as BookingRow[],
    workOrders,
  });

  const technicians =
    buildTechnicians(events);

  return {
    events,
    technicians,
    ...countStatuses(events),
  };
}