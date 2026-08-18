import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  UserRound,
} from "lucide-react";
import {
  calculateInvoiceItemSubtotal,
  calculateInvoiceItemVat,
  formatCurrency,
  formatInvoiceDate,
  formatInvoiceDateTime,
} from "./formatters";
import { getInvoiceDetails } from "./queries";
import InvoiceItems from "./components/InvoiceItems";
import SendInvoiceButton from "./components/SendInvoiceButton";
import InvoiceStatusButtons from "./components/InvoiceStatusButtons";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const statusClasses: Record<string, string> = {
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/10 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="font-medium text-white">
        {value || "Ej angivet"}
      </span>
    </div>
  );
}

export default async function InvoiceDetailsPage({
  params,
}: Props) {
  const { id } = await params;
  const invoiceId = Number(id);

  if (
    !Number.isInteger(invoiceId) ||
    invoiceId <= 0
  ) {
    notFound();
  }

  const details =
    await getInvoiceDetails(invoiceId);

  if (!details) {
    notFound();
  }

  const { invoice, items } = details;

  const calculatedSubtotal = items.reduce(
    (sum, item) =>
      sum +
      calculateInvoiceItemSubtotal({
        quantity: item.quantity,
        unit_price: item.unit_price,
      }),
    0,
  );

  const calculatedVat = items.reduce(
    (sum, item) =>
      sum +
      calculateInvoiceItemVat({
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
      }),
    0,
  );

  const calculatedTotal =
    calculatedSubtotal +
    calculatedVat -
    invoice.deduction_amount;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-2 text-sm font-medium text-purple-300 transition hover:text-purple-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till fakturor
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/[0.08] via-white/[0.04] to-blue-500/[0.08] p-6 shadow-2xl shadow-emerald-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg shadow-emerald-950/30">
                <ReceiptText className="h-6 w-6 text-white" />
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                Faktura
              </p>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {invoice.invoice_number
                ? `Faktura ${invoice.invoice_number}`
                : `Fakturautkast #${invoice.id}`}
            </h1>

            <p className="mt-4 text-base text-slate-300">
              {invoice.customer_name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Ladda ner PDF
            </a>

            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
            >
              <ExternalLink className="h-4 w-4" />
              Öppna PDF
            </a>

            <SendInvoiceButton
              invoiceId={invoice.id}
              customerEmail={invoice.customer_email}
            />

            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${
                statusClasses[invoice.status] ??
                "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-purple-300" />

            <h2 className="text-xl font-semibold text-white">
              Kunduppgifter
            </h2>
          </div>

          <div className="mt-5">
            <InfoRow
              label="Kund"
              value={invoice.customer_name}
            />

            <InfoRow
              label="E-post"
              value={invoice.customer_email ?? ""}
            />

            <InfoRow
              label="Telefon"
              value={invoice.customer_phone ?? ""}
            />

            <InfoRow
              label="Ort"
              value={invoice.customer_city ?? ""}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {invoice.customer_email && (
              <a
                href={`mailto:${invoice.customer_email}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] hover:text-white"
              >
                <Mail className="h-4 w-4" />
                Maila kund
              </a>
            )}

            {invoice.customer_phone && (
              <a
                href={`tel:${invoice.customer_phone}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] hover:text-white"
              >
                <Phone className="h-4 w-4" />
                Ring kund
              </a>
            )}

            {invoice.customer_city && (
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-4 py-2.5 text-sm text-slate-400">
                <MapPin className="h-4 w-4" />
                {invoice.customer_city}
              </span>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-blue-300" />

            <h2 className="text-xl font-semibold text-white">
              Fakturainformation
            </h2>
          </div>

          <div className="mt-5">
            <InfoRow
              label="Fakturadatum"
              value={formatInvoiceDate(
                invoice.invoice_date,
              )}
            />

            <InfoRow
              label="Förfallodatum"
              value={formatInvoiceDate(
                invoice.due_date,
              )}
            />

            <InfoRow
              label="Skapad"
              value={formatInvoiceDateTime(
                invoice.created_at,
              )}
            />

            <InfoRow
              label="Senast uppdaterad"
              value={formatInvoiceDateTime(
                invoice.updated_at,
              )}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {invoice.work_order_id && (
              <Link
                href={`/admin/work-orders/${invoice.work_order_id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] hover:text-white"
              >
                <FileText className="h-4 w-4" />
                Öppna arbetsorder
              </Link>
            )}

            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-4 py-2.5 text-sm text-slate-400">
              <Hash className="h-4 w-4" />
              ID {invoice.id}
            </span>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 px-6 py-5 sm:px-8">
          <h2 className="text-xl font-semibold text-white">
            Fakturarader
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Raderna som ingår i fakturautkastet.
          </p>
        </div>

        <InvoiceItems
          invoiceId={invoice.id}
          items={items}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">
        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">
            Anteckningar
          </h2>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {invoice.notes ||
                "Inga anteckningar har lagts till."}
            </p>
          </div>
        </article>

        <aside className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.05] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">
            Summering
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">
                Delsumma
              </span>

              <span className="font-medium text-white">
                {formatCurrency(calculatedSubtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">
                Moms
              </span>

              <span className="font-medium text-white">
                {formatCurrency(calculatedVat)}
              </span>
            </div>

            {invoice.deduction_type && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">
                  {invoice.deduction_type}-avdrag
                </span>

                <span className="font-medium text-emerald-200">
                  −{formatCurrency(
                    invoice.deduction_amount,
                  )}
                </span>
              </div>
            )}

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-white">
                  Totalt
                </span>

                <span className="text-2xl font-bold text-white">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </section>
      <InvoiceStatusButtons
        invoiceId={invoice.id}
        currentStatus={invoice.status}
      />

    </div>
  );
}