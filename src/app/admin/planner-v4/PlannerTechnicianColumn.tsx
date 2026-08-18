"use client";

import PlannerJobCard from "./PlannerJobCard";
import PlannerTravelCard from "./PlannerTravelCard";
import PlannerPreviewLayer from "./preview/PlannerPreviewLayer";
import {
  usePreviewLayout,
} from "./preview/usePreviewLayout";
import {
  getTimelineLayout,
  getTimelinePixelsPerMinute,
} from "./timeline";
import {
  PLANNER_END_HOUR,
  PLANNER_SLOT_HEIGHT,
  PLANNER_SLOT_MINUTES,
  PLANNER_START_HOUR,
  minutesToTime,
  parseTimeToMinutes,
} from "./helpers";
import type {
  PlannerEventWithDate,
} from "../planner/queries";
import type {
  RouteLeg,
  RouteStop,
} from "./routing";

type Props = {
  technician: string;
  events: PlannerEventWithDate[];
  conflicts?: Set<number>;
  selectedJobId?: number | null;
  hoveredJobId?: number | null;
  onJobSelect?: (
    eventId: number,
  ) => void;
  onJobHoverChange?: (
    eventId: number | null,
  ) => void;
  currentTimeTop?: number | null;
  onDrop?: (
    minutes: number,
  ) => void;
  onDragOver?: (
    minutes: number,
  ) => void;
  height: number;
  routeLegs?: RouteLeg[];
  routeStops?: RouteStop[];
};

type TravelMarker = {
  key: string;
  top: number;
  height: number;
  leg: RouteLeg;
  fromEvent: PlannerEventWithDate;
  toEvent: PlannerEventWithDate;
  estimatedArrivalTime: string | null;
};

const TRAVEL_INSET = 7;
const MIN_TRAVEL_HEIGHT = 30;
const MAX_TRAVEL_HEIGHT = 38;

function getEventByStopId(
  stopId: string,
  stops: RouteStop[],
  events: PlannerEventWithDate[],
) {
  const stop = stops.find(
    (candidate) =>
      candidate.id === stopId,
  );

  if (!stop?.workOrderId) {
    return null;
  }

  return (
    events.find(
      (event) =>
        event.id === stop.workOrderId,
    ) ?? null
  );
}

function getEstimatedArrivalTime(
  fromEvent: PlannerEventWithDate,
  leg: RouteLeg,
) {
  const departureMinutes =
    parseTimeToMinutes(
      fromEvent.endTime ??
        fromEvent.startTime,
    );

  if (
    departureMinutes === null
  ) {
    return null;
  }

  const travelMinutes =
    Math.round(
      leg.durationSeconds / 60,
    );

  return minutesToTime(
    departureMinutes +
      travelMinutes,
  );
}

function getJobDensity(
  height: number,
):
  | "compact"
  | "normal"
  | "spacious" {
  if (height < 68) {
    return "compact";
  }

  if (height > 118) {
    return "spacious";
  }

  return "normal";
}

