import Link from "next/link";
import StatusSelect from "./StatusSelect";

export type Lead = {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  size: string;
  property_type: string;
  city: string;
  desired_date: string;
  frequency: string;
  status: string;
};

type Props = {
  leads: Lead[];
};

const statusStyles: Record<string, string> = {
  Ny: "border-blue-400/20 bg-blue-400/10 text-blue-200",
  Kontaktad:
    "border-amber-400/20 bg-amber-400/10 text-amber-200",
  Bokad:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  Avslutad:
    "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
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

export default function LeadTable({ leads }: Props) {
  if (leads.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl font-bold text-slate-300">
          0
        </div>

        <h2 className="mt-5 text-xl font-semibold text-white">
          Inga leads hittades
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
          Ändra sökningen eller invänta nästa offertförfrågan från
          AI-medarbetaren.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {leads.map((lead) => {
        const status = lead.status || "Ny";

        return (
          <article
            key={lead.id}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-purple-400/25 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-purple-950/20 sm:p-6"
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl transition group-hover:bg-purple-500/15" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-sm font-bold text-white shadow-lg shadow-purple-950/30">
                    {getInitials(lead.name) || "?"}
                  </div>

                  <div className="min-w-0">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="block truncate text-lg font-semibold text-white transition hover:text-purple-300"
                    >
                      {lead.name}
                    </Link>

                    <p className="mt-1 truncate text-sm text-slate-400">
                      {lead.city || "Ort saknas"}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusStyles[status] ??
                    "border-white/10 bg-white/5 text-slate-300"
                  }`}
                >
                  {status}
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Tjänst
                    </p>

                    <p className="mt-2 font-semibold text-white">
                      {lead.service || "Ej angivet"}
                    </p>
                  </div>

                  <span className="rounded-full border border-purple-400/15 bg-purple-400/10 px-3 py-1 text-xs font-medium text-purple-200">
                    {lead.desired_date || "Datum saknas"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                  <p className="text-xs text-slate-500">
                    Storlek
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-slate-200">
                    {lead.size || "Ej angivet"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                  <p className="text-xs text-slate-500">
                    Typ
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-slate-200">
                    {lead.property_type || "Ej angivet"}
                  </p>
                </div>
              </div>

              {lead.frequency && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                  <p className="text-xs text-slate-500">
                    Frekvens
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {lead.frequency}
                  </p>
                </div>
              )}

              <div className="mt-5 border-t border-white/10 pt-5">
                <div className="space-y-2 text-sm">
                  <a
                    href={`mailto:${lead.email}`}
                    className="block truncate text-blue-300 transition hover:text-blue-200 hover:underline"
                  >
                    {lead.email}
                  </a>

                  <a
                    href={`tel:${lead.phone}`}
                    className="block text-slate-300 transition hover:text-white"
                  >
                    {lead.phone}
                  </a>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Ändra status
                </p>

                <StatusSelect
                  leadId={lead.id}
                  currentStatus={status}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.09] hover:text-white"
                >
                  Ring
                </a>

                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.09] hover:text-white"
                >
                  Mejla
                </a>

                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Öppna
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-600">
                Inkommen {formatDate(lead.created_at)}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}