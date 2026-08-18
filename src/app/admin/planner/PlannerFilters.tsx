"use client";

import {
  CheckCircle2,
  CircleDot,
  Clock3,
  Filter,
  RotateCcw,
} from "lucide-react";

export type PlannerStatusFilter =
  | "all"
  | "planned"
  | "active"
  | "completed";

type Props = {
  activeStatus: PlannerStatusFilter;
  onStatusChange: (
    status: PlannerStatusFilter,
  ) => void;
  onReset: () => void;
};

const options: Array<{
  value: PlannerStatusFilter;
  label: string;
  description: string;
  icon: typeof Filter;
  className: string;
}> = [
  {
    value: "all",
    label: "Alla jobb",
    description: "Visa hela planeringen.",
    icon: Filter,
    className:
      "border-purple-400/20 bg-purple-400/10 text-purple-100",
  },
  {
    value: "planned",
    label: "Planerade",
    description: "Jobb som ännu inte har startat.",
    icon: Clock3,
    className:
      "border-blue-400/20 bg-blue-400/10 text-blue-100",
  },
  {
    value: "active",
    label: "Pågående",
    description: "Jobb som utförs just nu.",
    icon: CircleDot,
    className:
      "border-amber-400/20 bg-amber-400/10 text-amber-100",
  },
  {
    value: "completed",
    label: "Slutförda",
    description: "Utförda eller fakturerade jobb.",
    icon: CheckCircle2,
    className:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  },
];

export default function PlannerFilters({
  activeStatus,
  onStatusChange,
  onReset,
}: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
            Filter
          </p>

          <h2 className="mt-1 text-lg font-semibold text-white">
            Jobbstatus
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Begränsa planeringen till en viss status.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Återställ filter
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive =
            option.value === activeStatus;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onStatusChange(option.value)
              }
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? `${option.className} ring-2 ring-white/10`
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
              }`}
            >
              <Icon className="h-5 w-5" />

              <p className="mt-4 font-semibold">
                {option.label}
              </p>

              <p className="mt-1 text-xs leading-5 opacity-65">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}