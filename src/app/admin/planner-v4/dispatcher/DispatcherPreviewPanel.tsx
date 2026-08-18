"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPinned,
  Route,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";

import type {
  DispatcherVerificationSuccess,
} from "./verifyDispatcherCandidateAction";
import {
  applyDispatcherCandidateAction,
  rollbackDispatcherCandidateAction,
} from "./applyDispatcherCandidateAction";
import type {
  DispatcherApplyRollbackSnapshot,
} from "./applyDispatcherCandidateAction";

type Props = {
  result:
    DispatcherVerificationSuccess;

  onClose?: () => void;

  onJobSelect?: (
    workOrderId: number,
  ) => void;

  className?: string;
};

function formatMinutes(
  value: number,
) {
  const sign =
    value > 0
      ? "+"
      : "";

  return `${sign}${value} min`;
}

function formatDistance(
  meters: number,
) {
  const kilometers =
    meters / 1000;

  const sign =
    kilometers > 0
      ? "+"
      : "";

  return `${sign}${kilometers.toFixed(
    1,
  )} km`;
}

function impactTone(
  value: number,
) {
  if (value < 0) {
    return "text-emerald-300";
  }

  if (value > 0) {
    return "text-red-300";
  }

  return "text-slate-300";
}

function statusTone(
  status:
    DispatcherVerificationSuccess["status"],
) {
  if (status === "improved") {
    return {
      border:
        "border-emerald-400/20",
      background:
        "bg-emerald-400/[0.06]",
      text:
        "text-emerald-200",
      label:
        "Verifierad förbättring",
    };
  }

  if (status === "worse") {
    return {
      border:
        "border-red-400/20",
      background:
        "bg-red-400/[0.06]",
      text:
        "text-red-200",
      label:
        "Verifierad försämring",
    };
  }

  return {
    border:
      "border-slate-400/20",
    background:
      "bg-slate-400/[0.05]",
    text:
      "text-slate-300",
    label:
      "Verifierad neutral",
  };
}

