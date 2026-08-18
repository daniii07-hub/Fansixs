import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  FileDown,
  Receipt,
  UserRound,
} from "lucide-react";
import WorkOrderHeader from "@/components/admin/work-orders/WorkOrderHeader";
import StatusButtons from "@/components/admin/work-orders/StatusButtons";
import AIWorkReport from "@/components/admin/work-orders/AIWorkReport";
import PhotoUpload from "@/components/admin/work-orders/PhotoUpload";
import Checklist from "@/components/admin/work-orders/Checklist";
import SignaturePad from "@/components/admin/work-orders/signature/SignaturePad";
import {
  formatBookingDate,
  formatDateTime,
  formatTime,
} from "./formatters";
import { getWorkOrderDetails } from "./queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
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

export default async function WorkOrderDetailsPage({
  params,
}: Props) {
  const { id } = await params;
  const workOrderId = Number(id);

  if (
    !Number.isInteger(workOrderId) ||
    workOrderId <= 0
  ) {
    notFound();
  }

  const details =
    await getWorkOrderDetails(workOrderId);

  if (!details) {
    notFound();
  }

  const {
    workOrder,
    booking,
    customer,
    lead,
    savedImageUrls,
  } = details;

  const customerName =
    customer?.name ??
    booking.customer_name ??
    "Okänd kund";

  const customerPhone =
    customer?.phone ??
    booking.customer_phone ??
    null;

  const customerEmail =
    customer?.email ??
    booking.customer_email ??
    null;

  const service =
    booking.service ??
    lead?.service ??
    "Tjänst saknas";

  const city =
    booking.city ??
    customer?.city ??
    lead?.city ??
    "";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/work-orders"
          className="text-sm font-medium text-purple-300 transition hover:text-purple-200"
        >
          ← Tillbaka till arbetsorder
        </Link>
      </div>

      <WorkOrderHeader
        id={workOrder.id}
        customerName={customerName}
        customerPhone={customerPhone}
        customerEmail={customerEmail}
        service={service}
        bookingDate={booking.booking_date}
        startTime={booking.start_time}
        endTime={booking.end_time}
        status={workOrder.status}
        customerId={
          customer?.id ??
          workOrder.customer_id
        }
      />

      <section className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
            Arbetsflöde
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            Uppdatera arbetsordern
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Starta jobbet, markera det som utfört och
            gör det sedan klart för fakturering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/api/work-orders/${workOrder.id}/pdf`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
          >
            <FileDown className="h-4 w-4" />
            Ladda ner arbetsrapport
          </Link>

          <Link
            href={`/admin/invoices?createFrom=${workOrder.id}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Receipt className="h-4 w-4" />
            Skapa fakturautkast
          </Link>

          <StatusButtons
            workOrderId={workOrder.id}
            currentStatus={workOrder.status}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-purple-300" />

            <h2 className="text-xl font-semibold text-white">
              Kund och uppdrag
            </h2>
          </div>

          <div className="mt-5">
            <InfoRow
              label="Kund"
              value={customerName}
            />

            <InfoRow
              label="Tjänst"
              value={service}
            />

            <InfoRow
              label="Ort"
              value={city}
            />

            <InfoRow
              label="Ansvarig"
              value={
                workOrder.assigned_to ||
                "Ingen personal tilldelad"
              }
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {workOrder.lead_id && (
              <Link
                href={`/admin/leads/${workOrder.lead_id}`}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] hover:text-white"
              >
                Öppna lead
              </Link>
            )}

            {customer?.id && (
              <Link
                href={`/admin/customers/${customer.id}`}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] hover:text-white"
              >
                Öppna kundkort
              </Link>
            )}

            <Link
              href="/admin/calendar"
              className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Öppna kalender
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-blue-300" />

            <h2 className="text-xl font-semibold text-white">
              Bokningsinformation
            </h2>
          </div>

          <div className="mt-5">
            <InfoRow
              label="Datum"
              value={formatBookingDate(
                booking.booking_date,
              )}
            />

            <InfoRow
              label="Tid"
              value={`${formatTime(
                booking.start_time,
              )}${
                booking.end_time
                  ? `–${formatTime(
                      booking.end_time,
                    )}`
                  : ""
              }`}
            />

            <InfoRow
              label="Bokningsstatus"
              value={booking.status}
            />

            <InfoRow
              label="Arbetsorder skapad"
              value={formatDateTime(
                workOrder.created_at,
              )}
            />
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-purple-400/15 bg-purple-400/[0.05] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-purple-300" />

            <h2 className="text-xl font-semibold text-white">
              AI-sammanfattning
            </h2>
          </div>

          {workOrder.ai_summary ? (
            <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-300">
              {workOrder.ai_summary}
            </p>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm leading-6 text-slate-400">
              Ingen AI-sammanfattning finns ännu.
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">
            Anteckningar
          </h2>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {workOrder.notes ||
                booking.notes ||
                "Inga anteckningar ännu."}
            </p>
          </div>
        </article>
      </section>

      <AIWorkReport
        workOrderId={workOrder.id}
      />

      <PhotoUpload
        workOrderId={workOrder.id}
        initialImages={savedImageUrls}
      />

      <Checklist
        workOrderId={workOrder.id}
      />

      <SignaturePad
        workOrderId={workOrder.id}
        initialSignature={
          workOrder.customer_signature
        }
        initialSignedAt={workOrder.signed_at}
      />

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white">
          Tidslinje
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
            <ClipboardList className="h-5 w-5 text-purple-300" />

            <p className="mt-4 text-sm text-slate-400">
              Arbetsorder skapad
            </p>

            <p className="mt-2 font-medium text-white">
              {formatDateTime(
                workOrder.created_at,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-5">
            <Clock3 className="h-5 w-5 text-amber-300" />

            <p className="mt-4 text-sm text-amber-100/70">
              Jobbet startades
            </p>

            <p className="mt-2 font-medium text-white">
              {formatDateTime(
                workOrder.started_at,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-5">
            <CalendarDays className="h-5 w-5 text-emerald-300" />

            <p className="mt-4 text-sm text-emerald-100/70">
              Jobbet slutfördes
            </p>

            <p className="mt-2 font-medium text-white">
              {formatDateTime(
                workOrder.completed_at,
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}