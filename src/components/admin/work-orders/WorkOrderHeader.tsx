import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

type Props = {
  id: number;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  service: string;
  bookingDate: string;
  startTime: string;
  endTime?: string | null;
  status: string;
  customerId?: number | null;
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
  }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function WorkOrderHeader({
  id,
  customerName,
  customerPhone,
  customerEmail,
  service,
  bookingDate,
  startTime,
  endTime,
  status,
  customerId,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-500/[0.08] via-white/[0.04] to-blue-500/[0.08] p-8">

      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">

        <div>

          <p className="text-sm uppercase tracking-[0.25em] text-purple-300">
            Arbetsorder #{id}
          </p>

          <h1 className="mt-3 text-4xl font-bold text-white">
            {customerName}
          </h1>

          <p className="mt-3 text-slate-300">
            {service}
          </p>

          <div className="mt-6 flex flex-wrap gap-5 text-sm text-slate-400">

            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatDate(bookingDate)}
            </span>

            <span className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              {formatTime(startTime)}
              {endTime ? ` - ${formatTime(endTime)}` : ""}
            </span>

          </div>

        </div>

        <div className="flex flex-col items-start gap-3 xl:items-end">

          <span
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              statusStyles[status] ??
              "border-white/10 bg-white/10 text-white"
            }`}
          >
            {status}
          </span>

          <div className="flex flex-wrap gap-3">

            {customerPhone && (
              <a
                href={`tel:${customerPhone}`}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                <Phone className="mr-2 inline h-4 w-4" />
                Ring
              </a>
            )}

            {customerEmail && (
              <a
                href={`mailto:${customerEmail}`}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                <Mail className="mr-2 inline h-4 w-4" />
                Mail
              </a>
            )}

            {customerId && (
              <Link
                href={`/admin/customers/${customerId}`}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <UserRound className="mr-2 inline h-4 w-4" />
                Öppna kund
              </Link>
            )}

          </div>

        </div>

      </div>

    </section>
  );
}