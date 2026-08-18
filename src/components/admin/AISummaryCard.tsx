"use client";

import { useState } from "react";

type AISummaryResult = {
  summary: string;
  recommendation: string;
  cached?: boolean;
};

type Props = {
  leadId: number;
};

export default function AISummaryCard({ leadId }: Props) {
  const [result, setResult] =
    useState<AISummaryResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateSummary() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId,
        }),
      });

      const data = (await response.json()) as {
        summary?: string;
        recommendation?: string;
        cached?: boolean;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "AI-sammanfattningen kunde inte skapas.",
        );
      }

      if (!data.summary || !data.recommendation) {
        throw new Error(
          "AI-tjänsten returnerade ett ofullständigt svar.",
        );
      }

      setResult({
        summary: data.summary,
        recommendation: data.recommendation,
        cached: data.cached,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ett oväntat fel inträffade.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-purple-400/20 bg-purple-500/[0.06] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
            AI-assistent
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            Leadanalys
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            AI:n sammanfattar kundens behov och föreslår nästa
            åtgärd.
          </p>
        </div>

        {!result && (
          <button
            type="button"
            onClick={generateSummary}
            disabled={isLoading}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "Analyserar..."
              : "✨ Skapa AI-sammanfattning"}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
          <p className="font-medium text-red-200">
            Kunde inte skapa sammanfattningen
          </p>

          <p className="mt-2 text-sm text-red-300">
            {error}
          </p>

          <button
            type="button"
            onClick={generateSummary}
            disabled={isLoading}
            className="mt-4 rounded-lg border border-red-300/20 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-300/10 disabled:opacity-50"
          >
            Försök igen
          </button>
        </div>
      )}

      {isLoading && !result && (
        <div className="mt-6 space-y-3">
          <div className="h-4 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-white/10" />
        </div>
      )}

      {result && (
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-purple-300">
              Sammanfattning
            </p>

            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-200">
              {result.summary}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-5">
            <p className="text-sm font-semibold text-emerald-300">
              Rekommenderad nästa åtgärd
            </p>

            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-200">
              {result.recommendation}
            </p>
          </div>

          <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              {result.cached
                ? "Hämtad från databasen – inga nya AI-tokens användes."
                : "Skapad av AI och sparad i databasen."}
            </p>

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setError("");
              }}
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Dölj analys
            </button>
          </div>
        </div>
      )}
    </section>
  );
}