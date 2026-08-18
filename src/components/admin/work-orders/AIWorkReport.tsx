"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

type Props = {
  workOrderId: number;
};

type ApiResponse = {
  success?: boolean;
  report?: string;
  message?: string;
};

export default function AIWorkReport({
  workOrderId,
}: Props) {
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function generateReport() {
    const cleanedNotes = notes.trim();

    if (!cleanedNotes) {
      setError(
        "Skriv några korta anteckningar om hur jobbet gick.",
      );
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch(
        "/api/ai/work-report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workOrderId,
            notes: cleanedNotes,
          }),
        },
      );

      const responseText = await response.text();

      let data: ApiResponse = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText) as ApiResponse;
        } catch {
          throw new Error(
            "AI-tjänsten returnerade ett ogiltigt svar.",
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "AI kunde inte skapa rapporten.",
        );
      }

      if (
        typeof data.report !== "string" ||
        !data.report.trim()
      ) {
        throw new Error(
          "AI-tjänsten svarade, men ingen rapport skapades.",
        );
      }

      setReport(data.report.trim());
      setSaved(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "AI kunde inte skapa rapporten.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-purple-400/15 bg-purple-400/[0.05] p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-purple-300" />

        <h2 className="text-xl font-semibold text-white">
          AI-arbetsrapport
        </h2>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
        Skriv kort hur jobbet gick. AI omvandlar texten
        till en professionell arbetsrapport och sparar den
        på arbetsordern.
      </p>

      <textarea
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          setError("");
          setSaved(false);
        }}
        rows={6}
        disabled={loading}
        className="mt-5 w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder={`Exempel:
Fönstren var mycket smutsiga.
Arbetet tog 20 minuter extra.
Kunden blev nöjd.`}
      />

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Rapporten har skapats och sparats.
        </div>
      )}

      <button
        type="button"
        onClick={generateReport}
        disabled={loading || !notes.trim()}
        className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}

        {loading
          ? "AI skriver rapport..."
          : "Generera rapport"}
      </button>

      {report && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
            Färdig arbetsrapport
          </p>

          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
            {report}
          </p>
        </div>
      )}
    </section>
  );
}