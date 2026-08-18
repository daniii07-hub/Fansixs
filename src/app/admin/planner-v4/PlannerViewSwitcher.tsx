"use client";

type ViewMode = "day" | "week";

type Props = {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
};

const options = [
  { id: "day", label: "Dag" },
  { id: "week", label: "Vecka" },
] as const;

export default function PlannerViewSwitcher({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-2xl border border-white/10 bg-[#0b1020] p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={
            value === option.id
              ? "rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
              : "rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
          }
        >
          {option.label}
        </button>
      ))}
      <button
        disabled
        className="cursor-not-allowed rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600"
      >
        Månad
      </button>
    </div>
  );
}