import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Users,
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default async function CustomersPage() {
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
          Kunder
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

  const { data, error } = await supabase
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
    .order("created_at", {
      ascending: false,
    });

  const customers = (data ?? []) as Customer[];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-500/[0.1] via-white/[0.04] to-blue-500/[0.08] p-6 shadow-2xl shadow-purple-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-950/30">
              <Users className="h-6 w-6 text-white" />
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
              Kundregister
            </p>
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Kunder
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Se alla kunder och öppna deras historik, leads och bokningar.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">
          {error.message}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
              <p className="text-sm text-slate-400">
                Totalt antal kunder
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {customers.length}
              </p>
            </article>

            <article className="rounded-3xl border border-blue-400/15 bg-blue-400/[0.06] p-6">
              <p className="text-sm text-blue-200">
                Senaste kund
              </p>

              <p className="mt-3 text-xl font-semibold text-white">
                {customers[0]?.name || "Ingen ännu"}
              </p>
            </article>

            <article className="rounded-3xl border border-purple-400/15 bg-purple-400/[0.06] p-6">
              <p className="text-sm text-purple-200">
                Senaste ort
              </p>

              <p className="mt-3 text-xl font-semibold text-white">
                {customers[0]?.city || "Ingen ännu"}
              </p>
            </article>
          </section>

          {customers.length === 0 ? (
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-16 text-center">
              <UserRound className="mx-auto h-10 w-10 text-slate-500" />

              <h2 className="mt-5 text-xl font-semibold text-white">
                Inga kunder ännu
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                Kunder skapas från dina leads och visas här automatiskt.
              </p>
            </section>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {customers.map((customer) => (
                <article
                  key={customer.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-purple-400/25 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-purple-950/20"
                >
                  <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl transition group-hover:bg-purple-500/15" />

                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-sm font-bold text-white shadow-lg shadow-purple-950/30">
                        {getInitials(customer.name) || "?"}
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="block truncate text-lg font-semibold text-white transition hover:text-purple-300"
                        >
                          {customer.name}
                        </Link>

                        <p className="mt-1 text-xs text-slate-500">
                          Kund sedan {formatDate(customer.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {customer.email && (
                        <a
                          href={`mailto:${customer.email}`}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-3 text-sm text-blue-300 transition hover:bg-white/[0.04]"
                        >
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {customer.email}
                          </span>
                        </a>
                      )}

                      {customer.phone && (
                        <a
                          href={`tel:${customer.phone}`}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-3 text-sm text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
                        >
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{customer.phone}</span>
                        </a>
                      )}

                      {customer.city && (
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-3 text-sm text-slate-300">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>{customer.city}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex gap-2">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        Öppna kund
                      </Link>

                      <Link
                        href="/admin/leads"
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        <Building2 className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}