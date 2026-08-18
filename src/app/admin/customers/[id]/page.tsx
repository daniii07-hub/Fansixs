import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
};

type Lead = {
  id: number;
  created_at: string;
  service: string;
  city: string;
  status: string;
};

type Booking = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string | null;
  service: string;
  city: string | null;
  status: string;
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
  }).format(new Date(value));
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

export default async function CustomerDetailsPage({
  params,
}: Props) {
  const { id } = await params;
  const customerId = Number(id);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    notFound();
  }

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
          Kund
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

  const { data: customer, error: customerError } =
    await supabase
      .from("customers")
      .select(
        `
          id,
          name,
          email,
          phone,
          city,
          created_at
        `,
      )
      .eq("id", customerId)
      .single();

  if (customerError || !customer) {
    notFound();
  }

  const { data: leadsData } = await supabase
    .from("leads")
    .select(
      `
        id,
        created_at,
        service,
        city,
        status
      `,
    )
    .eq("customer_id", customerId)
    .order("created_at", {
      ascending: false,
    });

  const leads = (leadsData ?? []) as Lead[];

  const leadIds = leads.map((lead) => lead.id);

  let bookings: Booking[] = [];

  if (leadIds.length > 0) {
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select(
        `
          id,
          booking_date,
          start_time,
          end_time,
          service,
          city,
          status
        `,
      )
      .in("lead_id", leadIds)
      .order("booking_date", {
        ascending: true,
      })
      .order("start_time", {
        ascending: true,
      });

    bookings = (bookingsData ?? []) as Booking[];
  }

  const typedCustomer = customer as Customer;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-500/[0.1] via-white/[0.04] to-blue-500/[0.08] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative">
          <Link
            href="/admin/customers"
            className="text-sm font-medium text-purple-300 transition hover:text-purple-200"
          >
            ← Tillbaka till kunder
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600">
              <UserRound className="h-8 w-8 text-white" />
            </div>

            <div>
              <h1 className="text-4xl font-bold text-white">
                {typedCustomer.name}
              </h1>

              <p className="mt-2 text-slate-400">
                Kund sedan {formatDate(typedCustomer.created_at)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">
            Kontaktuppgifter
          </h2>

          <div className="mt-5 space-y-3">
            {typedCustomer.email && (
              <a
                href={`mailto:${typedCustomer.email}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-blue-300"
              >
                <Mail className="h-5 w-5" />
                <span className="truncate">
                  {typedCustomer.email}
                </span>
              </a>
            )}

            {typedCustomer.phone && (
              <a
                href={`tel:${typedCustomer.phone}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-slate-300"
              >
                <Phone className="h-5 w-5" />
                <span>{typedCustomer.phone}</span>
              </a>
            )}

            {typedCustomer.city && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-slate-300">
                <MapPin className="h-5 w-5" />
                <span>{typedCustomer.city}</span>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">
            Översikt
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-sm text-slate-400">
                Leads
              </p>

              <p className="mt-2 text-3xl font-bold text-white">
                {leads.length}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-400/15 bg-blue-400/[0.06] p-4">
              <p className="text-sm text-blue-200">
                Bokningar
              </p>

              <p className="mt-2 text-3xl font-bold text-white">
                {bookings.length}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
              <p className="text-sm text-emerald-200">
                Bokade leads
              </p>

              <p className="mt-2 text-3xl font-bold text-white">
                {
                  leads.filter(
                    (lead) => lead.status === "Bokad",
                  ).length
                }
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-xl font-semibold text-white">
              Lead-historik
            </h2>
          </div>

          {leads.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              Inga leads kopplade till kunden.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="block px-6 py-5 transition hover:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">
                        {lead.service}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {lead.city} · {formatDate(lead.created_at)}
                      </p>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">
                      {lead.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-blue-300" />

              <h2 className="text-xl font-semibold text-white">
                Bokningar
              </h2>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              Inga bokningar kopplade till kunden.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="px-6 py-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">
                        {booking.service}
                      </p>

                      <p className="mt-1 capitalize text-sm text-slate-400">
                        {formatBookingDate(booking.booking_date)}
                        {" · "}
                        {formatTime(booking.start_time)}
                        {booking.end_time
                          ? `–${formatTime(booking.end_time)}`
                          : ""}
                      </p>

                      {booking.city && (
                        <p className="mt-1 text-sm text-slate-500">
                          {booking.city}
                        </p>
                      )}
                    </div>

                    <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}