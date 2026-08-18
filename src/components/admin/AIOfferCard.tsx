"use client";

import { useState } from "react";

type Offer = {
  title: string;
  introduction: string;
  scope: string;
  priceNote: string;
  nextStep: string;
  emailSubject: string;
  emailBody: string;
};

type ApiResponse = {
  success?: boolean;
  offer?: Offer;
  message?: string;
};

type Props = {
  leadId: number;
};

export default function AIOfferCard({ leadId }: Props) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<
    "offer" | "email" | null
  >(null);

  async function generateOffer() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");
    setCopiedField(null);

    try {
      const response = await fetch("/api/ai-offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Offertutkastet kunde inte skapas just nu.",
        );
      }

      if (!data.offer) {
        throw new Error(
          "AI-tjänsten returnerade inget offertutkast.",
        );
      }

      setOffer(data.offer);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Ett oväntat fel inträffade.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function createOfferText(currentOffer: Offer) {
    return `
${currentOffer.title}

${currentOffer.introduction}

Omfattning
${currentOffer.scope}

Pris
${currentOffer.priceNote}

Nästa steg
${currentOffer.nextStep}
    `.trim();
  }

  function createEmailText(currentOffer: Offer) {
    return `
Ämne: ${currentOffer.emailSubject}

${currentOffer.emailBody}
    `.trim();
  }

  async function copyText(
    text: string,
    field: "offer" | "email",
  ) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);

      window.setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch {
      setError(
        "Texten kunde inte kopieras automatiskt. Markera och kopiera den manuellt.",
      );
    }
  }

  function resetOffer() {
    setOffer(null);
    setError("");
    setCopiedField(null);
  }

  return (
    <section className="rounded-3xl border border-blue-400/20 bg-blue-500/[0.05] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            AI-offert
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            Skapa ett offertutkast
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            AI:n använder kundens uppgifter för att skriva ett
            professionellt offertutkast och ett färdigt mejl.
          </p>
        </div>

        {!offer && (
          <button
            type="button"
            onClick={generateOffer}
            disabled={isLoading}
            className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "Skapar offert..."
              : "✨ Skapa offert med AI"}
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4"
        >
          <p className="font-medium text-red-200">
            Något gick fel
          </p>

          <p className="mt-2 text-sm leading-6 text-red-300">
            {error}
          </p>

          {!offer && (
            <button
              type="button"
              onClick={generateOffer}
              disabled={isLoading}
              className="mt-4 rounded-lg border border-red-300/20 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-300/10 disabled:opacity-50"
            >
              Försök igen
            </button>
          )}
        </div>
      )}

      {isLoading && !offer && (
        <div className="mt-7 space-y-4">
          <div className="h-5 w-2/5 animate-pulse rounded bg-white/10" />
          <div className="h-4 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-white/10" />

          <div className="mt-6 h-28 animate-pulse rounded-2xl bg-white/[0.06]" />
        </div>
      )}

      {offer && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
                  Offertutkast
                </p>

                <h3 className="mt-2 text-xl font-semibold text-white">
                  {offer.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  void copyText(
                    createOfferText(offer),
                    "offer",
                  )
                }
                className="w-fit rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.1]"
              >
                {copiedField === "offer"
                  ? "✓ Kopierad"
                  : "Kopiera offert"}
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-300">
                  Inledning
                </p>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-400">
                  {offer.introduction}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-300">
                  Omfattning
                </p>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-400">
                  {offer.scope}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-300">
                  Pris
                </p>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-400">
                  {offer.priceNote}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-300">
                  Nästa steg
                </p>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-400">
                  {offer.nextStep}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Färdigt kundmejl
                </p>

                <h3 className="mt-2 text-lg font-semibold text-white">
                  {offer.emailSubject}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  void copyText(
                    createEmailText(offer),
                    "email",
                  )
                }
                className="w-fit rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/[0.1]"
              >
                {copiedField === "email"
                  ? "✓ Kopierat"
                  : "Kopiera mejl"}
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="whitespace-pre-wrap leading-7 text-slate-300">
                {offer.emailBody}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Kontrollera alltid offertutkastet innan det skickas
              till kunden.
            </p>

            <button
              type="button"
              onClick={resetOffer}
              className="w-fit text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Skapa ett nytt utkast
            </button>
          </div>
        </div>
      )}
    </section>
  );
}