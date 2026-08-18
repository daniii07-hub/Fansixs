"use client";

import {
  CalendarDays,
  CalendarRange,
  Clock3,
  Columns3,
} from "lucide-react";

export type PlannerDisplayView =
  | "month"
  | "week"
  | "day"
  | "timeline";

type Props = {
  activeView: PlannerDisplayView;
  onViewChange: (
    view: PlannerDisplayView,
  ) => void;
};

const options: Array<{
  value: PlannerDisplayView;
  label: string;
  description: string;
  icon: typeof CalendarDays;
}> = [
  {
    value: "week",
    label: "Vecka",
    description: "Jobb per veckodag",
    icon: CalendarRange,
  },
  {
    value: "day",
    label: "Dag",
    description: "Detaljerad dagsplan",
    icon: CalendarDays,
  },
  {
    value: "month",
    label: "Månad",
    description: "Översikt över månaden",
    icon: Columns3,
  },
  {
    value: "timeline",
    label: "Tidslinje",
    description: "Tekniker och tider",
    icon: Clock3,
  },
];

export default function PlannerViewSwitcher({
  activeView,
  onViewChange,
}: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b1020] p-2 shadow-xl shadow-black/10">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive =
            activeView === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onViewChange(option.value)
              }
              className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-purple-400/30 bg-gradient-to-r from-purple-500/15 to-blue-500/10 text-white shadow-lg shadow-purple-950/20"
                  : "border-transparent bg-white/[0.025] text-slate-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                  isActive
                    ? "border-purple-400/25 bg-purple-400/15 text-purple-200"
                    : "border-white/10 bg-black/10 text-slate-500 group-hover:text-slate-300"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>

              <span className="min-w-0">
                <span className="block font-semibold">
                  {option.label}
                </span>

                <span
                  className={`mt-0.5 block truncate text-xs ${
                    isActive
                      ? "text-purple-100/65"
                      : "text-slate-600 group-hover:text-slate-500"
                  }`}
                >
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}