"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  PlayCircle,
  ReceiptText,
} from "lucide-react";

type Props = {
  workOrderId: number;
  currentStatus: string;
};

const statusConfig = {
  Planerad: {
    nextStatus: "Pågår",
    label: "Starta jobb",
    icon: PlayCircle,
    color: "from-amber-500 to-orange-500",
  },
  Pågår: {
    nextStatus: "Utförd",
    label: "Markera utfört",
    icon: CheckCircle2,
    color: "from-emerald-500 to-green-600",
  },
  Utförd: {
    nextStatus: "Fakturerad",
    label: "Klar för Fortnox",
    icon: ReceiptText,
    color: "from-purple-600 to-blue-600",
  },
} as const;

export default function StatusButtons({
  workOrderId,
  currentStatus,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config =
    statusConfig[status as keyof typeof statusConfig];

  if (!config) {
    return (
      <p className="text-sm text-slate-400">
        Arbetsordern har statusen {status}.
      </p>
    );
  }

  async function updateStatus() {
    if (loading) {
      return;
    }

    const nextStatus = config.nextStatus;

    if (!nextStatus) {
      setError("Nästa status saknas.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/work-orders/${workOrderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

     const responseText = await response.text();

const data = responseText
  ? (JSON.parse(responseText) as {
      success?: boolean;
      message?: string;
    })
  : {
      success: response.ok,
      message: response.ok
        ? undefined
        : "API:t returnerade ett tomt svar.",
    };
      

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Statusen kunde inte uppdateras.",
        );
      }

      setStatus(nextStatus);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Statusen kunde inte uppdateras.",
      );
    } finally {
      setLoading(false);
    }
  }

  const Icon = config.icon;

  return (
    <div>
      <button
        type="button"
        onClick={updateStatus}
        disabled={loading}
        className={`inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r ${config.color} px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}

        {loading ? "Sparar..." : config.label}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}