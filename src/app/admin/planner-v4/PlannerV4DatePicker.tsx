"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

type Props = {
  value: string;
  onChange: (date: string) => void;
};

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function PlannerV4DatePicker({
  value,
  onChange,
}: Props) {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b1020] p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300">
            Datum
          </p>
          <h3 className="mt-1 text-xl font-semibold capitalize text-white">
            {formatted}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(shiftDate(value, -1))}
            className="rounded-xl border border-white/10 bg-white/5 p-3 text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
            <CalendarDays className="h-5 w-5 text-purple-300" />
            <input
              type="date"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="bg-transparent outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => onChange(shiftDate(value, 1))}
            className="rounded-xl border border-white/10 bg-white/5 p-3 text-white hover:bg-white/10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}