"use client";

import {
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPlannerOptimizationHistoryAction,
  type PlannerOptimizationHistoryItem,
} from "./getPlannerOptimizationHistoryAction";

type Props = {
  limit?: number;
  className?: string;
};

function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "sv-SE",
    {
      dateStyle:
        "short",
      timeStyle:
        "short",
    },
  );
}

function StatusBadge({
  status,
}: {
  status:
    PlannerOptimizationHistoryItem["status"];
}) {
  const isApplied =
    status === "applied";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        isApplied
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
          : "border-sky-400/20 bg-sky-400/[0.08] text-sky-200",
      ].join(" ")}
    >
      {isApplied ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <RotateCcw className="h-3.5 w-3.5" />
      )}

      {isApplied
        ? "Aktiv"
        : "Återställd"}
    </span>
  );
}

export default function OptimizationHistoryPanel({
  limit = 20,
  className = "",
}: Props) {
  const [
    items,
    setItems,
  ] =
    useState<
      PlannerOptimizationHistoryItem[]
    >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let cancelled =
      false;

    async function loadHistory() {
      setIsLoading(true);
      setError("");

      const result =
        await getPlannerOptimizationHistoryAction({
          limit,
        });

      if (cancelled) {
        return;
      }

      if (!result.success) {
        setItems([]);
        setError(
          result.message,
        );
        setIsLoading(
          false,
        );
        return;
      }

      setItems(
        result.items,
      );
      setIsLoading(
        false,
      );
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  const activeCount =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.status ===
            "applied",
        ).length,
      [items],
    );

  return (
    <section
      className={[
        "overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1020] shadow-2xl shadow-black/20",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="flex flex-col gap-3 border-b border-white/[0.07] bg-[#10182b] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10 text-purple-200">
            <History className="h-5 w-5" />
          </span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
              AI Optimization Audit
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Optimeringshistorik
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Senaste AI-planerna som tillämpats eller återställts.
            </p>
          </div>
        </div>

        {!isLoading &&
          !error && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5">
                {items.length} körningar
              </span>

              <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-1.5 text-emerald-300">
                {activeCount} aktiva
              </span>
            </div>
          )}
      </header>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 px-5 py-10 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
          Hämtar optimeringshistorik...
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="m-4 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-200">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

      {!isLoading &&
        !error &&
        items.length ===
          0 && (
          <div className="px-5 py-10 text-center">
            <p className="font-semibold text-white">
              Ingen AI-optimering har sparats ännu
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Historiken fylls på automatiskt när ett Google-verifierat AI-förslag tillämpas.
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        items.length >
          0 && (
          <div className="divide-y divide-white/[0.06]">
            {items.map(
              (item) => (
                <article
                  key={
                    item.id
                  }
                  className="px-5 py-4 transition hover:bg-white/[0.02]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-white">
                          {
                            item.technicianName
                          }
                        </p>

                        <StatusBadge
                          status={
                            item.status
                          }
                        />
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Kandidat{" "}
                        <span className="font-mono text-slate-400">
                          {
                            item.candidateId
                          }
                        </span>
                      </p>
                    </div>

                    <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3 lg:min-w-[460px]">
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          Jobb
                        </p>

                        <p className="mt-1 font-semibold text-slate-300">
                          {
                            item.appliedJobCount
                          }
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
                        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          <Clock3 className="h-3.5 w-3.5" />
                          Tillämpad
                        </p>

                        <p className="mt-1 font-semibold text-slate-300">
                          {formatDateTime(
                            item.appliedAt,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          Återställd
                        </p>

                        <p className="mt-1 font-semibold text-slate-300">
                          {formatDateTime(
                            item.rolledBackAt,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
    </section>
  );
}