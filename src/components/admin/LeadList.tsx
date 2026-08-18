"use client";

import { useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import LeadTable, { Lead } from "./LeadTable";

type Props = {
  leads: Lead[];
};

export default function LeadList({ leads }: Props) {
  const [search, setSearch] = useState("");

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return leads;
    }

    return leads.filter((lead) => {
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.city.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.service.toLowerCase().includes(q)
      );
    });
  }, [leads, search]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <SearchBar
          value={search}
          onChange={setSearch}
        />

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            {filteredLeads.length} av {leads.length} leads visas
          </span>

          {search && (
            <button
              onClick={() => setSearch("")}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Rensa sökning
            </button>
          )}
        </div>
      </div>

      <LeadTable leads={filteredLeads} />
    </div>
  );
}