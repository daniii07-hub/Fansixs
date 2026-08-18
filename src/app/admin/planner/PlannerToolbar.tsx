"use client";

import { Funnel, Search, Users } from "lucide-react";

type Props = {
  technician?: string;
  search?: string;
  showCompleted: boolean;
  onTechnicianChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  onToggleCompleted: () => void;
};

export default function PlannerToolbar({
  technician = "",
  search = "",
  showCompleted,
  onTechnicianChange,
  onSearchChange,
  onToggleCompleted,
}: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) =>
              onSearchChange?.(e.target.value)
            }
            placeholder="Sök kund, adress eller tjänst..."
            className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500"
          />
        </div>

        <div className="relative min-w-[220px]">
          <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={technician}
            onChange={(e) =>
              onTechnicianChange?.(e.target.value)
            }
            placeholder="Filtrera tekniker..."
            className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500"
          />
        </div>

        <button
          type="button"
          onClick={onToggleCompleted}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
            showCompleted
              ? "border-purple-400/30 bg-purple-400/15 text-purple-100"
              : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
          }`}
        >
          <Funnel className="h-4 w-4" />
          {showCompleted
            ? "Visar slutförda"
            : "Dölj slutförda"}
        </button>
      </div>
    </section>
  );
}