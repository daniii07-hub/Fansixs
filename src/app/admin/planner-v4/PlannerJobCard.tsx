"use client";

import {
  AlertTriangle,
  MapPin,
} from "lucide-react";
import {
  formatTimeRange,
} from "./helpers";

type Event = {
  id: number;
  customer: string;
  service: string;
  city?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  href: string;
};

type Density =
  | "compact"
  | "normal"
  | "spacious";

type Props = {
  event: Event;
  conflict?: boolean;
  selected?: boolean;
  hovered?: boolean;
  density?: Density;
  onSelect?: (
    eventId: number,
  ) => void;
  onHoverChange?: (
    eventId: number | null,
  ) => void;
  style?: React.CSSProperties;
};

const styles: Record<
  string,
  string
> = {
  Planerad:
    "border-blue-400/25 from-blue-500/20 to-cyan-500/10",
  Pågår:
    "border-amber-400/25 from-amber-500/20 to-orange-500/10",
  Utförd:
    "border-emerald-400/25 from-emerald-500/20 to-green-500/10",
  Fakturerad:
    "border-purple-400/25 from-purple-500/20 to-fuchsia-500/10",
};

export default function PlannerJobCard({
  event,
  conflict = false,
  selected = false,
  hovered = false,
  density = "normal",
  onSelect,
  onHoverChange,
  style,
}: Props) {
  const color =
    styles[event.status] ??
    "border-white/15 from-slate-500/15 to-slate-400/5";

  const compact =
    density === "compact";

  const spacious =
    density === "spacious";

  function handleClick(
    clickEvent:
      React.MouseEvent<HTMLAnchorElement>,
  ) {
    if (!selected) {
      clickEvent.preventDefault();
      onSelect?.(event.id);
    }
  }

  return (
    <a
      href={event.href}
      style={style}
      onClick={handleClick}
      onMouseEnter={() =>
        onHoverChange?.(
          event.id,
        )
      }
      onMouseLeave={() =>
        onHoverChange?.(null)
      }
      onFocus={() =>
        onHoverChange?.(
          event.id,
        )
      }
      onBlur={() =>
        onHoverChange?.(null)
      }
      aria-current={
        selected
          ? "true"
          : undefined
      }
      data-planner-event-id={
        event.id
      }
      className={[
        "absolute left-3 right-3 overflow-hidden rounded-2xl border bg-gradient-to-br shadow-xl transition hover:-translate-y-0.5",
        compact
          ? "px-4 py-2.5"
          : spacious
            ? "p-4"
            : "px-4 py-3",
        selected
          ? "border-purple-300 ring-2 ring-purple-400/60 shadow-purple-500/20"
          : hovered
            ? "border-purple-300/70 ring-2 ring-purple-400/30 shadow-purple-500/10"
            : conflict
              ? "border-red-500 ring-2 ring-red-500/40"
              : color,
      ].join(" ")}
    >
      <div className="flex h-full min-h-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={
              compact
                ? "truncate text-sm font-semibold text-white"
                : "truncate font-semibold text-white"
            }
          >
            {event.customer}
          </p>

          <p
            className={[
              compact
                ? "mt-0.5 truncate text-[11px]"
                : "mt-1 line-clamp-1 text-xs",
              "text-slate-300",
            ].join(" ")}
          >
            {event.service}
          </p>

          <div
            className={
              compact
                ? "mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]"
                : "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
            }
          >
            <span className="font-semibold text-white">
              {formatTimeRange(
                event.startTime,
                event.endTime,
              )}
            </span>

            {event.city && (
              <span className="flex min-w-0 items-center gap-1 text-slate-400">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {event.city}
                </span>
              </span>
            )}
          </div>
        </div>

        {conflict && (
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
        )}
      </div>
    </a>
  );
}