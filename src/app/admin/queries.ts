import { getSupabaseServerClient } from "@/lib/supabase/server";
import { calculateDashboardStats } from "./dashboard/stats";
import type {
  CalendarEvent,
  DashboardActivity,
  DashboardData,
  InvoiceStatusChartPoint,
  Lead,
  MonthlyChartPoint,
  RecentInvoice,
} from "./types";

type InvoiceAmountRow = {
  invoice_date: string;
  total_amount: number | string | null;
  status: string;
};

type InvoiceActivityRow = {
  id: number;
  invoice_number: string | null;
  customer_name: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type WorkOrderActivityRow = {
  id: number;
  status: string;
  completed_at: string | null;
  signed_at: string | null;
  ai_summary: string | null;
  created_at: string;
};

type CalendarBookingRow = {
  id: number;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  customer_name: string;
  service: string;
  city: string | null;
  status: string;
};

type CalendarWorkOrderRow = {
  id: number;
  booking_id: number | null;
  assigned_to: string | null;
  status: string;
};

function toNumber(
  value: number | string | null | undefined,
) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getDateParts() {
  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const monthStart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");

  const chartStart = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1,
  );

  const chartStartDate = [
    chartStart.getFullYear(),
    String(chartStart.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");

  const calendarStart = new Date(
    now.getFullYear(),
    now.getMonth() - 12,
    1,
  );

  const calendarEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 13,
    0,
  );

  const calendarStartDate = [
    calendarStart.getFullYear(),
    String(calendarStart.getMonth() + 1).padStart(2, "0"),
    String(calendarStart.getDate()).padStart(2, "0"),
  ].join("-");

  const calendarEndDate = [
    calendarEnd.getFullYear(),
    String(calendarEnd.getMonth() + 1).padStart(2, "0"),
    String(calendarEnd.getDate()).padStart(2, "0"),
  ].join("-");

  return {
    today,
    monthStart,
    chartStartDate,
    calendarStartDate,
    calendarEndDate,
    now,
  };
}

function getMonthKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

function buildMonthSeries(
  referenceDate: Date,
): {
  keys: string[];
  labels: string[];
} {
  const keys: string[] = [];
  const labels: string[] = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - offset,
      1,
    );

    keys.push(getMonthKey(date));
    labels.push(getMonthLabel(date));
  }

  return {
    keys,
    labels,
  };
}

function buildRevenueByMonth(
  invoices: InvoiceAmountRow[],
  referenceDate: Date,
): MonthlyChartPoint[] {
  const { keys, labels } =
    buildMonthSeries(referenceDate);

  const totals = new Map<string, number>(
    keys.map((key) => [key, 0]),
  );

  for (const invoice of invoices) {
    if (
      invoice.status !== "Betald" ||
      !invoice.invoice_date
    ) {
      continue;
    }

    const key = invoice.invoice_date.slice(0, 7);

    if (!totals.has(key)) {
      continue;
    }

    totals.set(
      key,
      (totals.get(key) ?? 0) +
        toNumber(invoice.total_amount),
    );
  }

  return keys.map((key, index) => ({
    label: labels[index],
    value: totals.get(key) ?? 0,
  }));
}

function buildLeadsByMonth(
  leads: Lead[],
  referenceDate: Date,
): MonthlyChartPoint[] {
  const { keys, labels } =
    buildMonthSeries(referenceDate);

  const totals = new Map<string, number>(
    keys.map((key) => [key, 0]),
  );

  for (const lead of leads) {
    const key = lead.created_at.slice(0, 7);

    if (!totals.has(key)) {
      continue;
    }

    totals.set(
      key,
      (totals.get(key) ?? 0) + 1,
    );
  }

  return keys.map((key, index) => ({
    label: labels[index],
    value: totals.get(key) ?? 0,
  }));
}

function buildInvoiceStatus(
  invoices: InvoiceAmountRow[],
): InvoiceStatusChartPoint[] {
  const statuses = [
    "Utkast",
    "Godkänd",
    "Skickad",
    "Betald",
    "Förfallen",
  ];

  return statuses.map((status) => ({
    label: status,
    value: invoices.filter(
      (invoice) => invoice.status === status,
    ).length,
  }));
}

