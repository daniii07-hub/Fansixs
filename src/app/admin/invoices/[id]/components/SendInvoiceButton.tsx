"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";

type Props = {
  invoiceId: number;
  customerEmail: string | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
};

export default function SendInvoiceButton({
  invoiceId,
  customerEmail,
}: Props) {
  const [sending, setSending] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  async function sendInvoice() {
    if (!customerEmail) {
      setError(
        "Kunden saknar e-postadress.",
      );
      return;
    }

    if (sending) {
      return;
    }

    const confirmed = window.confirm(
      `Skicka fakturan till ${customerEmail}?`,
    );

    if (!confirmed) {
      return;
    }

    setSending(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/invoices/${invoiceId}/send`,
        {
          method: "POST",
        },
      );

      const responseText =
        await response.text();

      let data: ApiResponse = {};

      if (responseText) {
        try {
          data = JSON.parse(
            responseText,
          ) as ApiResponse;
        } catch {
          throw new Error(
            "Servern returnerade ett ogiltigt svar.",
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Fakturan kunde inte skickas.",
        );
      }

      setMessage(
        data.message ||
          "Fakturan har skickats till kunden.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Fakturan kunde inte skickas.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={sendInvoice}
        disabled={
          sending ||
          !customerEmail
        }
        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}

        {sending
          ? "Skickar faktura..."
          : "Skicka faktura"}
      </button>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {message && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {message}
        </div>
      )}
    </div>
  );
}