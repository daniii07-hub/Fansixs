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
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
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

    if (
      normalizedTechnicians.length === 0
    ) {
      return {};
    }

    return await getRoutesForTechnicians({
      technicians:
        normalizedTechnicians,
      date,
      events,
    });
  } catch (error) {
    console.error(
      "Planner route action error:",
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