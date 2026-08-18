import Link from "next/link";
import {
  BriefcaseBusiness,
  FileWarning,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { formatDashboardDate } from "./formatters";
import { getDashboardData } from "../queries";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  Ny: "border-blue-400/20 bg-blue-400/10 text-blue-200",
  Kontaktad:
    "border-amber-400/20 bg-amber-400/10 text-amber-200",
  Bokad:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  Avslutad:
    "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

const invoiceStatusStyles: Record<string, string> = {
  Utkast:
    "border-slate-400/20 bg-slate-400/10 text-slate-200",
  Godkänd:
    "border-blue-400/20 bg-blue-400/10 text-blue-200",
  Skickad:
    "border-amber-400/20 bg-amber-400/10 text-amber-200",
  Betald:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  Förfallen:
    "border-red-400/20 bg-red-400/10 text-red-200",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  let dashboardData;

  try {
    dashboardData = await getDashboardData();
  } catch (error) {
    return (
      <div>
        <h1 className="text-4xl font-bold text-white">
          Dashboard
        </h1>

        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">
          {error instanceof Error
            ? error.message
            : "Dashboardens data kunde inte hämtas."}
        </div>
      </div>
    );
  }

  const {
    recentLeads,
    recentInvoices,
    stats: {
      newLeads,
    },
    businessStats: {
      revenueThisMonth,
      unpaidInvoiceCount,
      unpaidInvoiceAmount,
      newLeadsThisMonth,
      jobsToday,
    },
  } = dashboardData;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-purple-500/[0.08] p-6 shadow-2xl shadow-purple-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
              Fansixs CRM
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Välkommen tillbaka
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Här ser du företagets viktigaste siffror och vad
              som behöver din uppmärksamhet idag.
            </p>
          </div>

          <Link
            href="/admin/work-orders"
            className="inline-flex w-fit items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.02] hover:opacity-95"
          >
            Visa arbetsorder
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.06] p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-emerald-200">
              Omsättning denna månad
            </p>

            <ReceiptText className="h-5 w-5 text-emerald-300" />
          </div>

          <p className="mt-4 text-3xl font-bold text-white">
            {formatCurrency(revenueThisMonth)}
          </p>

          <p className="mt-2 text-xs text-emerald-100/50">
            Endast fakturor markerade som betalda
          </p>
        </article>

        <article className="rounded-3xl border border-red-400/15 bg-red-400/[0.06] p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-red-200">
              Obetalda fakturor
            </p>

            <FileWarning className="h-5 w-5 text-red-300" />
          </div>

          <p className="mt-4 text-3xl font-bold text-white">
            {unpaidInvoiceCount}
          </p>

          <p className="mt-2 text-xs text-red-100/50">
            {formatCurrency(unpaidInvoiceAmount)} utestående
          </p>
        </article>

        <article className="rounded-3xl border border-blue-400/15 bg-blue-400/[0.06] p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-blue-200">
              Nya leads denna månad
            </p>

            <UsersRound className="h-5 w-5 text-blue-300" />
          </div>

          <p className="mt-4 text-3xl font-bold text-white">
            {newLeadsThisMonth}
          </p>

          <p className="mt-2 text-xs text-blue-100/50">
            {newLeads} väntar på kontakt
          </p>
        </article>

        <article className="rounded-3xl border border-purple-400/15 bg-purple-400/[0.06] p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-purple-200">
              Jobb idag
            </p>

            <BriefcaseBusiness className="h-5 w-5 text-purple-300" />
          </div>

          <p className="mt-4 text-3xl font-bold text-white">
            {jobsToday}
          </p>

          <p className="mt-2 text-xs text-purple-100/50">
            Bokningar med dagens datum
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Senaste leads
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                De fem senaste förfrågningarna.
              </p>
            </div>

            <Link
              href="/admin/leads"
              className="text-sm font-medium text-purple-300 transition hover:text-purple-200"
            >
              Visa alla →
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-400">
              Inga leads ännu.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="flex flex-col gap-4 px-6 py-5 transition hover:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {lead.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {lead.service} · {lead.city}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        statusStyles[lead.status] ??
                        "border-white/10 bg-white/5 text-slate-300"
                      }`}
                    >
                      {lead.status || "Ny"}
                    </span>

                    <span className="text-xs text-slate-500">
                      {formatDashboardDate(
                        lead.created_at,
                      )}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Senaste fakturor
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                De fem senast skapade fakturorna.
              </p>
            </div>

            <Link
              href="/admin/invoices"
              className="text-sm font-medium text-purple-300 transition hover:text-purple-200"
            >
              Visa alla →
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-400">
              Inga fakturor ännu.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/admin/invoices/${invoice.id}`}
                  className="flex flex-col gap-4 px-6 py-5 transition hover:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {invoice.customer_name}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {invoice.invoice_number
                        ? `Faktura ${invoice.invoice_number}`
                        : `Utkast #${invoice.id}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-white">
                        {formatCurrency(
                          invoice.total_amount,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {invoice.invoice_date}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        invoiceStatusStyles[invoice.status] ??
                        "border-white/10 bg-white/5 text-slate-300"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-500/[0.09] to-blue-500/[0.04] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
          Dagens fokus
        </p>

        <h2 className="mt-3 text-2xl font-semibold text-white">
          Prioriterad sammanfattning
        </h2>

        <p className="mt-4 leading-7 text-slate-300">
          {unpaidInvoiceCount > 0
            ? `Du har ${unpaidInvoiceCount} obetalda fakturor på totalt ${formatCurrency(
                unpaidInvoiceAmount,
              )}. Kontrollera de förfallna fakturorna först.`
            : newLeads > 0
              ? `Du har ${newLeads} nya leads som väntar på kontakt. Börja där för att öka chansen till bokning.`
              : jobsToday > 0
                ? `Du har ${jobsToday} jobb idag. Kontrollera att alla arbetsorder är tilldelade och redo.`
                : "Inga akuta ekonomiska eller operativa uppgifter hittades just nu."}
        </p>
      </aside>
    </div>
  );
}
