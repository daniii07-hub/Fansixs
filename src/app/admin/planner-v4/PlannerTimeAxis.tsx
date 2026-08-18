"use client";

import {
  PLANNER_END_HOUR,
  PLANNER_SLOT_HEIGHT,
  PLANNER_SLOT_MINUTES,
  PLANNER_START_HOUR,
  minutesToTime,
} from "./helpers";

type Props = {
  height?: number;
};

export default function PlannerTimeAxis({
  height,
}: Props) {
  const totalHeight =
    height ??
    (((PLANNER_END_HOUR -
      PLANNER_START_HOUR) *
      60) /
      PLANNER_SLOT_MINUTES) *
      PLANNER_SLOT_HEIGHT;

  const slots = Array.from(
    {
      length:
        ((PLANNER_END_HOUR -
          PLANNER_START_HOUR) *
          60) /
        PLANNER_SLOT_MINUTES,
    },
    (_, index) => {
      const minutes =
        PLANNER_START_HOUR * 60 +
        index *
          PLANNER_SLOT_MINUTES;

      return {
        minutes,
        isHour:
          minutes % 60 === 0,
        isHalfHour:
          minutes % 30 === 0,
        label:
          minutesToTime(
            minutes,
          ).slice(0, 5),
      };
    },
  );

  return (
    <div
      className="sticky left-0 z-20 border-r border-white/[0.06] bg-[#0a0f1c]"
      style={{
        height:
          totalHeight,
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.035] to-transparent" />

      {slots.map(
        (slot) => {
          if (
            !slot.isHour &&
            !slot.isHalfHour
          ) {
            return null;
          }

          const top =
            ((slot.minutes -
              PLANNER_START_HOUR *
                60) /
              PLANNER_SLOT_MINUTES) *
            PLANNER_SLOT_HEIGHT;

          return (
            <div
              key={
                slot.minutes
              }
              className="absolute left-0 right-0"
              style={{
                top,
              }}
            >
              <div
                className={[
                  "absolute right-0 top-0 h-px",
                  slot.isHour
                    ? "w-4 bg-white/[0.10]"
                    : "w-2.5 bg-white/[0.05]",
                ].join(
                  " ",
                )}
              />

              <span
                className={[
                  "absolute right-3 whitespace-nowrap font-medium tabular-nums",
                  slot.isHour
                    ? "-translate-y-1/2 text-[11px] text-slate-400"
                    : "-translate-y-1/2 text-[10px] text-slate-600",
                ].join(
                  " ",
                )}
              >
                {slot.label}
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}