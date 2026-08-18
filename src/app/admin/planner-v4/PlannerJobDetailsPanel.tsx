"use client";

import {
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import type {
  PlannerEventWithDate,
} from "../planner/queries";
import {
  formatTimeRange,
} from "./helpers";

type Props = {
  event: PlannerEventWithDate | null;
  onClose: () => void;
};

export default function PlannerJobDetailsPanel({
  event,
  onClose,
}: Props) {
  if (!event) {
    return null;
  }

  return (
    <aside
      aria-label="Jobbdetaljer"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0b1020]/98 shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-[#10182b] px-6 py-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
            Valt jobb
          </p>

          <h2 className="mt-2 truncate text-xl font-semibold text-white">
            {event.customer}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Arbetsorder #{event.id}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Stäng jobbdetaljer"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-start gap-3">
              <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Tjänst
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-200">
                  {event.service}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <CalendarDays className="h-5 w-5 text-purple-300" />

              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Datum
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {String(event.date).slice(0, 10)}
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <Clock3 className="h-5 w-5 text-purple-300" />

              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Tid
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {formatTimeRange(
                  event.startTime,
                  event.endTime,
                )}
              </p>
            </section>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Tekniker
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {event.technician?.trim() ||
                    "Ej tilldelad"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Ort
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {event.city?.trim() ||
                    "Ingen ort angiven"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Status
            </p>

            <span className="mt-3 inline-flex rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1.5 text-xs font-semibold text-purple-200">
              {event.status}
            </span>
          </section>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#10182b] p-6">
        <a
          href={event.href}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 hover:shadow-purple-500/30"
        >
          Öppna arbetsorder
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </aside>
  );
}