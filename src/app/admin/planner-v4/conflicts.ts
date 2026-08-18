export type PlannerConflict = {
  technician: string;
  workOrderIds: number[];
  startTime: string;
  endTime: string;
};

type PlannerEvent = {
  id: number;
  technician?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

function toMinutes(time?: string | null) {
  if (!time) return null;
  const [h, m] = time.slice(0,5).split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  return h * 60 + m;
}

export function findPlannerConflicts(
  events: PlannerEvent[],
): PlannerConflict[] {
  const conflicts: PlannerConflict[] = [];

  const byTech = new Map<string, PlannerEvent[]>();

  for (const event of events) {
    const tech = event.technician?.trim() || "Ej tilldelad";
    if (!byTech.has(tech)) byTech.set(tech, []);
    byTech.get(tech)!.push(event);
  }

  for (const [technician, techEvents] of byTech) {
    const sorted = [...techEvents].sort((a, b) =>
      (a.startTime ?? "").localeCompare(b.startTime ?? ""),
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      const currentEnd = toMinutes(current.endTime);
      const nextStart = toMinutes(next.startTime);

      if (
        currentEnd !== null &&
        nextStart !== null &&
        currentEnd > nextStart
      ) {
        conflicts.push({
          technician,
          workOrderIds: [current.id, next.id],
          startTime: next.startTime ?? "",
          endTime: current.endTime ?? "",
        });
      }
    }
  }

  return conflicts;
}

export function hasPlannerConflict(
  workOrderId: number,
  conflicts: PlannerConflict[],
) {
  return conflicts.some((conflict) =>
    conflict.workOrderIds.includes(workOrderId),
  );
}