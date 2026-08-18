"use client";

import Link from "next/link";
import {
  Clock3,
  GripVertical,
  MapPin,
  UserRound,
} from "lucide-react";

export type PlannerEvent = {
  id: number;
  customer: string;
  service: string;
  city?: string | null;
  technician?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  href: string;
};

type Props = {
  event: PlannerEvent;
  isDragging?: boolean;
  dragDisabled?: boolean;
};

const statusStyles: Record<
  string,
  {
    badge: string;
    accent: string;
    glow: string;
  }
> = {
  Planerad: {
    badge:
      "border-blue-400/20 bg-blue-400/10 text-blue-100",
    accent:
      "from-blue-500 via-cyan-400 to-blue-400",
    glow: "shadow-blue-950/20",
  },
  Pågår: {
    badge:
      "border-amber-400/20 bg-amber-400/10 text-amber-100",
    accent:
      "from-amber-500 via-orange-400 to-amber-300",
    glow: "shadow-amber-950/20",
  },
  Utförd: {
    badge:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    accent:
      "from-emerald-500 via-green-400 to-emerald-300",
    glow: "shadow-emerald-950/20",
  },
  Fakturerad: {
    badge:
      "border-purple-400/20 bg-purple-400/10 text-purple-100",
    accent:
      "from-purple-500 via-fuchsia-400 to-purple-300",
    glow: "shadow-purple-950/20",
  },
};

const fallbackStatus = {
  badge:
    "border-white/10 bg-white/5 text-slate-300",
  accent:
    "from-slate-500 via-slate-400 to-slate-300",
  glow: "shadow-black/20",
};

function formatTime(
  startTime?: string | null,
  endTime?: string | null,
) {
  if (!startTime) {
    return "Tid saknas";
  }

  const start = startTime.slice(0, 5);

  if (!endTime) {
    return start;
  }

  return `${start}–${endTime.slice(0, 5)}`;
}

function getInitials(value?: string | null) {
  if (!value?.trim()) {
    return "?";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function PlannerEventCard({
  event,
  isDragging = false,
  dragDisabled = false,
}: Props) {
  const style =
    statusStyles[event.status] ??
    fallbackStatus;

  return (
    <Link
      href={event.href}
      draggable={false}
      onDragStart={(dragEvent) =>
        dragEvent.preventDefault()
      }
      className={`group relative block overflow-hidden rounded-2xl border border-white/10 bg-[#101729] p-5 shadow-xl transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-[#141d33] hover:shadow-2xl ${style.glow} ${
        isDragging
          ? "scale-[0.98] border-purple-400/30 bg-purple-400/[0.08] opacity-55"
          : ""
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${style.accent}`}
      />

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="break-words text-base font-semibold leading-6 text-white">
                {event.customer}
              </h3>

              <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-400">
                {event.service}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}
            >
              {event.status}
            </span>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-slate-300">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2.5">
              <Clock3 className="h-4 w-4 shrink-0 text-purple-300" />

              <span className="font-medium text-white">
                {formatTime(
                  event.startTime,
                  event.endTime,
                )}
              </span>
            </div>

            {event.city && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-slate-500" />

                <span className="min-w-0 break-words">
                  {event.city}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-[11px] font-bold text-slate-200">
                {getInitials(
                  event.technician,
                )}
              </span>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Tekniker
                </p>

                <p className="truncate text-sm font-medium text-slate-200">
                  {event.technician ??
                    "Ej tilldelad"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`flex h-10 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
            dragDisabled
              ? "border-white/5 bg-white/[0.02] text-slate-700"
              : "border-white/10 bg-black/15 text-slate-500 group-hover:border-purple-400/30 group-hover:bg-purple-400/10 group-hover:text-purple-200"
          }`}
          title={
            dragDisabled
              ? "Jobbet kan inte flyttas"
              : "Dra för att flytta jobbet"
          }
          aria-hidden="true"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}