function buildActivities({
  leads,
  invoices,
  workOrders,
}: {
  leads: Lead[];
  invoices: InvoiceActivityRow[];
  workOrders: WorkOrderActivityRow[];
}): DashboardActivity[] {
  const activities: DashboardActivity[] = [];

  for (const lead of leads.slice(0, 6)) {
    activities.push({
      id: `lead-${lead.id}`,
      type: "lead_created",
      title: "Ny lead inkom",
      description: `${lead.name} är intresserad av ${lead.service} i ${lead.city}.`,
      timestamp: lead.created_at,
      href: `/admin/leads/${lead.id}`,
    });
  }

  for (const invoice of invoices) {
    activities.push({
      id: `invoice-created-${invoice.id}`,
      type: "invoice_created",
      title: "Faktura skapades",
      description: invoice.invoice_number
        ? `Faktura ${invoice.invoice_number} skapades för ${invoice.customer_name}.`
        : `Fakturautkast #${invoice.id} skapades för ${invoice.customer_name}.`,
      timestamp: invoice.created_at,
      href: `/admin/invoices/${invoice.id}`,
    });

    if (invoice.status === "Skickad") {
      activities.push({
        id: `invoice-sent-${invoice.id}`,
        type: "invoice_sent",
        title: "Faktura skickades",
        description: `Fakturan till ${invoice.customer_name} markerades som skickad.`,
        timestamp: invoice.updated_at,
        href: `/admin/invoices/${invoice.id}`,
      });
    }
  }

  for (const workOrder of workOrders) {
    if (workOrder.completed_at) {
      activities.push({
        id: `work-order-completed-${workOrder.id}`,
        type: "work_order_completed",
        title: "Arbetsorder slutförd",
        description: `Arbetsorder #${workOrder.id} markerades som utförd.`,
        timestamp: workOrder.completed_at,
        href: `/admin/work-orders/${workOrder.id}`,
      });
    }

    if (workOrder.signed_at) {
      activities.push({
        id: `signature-${workOrder.id}`,
        type: "signature_added",
        title: "Kund signerade",
        description: `Kundsignatur registrerades på arbetsorder #${workOrder.id}.`,
        timestamp: workOrder.signed_at,
        href: `/admin/work-orders/${workOrder.id}`,
      });
    }

    if (workOrder.ai_summary) {
      activities.push({
        id: `ai-${workOrder.id}`,
        type: "ai_generated",
        title: "AI-rapport skapades",
        description: `AI-sammanfattning skapades för arbetsorder #${workOrder.id}.`,
        timestamp:
          workOrder.completed_at ??
          workOrder.created_at,
        href: `/admin/work-orders/${workOrder.id}`,
      });
    }
  }

  return activities
    .filter((activity) =>
      Boolean(activity.timestamp),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime(),
    )
    .slice(0, 10);
}

