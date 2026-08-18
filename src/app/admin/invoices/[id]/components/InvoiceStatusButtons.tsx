"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Send,
  WalletCards,
} from "lucide-react";
import { updateInvoiceStatus } from "../actions";
import type { InvoiceStatus } from "../types";

type Props = {
  invoiceId: number;
  currentStatus: InvoiceStatus;
};

type StatusOption = {
  value: InvoiceStatus;
  label: string;
  description: string;
  icon: typeof Clock3;
  className: string;
};

const statusOptions: StatusOption[] = [
  {
    value: "Utkast",
    label: "Utkast",
    description: "Fakturan redigeras fortfarande.",
    icon: Clock3,
    className:
      "border-slate-400/20 bg-slate-400/10 text-slate-200 hover:bg-slate-400/20",
  },
  {
    value: "Godkänd",
    label: "Godkänd",
    description: "Fakturan är granskad och klar.",
    icon: CheckCircle2,
    className:
      "border-blue-400/20 bg-blue-400/10 text-blue-200 hover:bg-blue-400/20",
  },
  {
    value: "Skickad",
    label: "Skickad",
    description: "Fakturan har skickats till kunden.",
    icon: Send,
    className:
      "border-amber-400/20 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20",
  },
  {
    value: "Betald",
    label: "Betald",
    description: "Betalningen är registrerad.",
    icon: WalletCards,
    className:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20",
  },
  {
    value: "Förfallen",
    label: "Förfallen",
    description: "Förfallodatumet har passerat.",
    icon: Clock3,
    className:
      "border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/20",
  },
];

export default function InvoiceStatusButtons({
  invoiceId,
  currentStatus,
}: Props) {
  const [status, setStatus] =
    useState<InvoiceStatus>(currentStatus);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isPending, startTransition] =
    useTransition();

  function changeStatus(
    nextStatus: InvoiceStatus,
  ) {
    if (
      isPending ||
      nextStatus === status
    ) {
      return;
    }

    setMessage("");
    setError("");

    startTransition(async () => {
      const result = await updateInvoiceStatus(
        invoiceId,
        nextStatus,
      );

      if (!result.success) {
        setError(
          result.message ??
            "Fakturastatusen kunde inte uppdateras.",
        );
        return;
      }

      setStatus(nextStatus);
      setMessage(
        result.message ??
          `Fakturan är nu markerad som ${nextStatus.toLowerCase()}.`,
      );
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
          Fakturaflöde
        </p>

        <h2 className="mt-3 text-xl font-semibold text-white">
          Uppdatera betalstatus
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Välj den status som bäst beskriver fakturans
          nuvarande läge.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isActive =
            option.value === status;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                changeStatus(option.value)
              }
              disabled={
                isPending || isActive
              }
              className={`relative rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed ${
                option.className
              } ${
                isActive
                  ? "ring-2 ring-white/20"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {isPending && !isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}

                {isActive && (
                  <span className="rounded-full border border-white/10 bg-black/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    Aktiv
                  </span>
                )}
              </div>

              <p className="mt-4 font-semibold">
                {option.label}
              </p>

              <p className="mt-1 text-xs leading-5 opacity-70">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {message}
        </div>
      )}
    </section>
  );
}