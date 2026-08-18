import PlannerClient from "./PlannerClient";
import { getPlannerData } from "./queries";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  try {
    const plannerData =
      await getPlannerData();

    return (
      <PlannerClient
        events={plannerData.events}
        technicians={
          plannerData.technicians
        }
        plannedCount={
          plannerData.plannedCount
        }
        activeCount={
          plannerData.activeCount
        }
        completedCount={
          plannerData.completedCount
        }
      />
    );
  } catch (error) {
    console.error(
      "Planner page error:",
      error,
    );

    return (
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-300">
          Planner
        </p>

        <h1 className="mt-3 text-4xl font-bold text-white">
          Planering
        </h1>

        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">
          {error instanceof Error
            ? error.message
            : "Plannerns data kunde inte hämtas."}
        </div>
      </div>
    );
  }
}