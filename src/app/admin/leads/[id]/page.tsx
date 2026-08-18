import { createClient } from "@supabase/supabase-js";
import NewBookingForm from "@/components/admin/NewBookingForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusSelect from "@/components/admin/StatusSelect";
import AISummaryCard from "@/components/admin/AISummaryCard";
import AIOfferCard from "@/components/admin/AIOfferCard";

export const dynamic = "force-dynamic";

type Lead = {
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
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/10 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-400">{label}</span>

      <span className="font-medium text-white">
        {value || "Ej angivet"}
      </span>
    </div>
  );
}

export default async function LeadDetailsPage({
  params,
}: Props) {
  const { id } = await params;
  const leadId = Number(id);

  if (!Number.isInteger(leadId) || leadId <= 0) {
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
        <h1 className="text-4xl font-bold">Lead</h1>

        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">
          Supabase-inställningarna saknas i .env.local.
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
    .from("leads")
    .select(
      `
        id,
        created_at,
        name,
        phone,
        email,
        service,
        size,
        property_type,
        city,
        desired_date,
        frequency,
        status
      `,
    )
    .eq("id", leadId)
    .single();

  if (error || !data) {
    notFound();
  }

  const lead = data as Lead;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/leads"
            className="text-sm font-medium text-purple-300 transition hover:text-purple-200"
          >
            ← Tillbaka till leads
          </Link>

          <h1 className="mt-4 text-4xl font-bold">
            {lead.name}
          </h1>

          <p className="mt-3 text-slate-400">
            Lead #{lead.id} · Inkommen {formatDate(lead.created_at)}
          </p>
        </div>

        <StatusSelect
          leadId={lead.id}
          currentStatus={lead.status || "Ny"}
        />
      </div>

      <AISummaryCard leadId={lead.id} />

      <AIOfferCard leadId={lead.id} />

      <NewBookingForm
  leadId={lead.id}
  customerName={lead.name}
  customerEmail={lead.email}
  customerPhone={lead.phone}
  service={lead.service}
  city={lead.city}
/>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <h2 className="text-xl font-semibold">
            Kundinformation
          </h2>

          <div className="mt-5">
            <InfoRow label="Namn" value={lead.name} />
            <InfoRow label="Telefon" value={lead.phone} />
            <InfoRow label="E-post" value={lead.email} />
            <InfoRow label="Ort" value={lead.city} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`tel:${lead.phone}`}
              className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Ring kunden
            </a>

            <a
              href={`mailto:${lead.email}`}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
            >
              Skicka mejl
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <h2 className="text-xl font-semibold">
            Offertunderlag
          </h2>

          <div className="mt-5">
            <InfoRow label="Tjänst" value={lead.service} />
            <InfoRow label="Storlek" value={lead.size} />
            <InfoRow
              label="Typ"
              value={lead.property_type}
            />
            <InfoRow
              label="Önskat datum"
              value={lead.desired_date}
            />
            <InfoRow
              label="Frekvens"
              value={lead.frequency}
            />
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <h2 className="text-xl font-semibold">
          Anteckningar
        </h2>

        <p className="mt-3 text-sm text-slate-400">
          Nästa steg blir att spara anteckningar direkt på leadet.
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-slate-500">
          Inga anteckningar ännu.
        </div>
      </section>
    </div>
  );
}