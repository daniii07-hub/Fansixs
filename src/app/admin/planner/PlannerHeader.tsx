"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

export type PlannerView =
  | "month"
  | "week"
  | "day";

type Props = {
  title: string;
  subtitle?: string;
  activeView: PlannerView;
  onViewChange: (
    view: PlannerView,
  ) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreate?: () => void;
};

const viewOptions: {
  value: PlannerView;
  label: string;
}[] = [
  {
    value: "month",
    label: "Månad",
  },
  {
    value: "week",
    label: "Vecka",
  },
  {
    value: "day",
    label: "Dag",
  },
];

export default function PlannerHeader({
  title,
  subtitle,
  activeView,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onCreate,
}: Props) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-purple-500/[0.08] p-6 shadow-2xl shadow-purple-950/20 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-950/30">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-300">
                Planner
              </p>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrevious}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
                aria-label="Föregående period"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={onToday}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] hover:text-white"
              >
                Idag
              </button>

              <button
                type="button"
                onClick={onNext}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
                aria-label="Nästa period"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.02] hover:opacity-95"
              >
                <Plus className="h-4 w-4" />
                Ny bokning
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-5">
          {viewOptions.map((option) => {
            const isActive =
              option.value === activeView;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onViewChange(option.value)
                }
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "border-purple-400/30 bg-purple-400/15 text-purple-100"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}