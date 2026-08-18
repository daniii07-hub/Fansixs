import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import NewBookingForm from "@/components/admin/NewBookingForm";

export const dynamic = "force-dynamic";

type Booking = {
  id: number;
  lead_id: number | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service: string;
  city: string | null;
  booking_date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const statusStyles: Record<string, string> = {
  Bekräftad:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  Väntar:
    "border-amber-400/20 bg-amber-400/10 text-amber-200",
  Avbokad:
    "border-red-400/20 bg-red-400/10 text-red-200",
  Utförd:
    "border-blue-400/20 bg-blue-400/10 text-blue-200",
};

function getTodayInStockholm() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatBookingDate(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default async function CalendarPage() {
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
          Kalender
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

  const today = getTodayInStockholm();
  const weekEnd = addDays(today, 6);

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
        id,
        lead_id,
        customer_name,
        customer_email,
        customer_phone,
        service,
        city,
        booking_date,
        start_time,
        end_time,
        status,
        notes,
        created_at
      `,
    )
    .gte("booking_date", today)
    .order("booking_date", {
      ascending: true,
    })
    .order("start_time", {
      ascending: true,
    });

  const bookings = (data ?? []) as Booking[];

  const todayBookings = bookings.filter(
    (booking) => booking.booking_date === today,
  );

  const weekBookings = bookings.filter(
    (booking) =>
      booking.booking_date >= today &&
      booking.booking_date <= weekEnd,
  );

  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "Bekräftad",
  ).length;

  const waitingBookings = bookings.filter(
    (booking) => booking.status === "Väntar",
  ).length;

  const upcomingDays = Array.from(
    new Set(
      bookings
        .filter((booking) => booking.booking_date > today)
        .map((booking) => booking.booking_date),
    ),
  )
    .slice(0, 5)
    .map((date) => ({
      date,
      jobs: bookings.filter(
        (booking) => booking.booking_date === date,
      ).length,
    }));

  const nextWaitingBooking = bookings.find(
    (booking) => booking.status === "Väntar",
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/[0.1] via-white/[0.04] to-purple-500/[0.08] p-6 shadow-2xl shadow-blue-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-950/30">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-300">
                Kalender
              </p>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Bokningar och jobb
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Se dagens arbete, kommande bokningar och vad som behöver
              bekräftas.
            </p>
          </div>

          <a
            href="#new-booking"
            className="inline-flex w-fit items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Ny bokning
          </a>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">
          {error.message}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
              <p className="text-sm text-slate-400">
                Dagens jobb
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {todayBookings.length}
              </p>
            </article>

            <article className="rounded-3xl border border-blue-400/15 bg-blue-400/[0.06] p-6">
              <p className="text-sm text-blue-200">
                Kommande 7 dagar
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {weekBookings.length}
              </p>
            </article>

            <article className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.06] p-6">
              <p className="text-sm text-emerald-200">
                Bekräftade
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {confirmedBookings}
              </p>
            </article>

            <article className="rounded-3xl border border-amber-400/15 bg-amber-400/[0.06] p-6">
              <p className="text-sm text-amber-200">
                Väntar
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {waitingBookings}
              </p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
              <div className="border-b border-white/10 px-6 py-5">
                <h2 className="text-xl font-semibold text-white">
                  Dagens schema
                </h2>

                <p className="mt-1 capitalize text-sm text-slate-400">
                  {formatBookingDate(today)}
                </p>
              </div>

              {todayBookings.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-lg font-semibold text-white">
                    Inga jobb bokade idag
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    Skapa en ny bokning i formuläret längre ner.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {todayBookings.map((booking) => (
                    <article
                      key={booking.id}
                      className="flex flex-col gap-5 px-6 py-5 transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                          <Clock3 className="h-5 w-5 text-purple-300" />
                        </div>

                        <div>
                          <p className="text-lg font-semibold text-white">
                            {formatTime(booking.start_time)}
                            {booking.end_time
                              ? `–${formatTime(booking.end_time)}`
                              : ""}
                          </p>

                          <p className="mt-1 font-medium text-slate-200">
                            {booking.customer_name}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
                            <span>{booking.service}</span>

                            {booking.city && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {booking.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            statusStyles[booking.status] ??
                            "border-white/10 bg-white/5 text-slate-300"
                          }`}
                        >
                          {booking.status}
                        </span>

                        {booking.lead_id && (
                          <Link
                            href={`/admin/leads/${booking.lead_id}`}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            Öppna lead
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-purple-400/15 bg-purple-400/[0.05] p-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-purple-300" />

                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-300">
                    AI-insikt
                  </p>
                </div>

                <h2 className="mt-4 text-2xl font-semibold text-white">
                  Dagens rekommendation
                </h2>

                <p className="mt-4 leading-7 text-slate-300">
                  {nextWaitingBooking
                    ? `Bekräfta bokningen för ${nextWaitingBooking.customer_name} den ${formatBookingDate(
                        nextWaitingBooking.booking_date,
                      )} kl. ${formatTime(
                        nextWaitingBooking.start_time,
                      )}.`
                    : "Alla kommande bokningar är hanterade. Följ upp dagens jobb när de är utförda."}
                </p>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-300" />

                  <h2 className="text-lg font-semibold text-white">
                    Kommande dagar
                  </h2>
                </div>

                {upcomingDays.length === 0 ? (
                  <p className="mt-5 text-sm leading-6 text-slate-400">
                    Inga kommande bokningar finns ännu.
                  </p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {upcomingDays.map((day) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 p-4"
                      >
                        <div>
                          <p className="capitalize font-medium text-white">
                            {formatBookingDate(day.date)}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {day.jobs} {day.jobs === 1 ? "jobb" : "jobb"}
                          </p>
                        </div>

                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  href="/admin/leads"
                  className="mt-5 inline-flex text-sm font-semibold text-purple-300 transition hover:text-purple-200"
                >
                  Skapa bokning från lead →
                </Link>
              </section>
            </aside>
          </section>

          <div id="new-booking">
            <NewBookingForm />
          </div>
        </>
      )}
    </div>
  );
}