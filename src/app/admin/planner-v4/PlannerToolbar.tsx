"use client";

import {
  CalendarClock,
  RotateCcw,
} from "lucide-react";

import PlannerV4DatePicker from "./PlannerV4DatePicker";
import PlannerViewSwitcher from "./PlannerViewSwitcher";

type ViewMode =
  | "day"
  | "week";

type Props = {
  view: ViewMode;
  selectedDate: string;
  initialDate: string;
  onViewChange: (
    view: ViewMode,
  ) => void;
  onDateChange: (
    date: string,
  ) => void;
};

export default function PlannerToolbar({
  view,
  selectedDate,
  initialDate,
  onViewChange,
  onDateChange,
}: Props) {
  const isInitialDate =
    selectedDate ===
    initialDate;

  return (
    <section className="sticky top-3 z-30 rounded-2xl border border-white/[0.08] bg-[#0b1020]/90 p-3 shadow-xl shadow-black/15 backdrop-blur-xl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PlannerViewSwitcher
            value={view}
            onChange={
              onViewChange
            }
          />

          <div className="hidden h-7 w-px bg-white/[0.08] sm:block" />

          <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <CalendarClock className="h-4 w-4" />
            {view === "day"
              ? "Dagsvy"
              : "Veckovy"}
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            onDateChange(
              initialDate,
            )
          }
          disabled={
            isInitialDate
          }
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white disabled:cursor-default disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Gå till startdatum
        </button>
      </div>

      <div className="mt-3 border-t border-white/[0.06] pt-3">
        <PlannerV4DatePicker
          value={
            selectedDate
          }
          onChange={
            onDateChange
          }
        />
      </div>
    </section>
  );
}