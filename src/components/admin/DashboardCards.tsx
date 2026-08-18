type Props = {
  total: number;
  latestService?: string;
  latestCity?: string;
};

export default function DashboardCards({
  total,
  latestService,
  latestCity,
}: Props) {
  return (
    <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-slate-400">
          Totalt antal leads
        </p>

        <p className="mt-3 text-4xl font-bold text-white">
          {total}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-slate-400">
          Senaste tjänsten
        </p>

        <p className="mt-3 text-xl font-semibold text-white">
          {latestService ?? "Ingen ännu"}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-slate-400">
          Senaste orten
        </p>

        <p className="mt-3 text-xl font-semibold text-white">
          {latestCity ?? "Ingen ännu"}
        </p>
      </div>
    </section>
  );
}