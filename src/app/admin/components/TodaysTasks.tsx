import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileWarning,
  Flame,
  UsersRound,
} from "lucide-react";

type Props = {
  newLeads: number;
  overdueInvoices: number;
  overdueInvoiceAmount: number;
  jobsToday: number;
  completedToday: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TodaysTasks({
  newLeads,
  overdueInvoices,
  overdueInvoiceAmount,
  jobsToday,
  completedToday,
}: Props) {
  const hasTasks =
    newLeads > 0 ||
    overdueInvoices > 0 ||
    jobsToday > 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-red-950/25">
          <Flame className="h-6 w-6 text-white" />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
            Dagens prioriteringar
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Att göra idag
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            En snabb överblick över uppgifter som behöver din
            uppmärksamhet.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-blue-400/15 bg-blue-400/[0.06] p-5">
          <div className="flex items-center justify-between gap-3">
            <UsersRound className="h-5 w-5 text-blue-300" />

            <span className="text-2xl font-bold text-white">
              {newLeads}
            </span>
          </div>

          <p className="mt-4 font-semibold text-blue-100">
            Nya leads
          </p>

          <p className="mt-1 text-sm text-blue-100/55">
            Väntar på första kontakt.
          </p>
        </article>

        <article className="rounded-2xl border border-red-400/15 bg-red-400/[0.06] p-5">
          <div className="flex items-center justify-between gap-3">
            <FileWarning className="h-5 w-5 text-red-300" />

            <span className="text-2xl font-bold text-white">
              {overdueInvoices}
            </span>
          </div>

          <p className="mt-4 font-semibold text-red-100">
            Förfallna fakturor
          </p>

          <p className="mt-1 text-sm text-red-100/55">
            {formatCurrency(overdueInvoiceAmount)} utestående.
          </p>
        </article>

        <article className="rounded-2xl border border-purple-400/15 bg-purple-400/[0.06] p-5">
          <div className="flex items-center justify-between gap-3">
            <BriefcaseBusiness className="h-5 w-5 text-purple-300" />

            <span className="text-2xl font-bold text-white">
              {jobsToday}
            </span>
          </div>

          <p className="mt-4 font-semibold text-purple-100">
            Jobb idag
          </p>

          <p className="mt-1 text-sm text-purple-100/55">
            Bokningar med dagens datum.
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-5">
          <div className="flex items-center justify-between gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />

            <span className="text-2xl font-bold text-white">
              {completedToday}
            </span>
          </div>

          <p className="mt-4 font-semibold text-emerald-100">
            Klara idag
          </p>

          <p className="mt-1 text-sm text-emerald-100/55">
            Slutförda arbetsorder idag.
          </p>
        </article>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/leads"
          className="inline-flex items-center rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-400/20"
        >
          Kontakta leads
        </Link>

        <Link
          href="/admin/invoices"
          className="inline-flex items-center rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-400/20"
        >
          Öppna fakturor
        </Link>

        <Link
          href="/admin/work-orders"
          className="inline-flex items-center rounded-xl border border-purple-400/20 bg-purple-400/10 px-4 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-purple-400/20"
        >
          Visa dagens jobb
        </Link>
      </div>

      {!hasTasks && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4 text-sm text-emerald-100">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Inga akuta uppgifter behöver hanteras just nu.
        </div>
      )}
    </section>
  );
}