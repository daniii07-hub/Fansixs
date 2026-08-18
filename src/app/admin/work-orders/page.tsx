import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  PlayCircle,
  ReceiptText,
  UserRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type WorkOrder = {
  id: number;
  booking_id: number | null;
  customer_id: number | null;
  lead_id: number | null;
  assigned_to: string | null;
  status: string;
  notes: string | null;
  ai_summary: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type Booking = {
  id: number;
  customer_name: string;
  service: string;
  city: string | null;
  booking_date: string;
  start_time: string;
  end_time: string | null;
};

type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
};

const statusStyles: Record<string, string> = {
  Planerad:
    "border-blue-400/20 bg-blue-400/10 text-blue-200",
  Pågår:
    "border-amber-400/20 bg-amber-400/10 text-amber-200",
  Utförd:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  Fakturerad:
    "border-purple-400/20 bg-purple-400/10 text-purple-200",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default async function WorkOrdersPage() {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return (
      <div>
        <h1 className="text-4xl font-bold text-white">
          Arbetsorder
        </h1>

        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">
          Supabase-inställningarna saknas.
        </div>
      </div>
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data: workOrdersData, error } = await supabase
    .from("work_orders")
    .select(
      `
        id,
        booking_id,
        customer_id,
        lead_id,
        assigned_to,
        status,
        notes,
        ai_summary,
        started_at,
        completed_at,
        created_at
      `,
    )
    .order("created_at", {
      ascending: false,
    });

  const workOrders = (workOrdersData ?? []) as WorkOrder[];

  const bookingIds = Array.from(
    new Set(
      workOrders
        .map((order) => order.booking_id)
        .filter((id): id is number => id !== null),
    ),
  );

  const customerIds = Array.from(
    new Set(
      workOrders
        .map((order) => order.customer_id)
        .filter((id): id is number => id !== null),
    ),
  );

  let bookings: Booking[] = [];
  let customers: Customer[] = [];

  if (bookingIds.length > 0) {
    const { data } = await supabase
      .from("bookings")
      .select(
        `
          id,
          customer_name,
          service,
          city,
          booking_date,
          start_time,
          end_time
        `,
      )
      .in("id", bookingIds);

    bookings = (data ?? []) as Booking[];
  }

  if (customerIds.length > 0) {
    const { data } = await supabase
      .from("customers")
      .select(
        `
          id,
          name,
          email,
          phone,
          city
        `,
      )
      .in("id", customerIds);

    customers = (data ?? []) as Customer[];
  }

  const bookingById = new Map(
    bookings.map((booking) => [booking.id, booking]),
  );

  const customerById = new Map(
    customers.map((customer) => [customer.id, customer]),
  );

  const plannedCount = workOrders.filter(
    (order) => order.status === "Planerad",
  ).length;

  const activeCount = workOrders.filter(
    (order) => order.status === "Pågår",
  ).length;

  const completedCount = workOrders.filter(
    (order) => order.status === "Utförd",
  ).length;

  const invoicedCount = workOrders.filter(
    (order) => order.status === "Fakturerad",
  ).length;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-500/[0.1] via-white/[0.04] to-blue-500/[0.08] p-6 shadow-2xl shadow-purple-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
                Drift
              </p>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Arbetsorder
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Hantera planerade jobb, pågående uppdrag och slutförda
              arbetsorder.
            </p>
          </div>

          <Link
            href="/admin/calendar"
            className="inline-flex w-fit items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <CalendarDays className="h-4 w-4" />
            Öppna kalender
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">
          {error.message}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-blue-400/15 bg-blue-400/[0.06] p-6">
              <p className="text-sm text-blue-200">
                Planerade
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {plannedCount}
              </p>
            </article>

            <article className="rounded-3xl border border-amber-400/15 bg-amber-400/[0.06] p-6">
              <p className="text-sm text-amber-200">
                Pågår
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {activeCount}
              </p>
            </article>

            <article className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.06] p-6">
              <p className="text-sm text-emerald-200">
                Utförda
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {completedCount}
              </p>
            </article>

            <article className="rounded-3xl border border-purple-400/15 bg-purple-400/[0.06] p-6">
              <p className="text-sm text-purple-200">
                Fakturerade
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {invoicedCount}
              </p>
            </article>
          </section>

          {workOrders.length === 0 ? (
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-16 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-slate-500" />

              <h2 className="mt-5 text-xl font-semibold text-white">
                Inga arbetsorder ännu
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
                Nästa steg blir att skapa en arbetsorder från en
                bokning i kalendern.
              </p>

              <Link
                href="/admin/calendar"
                className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Gå till kalendern
              </Link>
            </section>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {workOrders.map((order) => {
                const booking = order.booking_id
                  ? bookingById.get(order.booking_id)
                  : undefined;

                const customer = order.customer_id
                  ? customerById.get(order.customer_id)
                  : undefined;

                const customerName =
                  customer?.name ??
                  booking?.customer_name ??
                  "Okänd kund";

                return (
                  <article
                    key={order.id}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-purple-400/25 hover:bg-white/[0.06]"
                  >
                    <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl" />

                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Arbetsorder #{order.id}
                          </p>

                          <h2 className="mt-2 text-xl font-semibold text-white">
                            {customerName}
                          </h2>
                        </div>

                        <span
                          className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                            statusStyles[order.status] ??
                            "border-white/10 bg-white/5 text-slate-300"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/15 p-4">
                        <div className="flex items-center gap-3">
                          <ClipboardList className="h-4 w-4 text-purple-300" />

                          <span className="text-sm text-slate-300">
                            {booking?.service ?? "Tjänst saknas"}
                          </span>
                        </div>

                        {booking && (
                          <div className="flex items-center gap-3">
                            <Clock3 className="h-4 w-4 text-blue-300" />

                            <span className="capitalize text-sm text-slate-300">
                              {formatDate(booking.booking_date)}
                              {" · "}
                              {formatTime(booking.start_time)}
                              {booking.end_time
                                ? `–${formatTime(
                                    booking.end_time,
                                  )}`
                                : ""}
                            </span>
                          </div>
                        )}

                        {(booking?.city || customer?.city) && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-emerald-300" />

                            <span className="text-sm text-slate-300">
                              {booking?.city ?? customer?.city}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <UserRound className="h-4 w-4 text-amber-300" />

                          <span className="text-sm text-slate-300">
                            {order.assigned_to ||
                              "Ingen personal tilldelad"}
                          </span>
                        </div>
                      </div>

                      {order.notes && (
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
                          {order.notes}
                        </p>
                      )}

                      <div className="mt-6 flex gap-2">
                        <Link
                          href={`/admin/work-orders/${order.id}`}
                          className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                          Öppna
                        </Link>

                        {order.status === "Planerad" && (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-amber-200"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </button>
                        )}

                        {order.status === "Utförd" && (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10 px-4 py-2.5 text-purple-200"
                          >
                            <ReceiptText className="h-4 w-4" />
                          </button>
                        )}

                        {order.status === "Pågår" && (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-emerald-200"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
}