"use client";

import PlannerTechnicianColumn from "./PlannerTechnicianColumn";
import PlannerTimelineHeader from "./PlannerTimelineHeader";
import PlannerTimeAxis from "./PlannerTimeAxis";
import {
  getInitials,
} from "./helpers";

import type {
  PlannerEventWithDate,
} from "../planner/queries";
import type {
  TechnicianRoute,
} from "./routing";

type Technician = {
  id: string;
  name: string;
};

type Props = {
  visibleTechnicians: Technician[];
  groupedEvents: Map<
    string,
    PlannerEventWithDate[]
  >;
  routes: Record<
    string,
    TechnicianRoute
  >;
  conflictIds: Set<number>;
  selectedJobId?: number | null;
  hoveredJobId?: number | null;
  currentTimeTop?: number | null;
  totalHeight: number;
  onJobSelect?: (
    eventId: number,
  ) => void;
  onJobHoverChange?: (
    eventId: number | null,
  ) => void;
  onDrop: (
    technician: string,
    minutes: number,
  ) => void;
  onDragStart: (
    event:
      React.DragEvent<HTMLDivElement>,
  ) => void;
  onDragEnd: () => void;
};

export default function PlannerTimelineGrid({
  visibleTechnicians,
  groupedEvents,
  routes,
  conflictIds,
  selectedJobId = null,
  hoveredJobId = null,
  currentTimeTop = null,
  totalHeight,
  onJobSelect,
  onJobHoverChange,
  onDrop,
  onDragStart,
  onDragEnd,
}: Props) {
  return (
    <div
      className="overflow-x-auto overscroll-x-contain"
      onDragStart={
        onDragStart
      }
      onDragEnd={
        onDragEnd
      }
    >
      <div
        className="grid min-w-[1080px]"
        style={{
          gridTemplateColumns:
            `88px repeat(${visibleTechnicians.length}, minmax(280px, 1fr))`,
        }}
      >
        <div className="sticky left-0 top-0 z-50 border-b border-r border-white/[0.06] bg-[#0d1322]/95 backdrop-blur-xl" />

        {visibleTechnicians.map(
          (technician) => {
            const technicianRoute =
              routes[
                technician.name
              ];

            const technicianEvents =
              groupedEvents.get(
                technician.name,
              ) ?? [];

            return (
              <PlannerTimelineHeader
                key={
                  technician.id
                }
                technicianName={
                  technician.name
                }
                initials={getInitials(
                  technician.name,
                )}
                jobCount={
                  technicianEvents.length
                }
                hasRoute={
                  Boolean(
                    technicianRoute,
                  )
                }
                totalDriveMinutes={
                  technicianRoute
                    ?.summary
                    .totalDriveMinutes ??
                  null
                }
                totalDistanceMeters={
                  technicianRoute
                    ?.summary
                    .totalDistanceMeters ??
                  null
                }
              />
            );
          },
        )}

        <PlannerTimeAxis
          height={totalHeight}
        />

        {visibleTechnicians.map(
          (technician) => {
            const technicianRoute =
              routes[
                technician.name
              ];

            return (
              <PlannerTechnicianColumn
                key={`column-${technician.id}`}
                technician={
                  technician.name
                }
                events={
                  groupedEvents.get(
                    technician.name,
                  ) ?? []
                }
                conflicts={
                  conflictIds
                }
                selectedJobId={
                  selectedJobId
                }
                hoveredJobId={
                  hoveredJobId
                }
                onJobSelect={
                  onJobSelect
                }
                onJobHoverChange={
                  onJobHoverChange
                }
                currentTimeTop={
                  currentTimeTop
                }
                height={
                  totalHeight
                }
                routeLegs={
                  technicianRoute
                    ?.legs ?? []
                }
                routeStops={
                  technicianRoute
                    ?.stops ?? []
                }
                onDrop={(
                  minutes,
                ) =>
                  onDrop(
                    technician.name,
                    minutes,
                  )
                }
              />
            );
          },
        )}
      </div>
    </div>
  );
}