export default function DispatcherPreviewPanel({
  result,
  onClose,
  onJobSelect,
  className = "",
}: Props) {
  const tone =
    statusTone(
      result.status,
    );

  const [
    applyMessage,
    setApplyMessage,
  ] = useState("");

  const [
    applyError,
    setApplyError,
  ] = useState("");

  const [
    rollbackSnapshot,
    setRollbackSnapshot,
  ] =
    useState<DispatcherApplyRollbackSnapshot | null>(
      null,
    );

  const [
    rollbackMessage,
    setRollbackMessage,
  ] = useState("");

  const [
    rollbackError,
    setRollbackError,
  ] = useState("");

  const [
    isApplying,
    startApplyTransition,
  ] = useTransition();

  const [
    isRollingBack,
    startRollbackTransition,
  ] = useTransition();

  function applyVerifiedDispatcherMove() {
    if (
      result.status !== "improved" ||
      isApplying ||
      rollbackSnapshot
    ) {
      return;
    }

    setApplyError("");
    setApplyMessage("");
    setRollbackError("");
    setRollbackMessage("");

    startApplyTransition(
      async () => {
        const response =
          await applyDispatcherCandidateAction({
            verification:
              result,
          });

        if (!response.success) {
          setApplyError(
            response.message,
          );
          return;
        }

        setRollbackSnapshot(
          response.rollback,
        );

        setApplyMessage(
          response.message,
        );
      },
    );
  }

  function rollbackDispatcherMove() {
    if (
      !rollbackSnapshot ||
      isRollingBack
    ) {
      return;
    }

    setRollbackError("");
    setRollbackMessage("");

    startRollbackTransition(
      async () => {
        const response =
          await rollbackDispatcherCandidateAction({
            snapshot:
              rollbackSnapshot,
          });

        if (!response.success) {
          setRollbackError(
            response.message,
          );
          return;
        }

        setRollbackMessage(
          response.message,
        );

        setApplyMessage("");
        setRollbackSnapshot(
          null,
        );
      },
    );
  }

  return (
    <section
      className={[
        "overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-[#0b1020] shadow-2xl shadow-black/20",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="border-b border-white/[0.07] bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-transparent px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-300">
              Dispatcher Preview
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-white">
                Jobb #{result.candidate.workOrderId}
              </h2>

              <span
                className={[
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                  tone.border,
                  tone.background,
                  tone.text,
                ].join(" ")}
              >
                {tone.label}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-300">
              <span>
                {result.candidate.sourceTechnician}
              </span>

              <ArrowRight className="h-4 w-4 text-fuchsia-300" />

              <span>
                {result.candidate.targetTechnician}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Google Routes-verifierad simulering. Inga ändringar har skrivits till Planner eller Supabase.
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={
                onClose
              }
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Stäng dispatcher-preview"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-3 p-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-purple-300" />

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Total körtid
            </p>
          </div>

          <p
            className={`mt-3 text-2xl font-bold ${impactTone(
              -result.totalDriveMinutesSaved,
            )}`}
          >
            {formatMinutes(
              -result.totalDriveMinutesSaved,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {result.totalBeforeDriveMinutes} →{" "}
            {result.totalAfterDriveMinutes} min
          </p>
        </article>

        <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-purple-300" />

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Total sträcka
            </p>
          </div>

          <p
            className={`mt-3 text-2xl font-bold ${impactTone(
              -result.totalDistanceSavedMeters,
            )}`}
          >
            {formatDistance(
              -result.totalDistanceSavedMeters,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {(result.totalBeforeDistanceMeters / 1000).toFixed(
              1,
            )}{" "}
            →{" "}
            {(result.totalAfterDistanceMeters / 1000).toFixed(
              1,
            )} km
          </p>
        </article>

        <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-purple-300" />

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Total arbetstid
            </p>
          </div>

          <p
            className={`mt-3 text-2xl font-bold ${impactTone(
              -result.totalWorkMinutesSaved,
            )}`}
          >
            {formatMinutes(
              -result.totalWorkMinutesSaved,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {result.totalBeforeWorkMinutes} →{" "}
            {result.totalAfterWorkMinutes} min
          </p>
        </article>
      </div>

      <div className="grid gap-4 border-t border-white/[0.07] p-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/[0.07] bg-[#10182b] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Från
              </p>

              <h3 className="mt-1 font-semibold text-white">
                {result.sourceImpact.technicianName}
              </h3>
            </div>

            <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-xs font-semibold text-slate-300">
              {result.sourceImpact.beforeJobCount} →{" "}
              {result.sourceImpact.afterJobCount} jobb
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Körning
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-300">
                {result.sourceImpact.beforeDriveMinutes} →{" "}
                {result.sourceImpact.afterDriveMinutes} min
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Arbete
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-300">
                {result.sourceImpact.beforeWorkMinutes} →{" "}
                {result.sourceImpact.afterWorkMinutes} min
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Distans
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-300">
                {(result.sourceImpact.beforeDistanceMeters / 1000).toFixed(
                  1,
                )}{" "}
                →{" "}
                {(result.sourceImpact.afterDistanceMeters / 1000).toFixed(
                  1,
                )} km
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/[0.07] bg-[#10182b] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Till
              </p>

              <h3 className="mt-1 font-semibold text-white">
                {result.targetImpact.technicianName}
              </h3>
            </div>

            <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-xs font-semibold text-slate-300">
              {result.targetImpact.beforeJobCount} →{" "}
              {result.targetImpact.afterJobCount} jobb
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Körning
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-300">
                {result.targetImpact.beforeDriveMinutes} →{" "}
                {result.targetImpact.afterDriveMinutes} min
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Arbete
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-300">
                {result.targetImpact.beforeWorkMinutes} →{" "}
                {result.targetImpact.afterWorkMinutes} min
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Distans
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-300">
                {(result.targetImpact.beforeDistanceMeters / 1000).toFixed(
                  1,
                )}{" "}
                →{" "}
                {(result.targetImpact.afterDistanceMeters / 1000).toFixed(
                  1,
                )} km
              </p>
            </div>
          </div>
        </article>
      </div>

      <footer className="border-t border-white/[0.07] bg-[#10182b] px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {result.status === "improved" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              ) : (
                <TriangleAlert className="h-4 w-4 text-amber-300" />
              )}

              {rollbackSnapshot
                ? "Dispatcher-förslaget är tillämpat."
                : result.status === "improved"
                  ? "Verifierad förbättring — kan tillämpas."
                  : "Ingen Apply tillåts utan verifierad förbättring."}
            </div>

            {applyMessage && (
              <p
                role="status"
                className="mt-2 text-xs text-emerald-300"
              >
                {applyMessage}
              </p>
            )}

            {applyError && (
              <p
                role="alert"
                className="mt-2 text-xs text-red-300"
              >
                {applyError}
              </p>
            )}

            {rollbackMessage && (
              <p
                role="status"
                className="mt-2 text-xs text-sky-300"
              >
                {rollbackMessage}
              </p>
            )}

            {rollbackError && (
              <p
                role="alert"
                className="mt-2 text-xs text-red-300"
              >
                {rollbackError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onJobSelect && (
              <button
                type="button"
                onClick={() =>
                  onJobSelect(
                    result.candidate.workOrderId,
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                Visa jobb #{result.candidate.workOrderId}
              </button>
            )}

            {rollbackSnapshot ? (
              <button
                type="button"
                onClick={
                  rollbackDispatcherMove
                }
                disabled={
                  isRollingBack
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/[0.08] px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRollingBack ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Undo2 className="h-4 w-4" />
                )}

                {isRollingBack
                  ? "Återställer..."
                  : "Ångra Dispatcher-ändring"}
              </button>
            ) : (
              result.status === "improved" && (
                <button
                  type="button"
                  onClick={
                    applyVerifiedDispatcherMove
                  }
                  disabled={
                    isApplying
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isApplying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  {isApplying
                    ? "Tillämpar..."
                    : "Tillämpa Dispatcher-förslag"}
                </button>
              )
            )}
          </div>
        </div>
      </footer>
    </section>
  );
}