function buildCalendarEvents({
  bookings,
  workOrders,
}: {
  bookings: CalendarBookingRow[];
  workOrders: CalendarWorkOrderRow[];
}): CalendarEvent[] {
  const workOrdersByBookingId = new Map<
    number,
    CalendarWorkOrderRow
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
    .filter((booking) => Boolean(booking.booking_date))
    .map((booking) => {
      const workOrder =
        workOrdersByBookingId.get(booking.id);

      return {
        id: workOrder?.id ?? booking.id,
        date: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        customerName:
          booking.customer_name || "Okänd kund",
        service:
          booking.service || "Tjänst saknas",
        city: booking.city,
        assignedTo:
          workOrder?.assigned_to ?? null,
        status:
          workOrder?.status ??
          booking.status ??
          "Planerad",
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

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseServerClient();

  const {
    today,
    monthStart,
    chartStartDate,
    calendarStartDate,
    calendarEndDate,
    now,
  } = getDateParts();

  const [
    leadsResult,
    paidInvoicesResult,
    unpaidInvoicesResult,
    recentInvoicesResult,
    chartInvoicesResult,
    activityInvoicesResult,
    activityWorkOrdersResult,
    calendarBookingsResult,
    calendarWorkOrdersResult,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select(
        `
          id,
          created_at,
          name,
          service,
          city,
          status
        `,
      )
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("invoices")
      .select("total_amount")
      .eq("status", "Betald")
      .gte("invoice_date", monthStart),

    supabase
      .from("invoices")
      .select("total_amount")
      .in("status", [
        "Godkänd",
        "Skickad",
        "Förfallen",
      ]),

    supabase
      .from("invoices")
      .select(
        `
          id,
          invoice_number,
          customer_name,
          invoice_date,
          total_amount,
          status
        `,
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    supabase
      .from("invoices")
      .select(
        `
          invoice_date,
          total_amount,
          status
        `,
      )
      .gte("invoice_date", chartStartDate),

    supabase
      .from("invoices")
      .select(
        `
          id,
          invoice_number,
          customer_name,
          status,
          created_at,
          updated_at
        `,
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(8),

    supabase
      .from("work_orders")
      .select(
        `
          id,
          status,
          completed_at,
          signed_at,
          ai_summary,
          created_at
        `,
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(8),

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
      .gte("booking_date", calendarStartDate)
      .lte("booking_date", calendarEndDate)
      .order("booking_date", {
        ascending: true,
      })
      .order("start_time", {
        ascending: true,
      }),

    supabase
      .from("work_orders")
      .select(
        `
          id,
          booking_id,
          assigned_to,
          status
        `,
      ),
  ]);

  const requiredResults = [
    {
      error: leadsResult.error,
      message:
        "Dashboardens leads kunde inte hämtas.",
      label: "dashboard-leads",
    },
    {
      error: paidInvoicesResult.error,
      message:
        "Dashboardens omsättning kunde inte hämtas.",
      label: "månadens omsättning",
    },
    {
      error: unpaidInvoicesResult.error,
      message:
        "Obetalda fakturor kunde inte hämtas.",
      label: "obetalda fakturor",
    },
    {
      error: recentInvoicesResult.error,
      message:
        "Senaste fakturorna kunde inte hämtas.",
      label: "senaste fakturor",
    },
    {
      error: chartInvoicesResult.error,
      message:
        "Dashboardens diagramdata kunde inte hämtas.",
      label: "diagramdata",
    },
    {
      error: activityInvoicesResult.error,
      message:
        "Fakturaaktiviteter kunde inte hämtas.",
      label: "fakturaaktiviteter",
    },
    {
      error: activityWorkOrdersResult.error,
      message:
        "Arbetsorderaktiviteter kunde inte hämtas.",
      label: "arbetsorderaktiviteter",
    },
    {
      error: calendarBookingsResult.error,
      message:
        "Kalenderns bokningar kunde inte hämtas.",
      label: "kalenderbokningar",
    },
    {
      error: calendarWorkOrdersResult.error,
      message:
        "Kalenderns arbetsorder kunde inte hämtas.",
      label: "kalenderarbetsorder",
    },
  ];

  for (const result of requiredResults) {
    if (result.error) {
      console.error(
        `Kunde inte hämta ${result.label}:`,
        JSON.stringify(result.error, null, 2),
      );

      throw new Error(result.message);
    }
  }

  const leads =
    (leadsResult.data ?? []) as Lead[];

  const revenueThisMonth =
    (paidInvoicesResult.data ?? []).reduce(
      (sum, invoice) =>
        sum + toNumber(invoice.total_amount),
      0,
    );

  const unpaidInvoiceCount =
    unpaidInvoicesResult.data?.length ?? 0;

  const unpaidInvoiceAmount =
    (unpaidInvoicesResult.data ?? []).reduce(
      (sum, invoice) =>
        sum + toNumber(invoice.total_amount),
      0,
    );

  const newLeadsThisMonth = leads.filter(
    (lead) =>
      lead.created_at.slice(0, 10) >= monthStart,
  ).length;

  const recentInvoices =
    (recentInvoicesResult.data ?? []).map(
      (invoice) => ({
        ...invoice,
        total_amount: toNumber(
          invoice.total_amount,
        ),
      }),
    ) as RecentInvoice[];

  const chartInvoices =
    (chartInvoicesResult.data ??
      []) as InvoiceAmountRow[];

  const activityInvoices =
    (activityInvoicesResult.data ??
      []) as InvoiceActivityRow[];

  const activityWorkOrders =
    (activityWorkOrdersResult.data ??
      []) as WorkOrderActivityRow[];

  const calendarBookings =
    (calendarBookingsResult.data ??
      []) as CalendarBookingRow[];

  const calendarWorkOrders =
    (calendarWorkOrdersResult.data ??
      []) as CalendarWorkOrderRow[];

  const jobsToday = calendarBookings.filter(
    (booking) => booking.booking_date === today,
  ).length;

  return {
    leads,
    recentLeads: leads.slice(0, 5),
    recentInvoices,

    stats: calculateDashboardStats(leads),

    businessStats: {
      revenueThisMonth,
      unpaidInvoiceCount,
      unpaidInvoiceAmount,
      newLeadsThisMonth,
      jobsToday,
    },

    charts: {
      revenueByMonth:
        buildRevenueByMonth(
          chartInvoices,
          now,
        ),

      leadsByMonth:
        buildLeadsByMonth(
          leads,
          now,
        ),

      invoiceStatus:
        buildInvoiceStatus(
          chartInvoices,
        ),
    },

    activities: buildActivities({
      leads,
      invoices: activityInvoices,
      workOrders: activityWorkOrders,
    }),

    calendarEvents: buildCalendarEvents({
      bookings: calendarBookings,
      workOrders: calendarWorkOrders,
    }),
  };
}