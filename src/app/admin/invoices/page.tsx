import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ReceiptText } from "lucide-react";
import { getInvoices } from "./queries";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    createFrom?: string;
  }>;
};

const statusClasses: Record<string, string> = {
  Utkast:
    "border-slate-500/20 bg-slate-500/10 text-slate-200",
  Godkänd:
    "border-blue-500/20 bg-blue-500/10 text-blue-200",
  Skickad:
    "border-amber-500/20 bg-amber-500/10 text-amber-200",
  Betald:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  Förfallen:
    "border-red-500/20 bg-red-500/10 text-red-200",
};

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 2,
  }).format(value);
}

async function createDraft(workOrderId: number) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/invoices/create-from-work-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workOrderId,
      }),
      cache: "no-store",
    },
  );

  const responseText = await response.text();

  let data: {
    invoiceId?: number;
    message?: string;
  } = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText) as {
        invoiceId?: number;
        message?: string;
      };
    } catch {
      throw new Error(
        "Servern returnerade ett ogiltigt svar.",
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Kunde inte skapa fakturautkast.",
    );
  }

  return data.invoiceId ?? null;
}

export default async function InvoicesPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  if (params.createFrom) {
    const workOrderId = Number(params.createFrom);

    if (
      Number.isInteger(workOrderId) &&
      workOrderId > 0
    ) {
      const invoiceId =
        await createDraft(workOrderId);

      if (invoiceId) {
        redirect(`/admin/invoices/${invoiceId}`);
      }

      redirect("/admin/invoices");
    }
  }

  let invoices;

  try {
    invoices = await getInvoices();
  } catch (error) {
    return (
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-400">
          Ekonomi
        </p>

        <h1 className="mt-3 text-4xl font-bold text-white">
          Fakturor
        </h1>

        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">
          {error instanceof Error
            ? error.message
            : "Fakturor kunde inte hämtas."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
                Ekonomi
              </p>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Fakturor
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Hantera fakturautkast, betalningar och kommande
              Fortnox-exporter.
            </p>
          </div>

          <Link
            href="/admin/work-orders"
            className="inline-flex w-fit items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Skapa från arbetsorder
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-semibold text-white">
            Alla fakturor
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Klicka på en faktura för att öppna den.
          </p>
        </div>

        {invoices.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-slate-600" />

            <p className="mt-4 font-medium text-white">
              Inga fakturor ännu
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Skapa ett fakturautkast från en arbetsorder.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {invoices.map((invoice) => (
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
                      : `Fakturautkast #${invoice.id}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-white">
                      {formatCurrency(
                        invoice.total_amount,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(
                        invoice.invoice_date,
                      )}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusClasses[invoice.status] ??
                      "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {invoice.status}
                  </span>

                  <ArrowRight className="h-5 w-5 text-slate-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}