export default function PlannerTechnicianColumn({
  technician,
  events,
  conflicts = new Set(),
  selectedJobId = null,
  hoveredJobId = null,
  onJobSelect,
  onJobHoverChange,
  currentTimeTop = null,
  onDrop,
  onDragOver,
  height,
  routeLegs = [],
  routeStops = [],
}: Props) {
  const slots = Array.from(
    {
      length:
        ((PLANNER_END_HOUR -
          PLANNER_START_HOUR) *
          60) /
        PLANNER_SLOT_MINUTES,
    },
    (_, index) =>
      PLANNER_START_HOUR * 60 +
      index * PLANNER_SLOT_MINUTES,
  );

  const sortedEvents = [...events].sort(
    (a, b) =>
      (a.startTime ?? "").localeCompare(
        b.startTime ?? "",
      ),
  );

  const previewLayout =
    usePreviewLayout({
      technician,
      events: sortedEvents,
    });

  const pixelsPerMinute =
    getTimelinePixelsPerMinute();

  const travelMarkers: TravelMarker[] =
    routeLegs
      .map((leg) => {
        const fromEvent =
          getEventByStopId(
            leg.fromStopId,
            routeStops,
            sortedEvents,
          );

        const toEvent =
          getEventByStopId(
            leg.toStopId,
            routeStops,
            sortedEvents,
          );

        if (
          !fromEvent ||
          !toEvent
        ) {
          return null;
        }

        const fromLayout =
          previewLayout.layouts.get(
            fromEvent.id,
          ) ??
          getTimelineLayout(
            fromEvent,
          );

        const toLayout =
          previewLayout.layouts.get(
            toEvent.id,
          ) ??
          getTimelineLayout(
            toEvent,
          );

        const fromBottom =
          fromLayout.top +
          fromLayout.height;

        const availableGap =
          toLayout.top -
          fromBottom;

        if (
          availableGap <=
          TRAVEL_INSET * 2
        ) {
          return null;
        }

        const desiredHeight =
          Math.max(
            MIN_TRAVEL_HEIGHT,
            Math.min(
              MAX_TRAVEL_HEIGHT,
              (leg.durationSeconds /
                60) *
                pixelsPerMinute *
                0.22,
            ),
          );

        const maxHeight =
          availableGap -
          TRAVEL_INSET * 2;

        if (
          maxHeight <
          MIN_TRAVEL_HEIGHT
        ) {
          return null;
        }

        const markerHeight =
          Math.min(
            desiredHeight,
            maxHeight,
          );

        const top =
          fromBottom +
          Math.max(
            TRAVEL_INSET,
            (availableGap -
              markerHeight) /
              2,
          );

        return {
          key:
            `${leg.fromStopId}-${leg.toStopId}`,
          top,
          height:
            markerHeight,
          leg,
          fromEvent,
          toEvent,
          estimatedArrivalTime:
            getEstimatedArrivalTime(
              fromEvent,
              leg,
            ),
        };
      })
      .filter(
        (
          marker,
        ): marker is TravelMarker =>
          marker !== null,
      );

  return (
    <div
      className="relative overflow-hidden border-r border-white/[0.06] bg-[#0b1020]"
      style={{ height }}
      data-technician={
        technician
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.012] via-transparent to-transparent" />

      {slots.map(
        (minutes) => {
          const isHour =
            minutes % 60 ===
            0;

          const isHalfHour =
            minutes % 30 ===
            0;

          return (
            <div
              key={minutes}
              onDragOver={(
                event,
              ) => {
                event.preventDefault();
                onDragOver?.(
                  minutes,
                );
              }}
              onDrop={(
                event,
              ) => {
                event.preventDefault();
                onDrop?.(
                  minutes,
                );
              }}
              className={[
                "absolute left-0 right-0 border-t transition-colors",
                isHour
                  ? "border-white/[0.08]"
                  : isHalfHour
                    ? "border-white/[0.04]"
                    : "border-white/[0.025]",
              ].join(" ")}
              style={{
                top:
                  ((minutes -
                    PLANNER_START_HOUR *
                      60) /
                    PLANNER_SLOT_MINUTES) *
                  PLANNER_SLOT_HEIGHT,
                height:
                  PLANNER_SLOT_HEIGHT,
              }}
            >
              {isHour && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/[0.035] via-transparent to-transparent" />
              )}
            </div>
          );
        },
      )}

      {currentTimeTop !==
        null && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-40 flex items-center"
          style={{
            top:
              currentTimeTop,
          }}
        >
          <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.55)]" />
          <span className="h-px flex-1 bg-gradient-to-r from-rose-400/95 via-rose-400/55 to-rose-400/10" />
        </div>
      )}

      {travelMarkers.map(
        (marker) => (
          <div
            key={
              marker.key
            }
            className="pointer-events-none absolute left-3 right-3 z-[14]"
            style={{
              top:
                marker.top,
              height:
                marker.height,
            }}
          >
            <PlannerTravelCard
              compact
              leg={
                marker.leg
              }
              fromLabel={
                marker
                  .fromEvent
                  .customer
              }
              toLabel={
                marker.toEvent
                  .customer
              }
              nextJobStartTime={
                marker.toEvent
                  .startTime
              }
              estimatedArrivalTime={
                marker
                  .estimatedArrivalTime
              }
            />
          </div>
        ),
      )}

      <PlannerPreviewLayer
        technician={
          technician
        }
        events={
          previewLayout
            .orderedEvents
        }
      >
        {(displayEvents) => (
          <>
            {displayEvents.map(
              (event) => {
                const preview =
                  previewLayout.layouts.get(
                    event.id,
                  );

                const layout =
                  preview ??
                  getTimelineLayout(
                    event,
                  );

                const cardHeight =
                  Math.max(
                    24,
                    layout.height -
                      6,
                  );

                const isSelected =
                  selectedJobId ===
                  event.id;

                const isHovered =
                  hoveredJobId ===
                  event.id;

                return (
                  <PlannerJobCard
                    key={
                      event.id
                    }
                    event={
                      event
                    }
                    conflict={conflicts.has(
                      event.id,
                    )}
                    selected={
                      isSelected
                    }
                    hovered={
                      isHovered
                    }
                    density={getJobDensity(
                      cardHeight,
                    )}
                    onSelect={
                      onJobSelect
                    }
                    onHoverChange={
                      onJobHoverChange
                    }
                    style={{
                      top:
                        layout.top +
                        3,
                      height:
                        cardHeight,
                      zIndex:
                        isSelected
                          ? 35
                          : isHovered
                            ? 28
                            : preview?.moved
                              ? 22
                              : 18,
                    }}
                  />
                );
              },
            )}
          </>
        )}
      </PlannerPreviewLayer>
    </div>
  );
}