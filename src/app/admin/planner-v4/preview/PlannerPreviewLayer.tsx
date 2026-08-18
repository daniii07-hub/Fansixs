"use client";

import { Eye, Sparkles } from "lucide-react";

import type { PlannerEventWithDate } from "../../planner/queries";
import { usePlannerPreview } from "./usePlannerPreview";

type Props = {
  technician: string;
  events: PlannerEventWithDate[];
  children: (events: PlannerEventWithDate[]) => React.ReactNode;
};

export default function PlannerPreviewLayer({
  technician,
  events,
  children,
}: Props) {
  const {
    isPreviewing,
    technicianName,
    workOrderOrder,
    movedWorkOrderIds,
  } = usePlannerPreview();

  const previewEvents =
    isPreviewing &&
    technicianName === technician &&
    workOrderOrder.length > 0
      ? [
          ...events.filter((e) =>
            workOrderOrder.includes(e.id),
          ).sort(
            (a, b) =>
              workOrderOrder.indexOf(a.id) -
              workOrderOrder.indexOf(b.id),
          ),
          ...events.filter(
            (e) =>
              !workOrderOrder.includes(e.id),
          ),
        ]
      : events;

  return (
    <div className="relative">
      {children(previewEvents)}

      {isPreviewing &&
        technicianName === technician && (
          <div className="pointer-events-none absolute inset-x-3 top-3 z-40 rounded-xl border border-purple-400/20 bg-purple-500/10 px-3 py-2 backdrop-blur">
            <div className="flex items-center gap-2 text-xs text-purple-200">
              <Eye className="h-4 w-4" />
              <Sparkles className="h-4 w-4" />
              <span>
                AI-preview aktiv •{" "}
                {movedWorkOrderIds.length} jobb
                flyttas lokalt
              </span>
            </div>
          </div>
        )}
    </div>
  );
}