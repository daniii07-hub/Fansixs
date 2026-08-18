"use client";

type Props = {
  totalResults: number;
  failedResults: number;
};

export default function OptimizerFooter({
  totalResults,
  failedResults,
}: Props) {
  return (
    <footer className="flex flex-col gap-2 border-t border-white/[0.06] bg-[#0d1322] px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        {totalResults} optimeringsresultat analyserade
      </span>

      <span>
        {failedResults > 0
          ? `${failedResults} körningar utan förbättring`
          : "Alla körningar analyserades utan fel"}
      </span>
    </footer>
  );
}