"use client";

type MonthlyPoint = {
  label: string;
  value: number;
};

type StatusPoint = {
  label: string;
  value: number;
};

type Props = {
  revenueByMonth: MonthlyPoint[];
  leadsByMonth: MonthlyPoint[];
  invoiceStatus: StatusPoint[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

function getMaxValue(points: MonthlyPoint[]) {
  return Math.max(
    1,
    ...points.map((point) => point.value),
  );
}

function BarChart({
  title,
  description,
  points,
  valueFormatter,
}: {
  title: string;
  description: string;
  points: MonthlyPoint[];
  valueFormatter: (value: number) => string;
}) {
  const maxValue = getMaxValue(points);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
      <div>
        <h2 className="text-xl font-semibold text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {description}
        </p>
      </div>

      {points.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 py-12 text-center text-sm text-slate-400">
          Det finns ännu ingen data att visa.
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex h-64 items-end gap-3 overflow-x-auto pb-2">
            {points.map((point) => {
              const height = Math.max(
                4,
                (point.value / maxValue) * 100,
              );

              return (
                <div
                  key={point.label}
                  className="flex min-w-12 flex-1 flex-col items-center justify-end"
                >
                  <div className="mb-2 text-center text-[11px] font-medium text-slate-300">
                    {valueFormatter(point.value)}
                  </div>

                  <div className="flex h-48 w-full items-end rounded-2xl bg-white/[0.025] p-1">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-purple-600 to-blue-500 transition-all"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    {point.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function StatusChart({
  points,
}: {
  points: StatusPoint[];
}) {
  const total = points.reduce(
    (sum, point) => sum + point.value,
    0,
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
      <div>
        <h2 className="text-xl font-semibold text-white">
          Fakturastatus
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Fördelning mellan utkast, skickade, betalda och
          förfallna fakturor.
        </p>
      </div>

      {total === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 py-12 text-center text-sm text-slate-400">
          Det finns ännu inga fakturor att analysera.
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {points.map((point) => {
            const percentage =
              total > 0
                ? Math.round(
                    (point.value / total) * 100,
                  )
                : 0;

            return (
              <div key={point.label}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-white">
                    {point.label}
                  </span>

                  <span className="text-slate-400">
                    {point.value} · {percentage}%
                  </span>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function DashboardCharts({
  revenueByMonth,
  leadsByMonth,
  invoiceStatus,
}: Props) {
  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart
          title="Omsättning"
          description="Betalda fakturor per månad."
          points={revenueByMonth}
          valueFormatter={formatCurrency}
        />

        <BarChart
          title="Leads"
          description="Antal inkomna leads per månad."
          points={leadsByMonth}
          valueFormatter={(value) =>
            String(value)
          }
        />
      </div>

      <StatusChart points={invoiceStatus} />
    </section>
  );
}