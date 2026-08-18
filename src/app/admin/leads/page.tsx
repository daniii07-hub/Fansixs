import LeadList from "@/components/admin/LeadList";
import { getLeads } from "./queries";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  try {
    const leads = await getLeads();

    return (
      <div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-400">
            CRM
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Leads
          </h1>

          <p className="mt-3 text-slate-400">
            Hantera inkomna offertförfrågningar.
          </p>
        </div>

        <div className="mt-8">
          <LeadList leads={leads} />
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-400">
            CRM
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Leads
          </h1>

          <p className="mt-3 text-slate-400">
            Hantera inkomna offertförfrågningar.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">
          {error instanceof Error
            ? error.message
            : "Leads kunde inte hämtas."}
        </div>
      </div>
    );
  }
}