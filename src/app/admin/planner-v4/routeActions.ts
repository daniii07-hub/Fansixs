"use server";

import type { PlannerEventWithDate } from "../planner/queries";
import {
  getRoutesForTechnicians,
} from "./routing/getTechnicianRoute";
import type {
  RouteEngineResult,
} from "./routing/types";

type GetPlannerRoutesInput = {
  date: string;
  events: PlannerEventWithDate[];
  technicians: string[];
};

export async function getPlannerRoutesAction({
  date,
  events,
  technicians,
}: GetPlannerRoutesInput): Promise<
  Record<string, RouteEngineResult>
> {
  try {
    console.log(
      "[Planner Route Debug] ACTION START",
      {
        date,
        technicians,
        eventCount: events.length,
        events: events.map((event) => ({
          id: event.id,
          customer: event.customer,
          technician: event.technician,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          city: event.city,
        })),
      },
    );

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      console.error(
        "[Planner Route Debug] INVALID DATE",
        date,
      );

      return {
        __error__: {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message:
              "Datumet måste anges som YYYY-MM-DD.",
          },
        },
      };
    }

    const normalizedTechnicians =
      Array.from(
        new Set(
          technicians
            .map((name) =>
              name.trim(),
            )
            .filter(Boolean),
        ),
      );

    console.log(
      "[Planner Route Debug] NORMALIZED TECHNICIANS",
      normalizedTechnicians,
    );

    if (
      normalizedTechnicians.length === 0
    ) {
      console.warn(
        "[Planner Route Debug] NO TECHNICIANS",
      );

      return {};
    }

    console.log(
      "[Planner Route Debug] CALLING ROUTE ENGINE",
      {
        date,
        technicians:
          normalizedTechnicians,
      },
    );

    const results =
      await getRoutesForTechnicians({
        technicians:
          normalizedTechnicians,
        date,
        events,
      });

    console.log(
      "[Planner Route Debug] ROUTE ENGINE RESULT",
      JSON.stringify(
        results,
        null,
        2,
      ),
    );

    for (const technician of normalizedTechnicians) {
      const result =
        results[technician];

      console.log(
        `[Planner Route Debug] TECHNICIAN ${technician}`,
        JSON.stringify(
          result,
          null,
          2,
        ),
      );

      if (
        result &&
        result.success === false
      ) {
        console.error(
          `[Planner Route Debug] FAILED ${technician}`,
          {
            code: result.error.code,
            message:
              result.error.message,
            details:
              result.error.details,
          },
        );
      }
    }

    return results;
  } catch (error) {
    console.error(
      "[Planner Route Debug] ACTION CRASHED",
      error,
    );

    return {
      __error__: {
        success: false,
        error: {
          code: "UNKNOWN",
          message:
            error instanceof Error
              ? error.message
              : "Rutterna kunde inte beräknas.",
          details: error,
        },
      },
    };
  }
}