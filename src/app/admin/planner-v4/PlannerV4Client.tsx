"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  CheckCircle2,
  Loader2,
  Route,
  TriangleAlert,
} from "lucide-react";
import PlannerHeader from "./PlannerHeader";
import PlannerToolbar from "./PlannerToolbar";
import PlannerRouteSummary from "./PlannerRouteSummary";
import PlannerWorkspace from "./PlannerWorkspace";
import PlannerAIDispatcherPanel from "./PlannerAIDispatcherPanel";
import PlannerJobDetailsPanel from "./PlannerJobDetailsPanel";
import PlannerV4WeekTimeline from "./PlannerV4WeekTimeline";
import { getPlannerRoutesAction } from "./routeActions";
import PlannerRouteOptimizer from "./optimizer/PlannerRouteOptimizer";
import {
  persistOptimizerRoute,
  prepareOptimizerRouteApply,
} from "./optimizer/applyOptimizerRoute";
import {
  plannerPreviewStore,
} from "./preview/plannerPreviewStore";
import type {
  RouteOptimizationComparison,
} from "./routing/optimization/types";
import type { PlannerEventWithDate } from "../planner/queries";
import type {
  RouteEngineResult,
  TechnicianRoute,
} from "./routing";
import {
  getWeekDates,
  parseDate,
  toDateKey,
} from "./helpers";

type Technician = {
  id: string;
  name: string;
};

type ViewMode = "day" | "week";

type Props = {
  initialDate: string;
  events: PlannerEventWithDate[];
  technicians: Technician[];
};

function normalizeEvents(
  events: PlannerEventWithDate[],
) {
  return events.map((event) => ({
    ...event,
    date: String(
      event.date ?? "",
    ).slice(0, 10),
  }));
}

function getRoutableTechnicians({
  date,
  events,
}: {
  date: string;
  events: PlannerEventWithDate[];
}) {
  const counts = new Map<string, number>();

  for (const event of events) {
    const technician =
      event.technician?.trim();

    if (
      event.date !== date ||
      !technician ||
      !event.city?.trim()
    ) {
      continue;
    }

    counts.set(
      technician,
      (counts.get(technician) ?? 0) + 1,
    );
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .map(([technician]) => technician)
    .sort((a, b) =>
      a.localeCompare(b, "sv-SE"),
    );
}

function extractRoutes(
  results: Record<
    string,
    RouteEngineResult
  >,
) {
  const routes: Record<
    string,
    TechnicianRoute
  > = {};

  const errors: string[] = [];

  for (const [
    technician,
    result,
  ] of Object.entries(results)) {
    if (technician === "__error__") {
      if (!result.success) {
        errors.push(
          result.error.message,
        );
      }

      continue;
    }

    if (result.success) {
      routes[technician] =
        result.route;
      continue;
    }

    errors.push(
      `${technician}: ${result.error.message}`,
    );
  }

  return {
    routes,
    errors,
  };
}

export default function PlannerV4Client({
  initialDate,
  events,
  technicians,
}: Props) {
  const [selectedDate, setSelectedDate] =
    useState(initialDate);

  const [view, setView] =
    useState<ViewMode>("day");

  const [localEvents, setLocalEvents] =
    useState<PlannerEventWithDate[]>(
      () => normalizeEvents(events),
    );

  const [routes, setRoutes] = useState<
    Record<string, TechnicianRoute>
  >({});

  const [routeErrors, setRouteErrors] =
    useState<string[]>([]);

  const [
    selectedJobId,
    setSelectedJobId,
  ] = useState<number | null>(null);

  const [
    hoveredJobId,
    setHoveredJobId,
  ] = useState<number | null>(null);

  const [
    isCalculatingRoutes,
    startRouteTransition,
  ] = useTransition();

  const [
    isApplyingOptimization,
    setIsApplyingOptimization,
  ] = useState(false);

  const [
    optimizerVersion,
    setOptimizerVersion,
  ] = useState(0);

  const [
    optimizationMessage,
    setOptimizationMessage,
  ] = useState("");

  const [
    optimizationError,
    setOptimizationError,
  ] = useState("");

  useEffect(() => {
    setLocalEvents(
      normalizeEvents(events),
    );

    plannerPreviewStore.actions.reset();
    setOptimizerVersion(
      (current) => current + 1,
    );
  }, [events]);

  const selectedDayEvents = useMemo(
    () =>
      localEvents.filter(
        (event) =>
          event.date === selectedDate,
      ),
    [localEvents, selectedDate],
  );

  const selectedJob = useMemo(
    () =>
      selectedJobId === null
        ? null
        : localEvents.find(
            (event) =>
              event.id === selectedJobId,
          ) ?? null,
    [
      localEvents,
      selectedJobId,
    ],
  );

  useEffect(() => {
    if (selectedJobId === null) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setSelectedJobId(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [selectedJobId]);

  const selectedDayCount =
    selectedDayEvents.length;

  const selectedWeekDates = useMemo(
    () =>
      getWeekDates(
        parseDate(selectedDate),
      ).map(toDateKey),
    [selectedDate],
  );

  const selectedWeekCount = useMemo(
    () =>
      localEvents.filter(
        (event) =>
          selectedWeekDates.includes(
            event.date,
          ),
      ).length,
    [
      localEvents,
      selectedWeekDates,
    ],
  );

  const routableTechnicians = useMemo(
    () =>
      getRoutableTechnicians({
        date: selectedDate,
        events: localEvents,
      }),
    [
      localEvents,
      selectedDate,
    ],
  );

  const routeRequestKey = useMemo(
    () =>
      JSON.stringify({
        date: selectedDate,
        technicians:
          routableTechnicians,
        events: selectedDayEvents.map(
          (event) => ({
            id: event.id,
            technician:
              event.technician,
            city: event.city,
            startTime:
              event.startTime,
            endTime:
              event.endTime,
          }),
        ),
      }),
    [
      routableTechnicians,
      selectedDate,
      selectedDayEvents,
    ],
  );

  useEffect(() => {
    if (
      view !== "day" ||
      routableTechnicians.length === 0
    ) {
      setRoutes({});
      setRouteErrors([]);
      return;
    }

    let cancelled = false;

    startRouteTransition(async () => {
      const results =
        await getPlannerRoutesAction({
          date: selectedDate,
          events: selectedDayEvents,
          technicians:
            routableTechnicians,
        });

      if (cancelled) {
        return;
      }

      const parsed =
        extractRoutes(results);

      setRoutes(parsed.routes);
      setRouteErrors(parsed.errors);
    });

    return () => {
      cancelled = true;
    };
  }, [
    routeRequestKey,
    routableTechnicians,
    selectedDate,
    selectedDayEvents,
    view,
  ]);

  function resetOptimizationState() {
    plannerPreviewStore.actions.reset();

    setOptimizerVersion(
      (current) => current + 1,
    );

    setOptimizationMessage("");
    setOptimizationError("");
  }

  function openDay(date: string) {
    setSelectedDate(date);
    setSelectedJobId(null);
    setHoveredJobId(null);
    setView("day");
    resetOptimizationState();
  }

  function handleDateChange(
    date: string,
  ) {
    setSelectedDate(date);
    setSelectedJobId(null);
    setHoveredJobId(null);
    resetOptimizationState();
  }

  function handleViewChange(
    nextView: ViewMode,
  ) {
    setView(nextView);

    if (nextView !== "day") {
      resetOptimizationState();
    }
  }

  function handleEventsChange(
    updatedEvents: PlannerEventWithDate[],
  ) {
    setLocalEvents(
      normalizeEvents(updatedEvents),
    );
  }

  async function handleApplyOptimization(
    technicianName: string,
    comparison:
      RouteOptimizationComparison,
  ) {
    if (isApplyingOptimization) {
      return;
    }

    const previousEvents =
      localEvents;

    setOptimizationMessage("");
    setOptimizationError("");
    setIsApplyingOptimization(true);

    try {
      const prepared =
        prepareOptimizerRouteApply({
          events: localEvents,
          technicianName,
          date: selectedDate,
          comparison,
        });

      setLocalEvents(
        normalizeEvents(
          prepared.updatedEvents,
        ),
      );

      const persisted =
        await persistOptimizerRoute(
          prepared.updates,
        );

      if (!persisted.success) {
        setLocalEvents(
          previousEvents,
        );

        setOptimizationError(
          persisted.message,
        );

        return;
      }

      plannerPreviewStore.actions.clearPreview();

      setOptimizerVersion(
        (current) =>
          current + 1,
      );

      setSelectedJobId(null);
      setHoveredJobId(null);

      setOptimizationMessage(
        `${technicianName}s optimerade rutt har sparats. ${prepared.updates.length} jobb uppdaterades.`,
      );
    } catch (caughtError) {
      setLocalEvents(
        previousEvents,
      );

      setOptimizationError(
        caughtError instanceof Error
          ? caughtError.message
          : "Den optimerade rutten kunde inte appliceras.",
      );
    } finally {
      setIsApplyingOptimization(
        false,
      );
    }
  }

  const successfulRoutes =
    Object.values(routes);

  const totalDistanceMeters =
    successfulRoutes.reduce(
      (total, route) =>
        total +
        route.summary
          .totalDistanceMeters,
      0,
    );

  const totalDriveMinutes =
    successfulRoutes.reduce(
      (total, route) =>
        total +
        route.summary
          .totalDriveMinutes,
      0,
    );

  return (
    <div className="space-y-4">
      <PlannerHeader
        selectedDate={
          selectedDate
        }
        view={view}
        selectedDayCount={
          selectedDayCount
        }
        selectedWeekCount={
          selectedWeekCount
        }
        technicianCount={
          technicians.length
        }
        routeCount={
          successfulRoutes.length
        }
        totalDistanceMeters={
          totalDistanceMeters
        }
        totalDriveMinutes={
          totalDriveMinutes
        }
      />

      <PlannerToolbar
        view={view}
        selectedDate={
          selectedDate
        }
        initialDate={
          initialDate
        }
        onViewChange={
          handleViewChange
        }
        onDateChange={
          handleDateChange
        }
      />

      {isApplyingOptimization && (
        <div className="flex items-center gap-3 rounded-2xl border border-purple-400/20 bg-purple-400/[0.07] px-4 py-3 text-sm text-purple-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sparar den optimerade rutten...
        </div>
      )}

      {optimizationError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-200">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            {optimizationError}
          </span>
        </div>
      )}

      {optimizationMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>
            {optimizationMessage}
          </span>
        </div>
      )}

      {view === "day" &&
        isCalculatingRoutes && (
          <div className="flex items-center gap-3 rounded-2xl border border-purple-400/20 bg-purple-400/[0.07] px-4 py-3 text-sm text-purple-100">
            <Loader2 className="h-4 w-4 animate-spin" />
            Beräknar om restider och
            körsträckor...
          </div>
        )}

      {view === "day" &&
        !isCalculatingRoutes &&
        routableTechnicians.length ===
          0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-sm text-slate-400">
            <Route className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

            <p>
              Minst två jobb med samma
              tekniker och ort behövs på
              valt datum för att en rutt
              ska kunna beräknas.
            </p>
          </div>
        )}

      {view === "day" &&
        routeErrors.length > 0 && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />

              <div>
                <p className="font-semibold text-amber-100">
                  Några rutter kunde inte
                  beräknas
                </p>

                <div className="mt-2 space-y-1 text-sm text-amber-100/70">
                  {routeErrors.map(
                    (message) => (
                      <p key={message}>
                        {message}
                      </p>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {view === "day" &&
        successfulRoutes.length > 0 && (
          <PlannerRouteOptimizer
            key={
              optimizerVersion
            }
            routes={routes}
            onAcceptCandidate={
              handleApplyOptimization
            }
          />
        )}

      {view === "day" &&
        successfulRoutes.length > 0 && (
          <PlannerAIDispatcherPanel
            routes={routes}
            onJobSelect={
              setSelectedJobId
            }
          />
        )}

      {view === "day" &&
        successfulRoutes.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
                Google Routes
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-white">
                Ruttöversikt för valt
                datum
              </h2>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {successfulRoutes.map(
                (route) => (
                  <PlannerRouteSummary
                    key={
                      route.technicianId
                    }
                    route={route}
                  />
                ),
              )}
            </div>
          </section>
        )}

      {view === "day" && (
        <PlannerWorkspace
          date={selectedDate}
          events={localEvents}
          technicians={technicians}
          routes={routes}
          selectedJobId={
            selectedJobId
          }
          hoveredJobId={
            hoveredJobId
          }
          selectedTechnician={
            selectedJob?.technician ??
            null
          }
          onJobSelect={
            setSelectedJobId
          }
          onJobHoverChange={
            setHoveredJobId
          }
          onEventsChange={
            handleEventsChange
          }
        />
      )}

      {view === "week" && (
        <PlannerV4WeekTimeline
          referenceDate={selectedDate}
          events={localEvents}
          technicians={technicians}
          onDateSelect={openDay}
        />
      )}

      {selectedJob && (
        <>
          <button
            type="button"
            aria-label="Stäng jobbdetaljer"
            onClick={() =>
              setSelectedJobId(null)
            }
            className="fixed inset-0 z-40 cursor-default bg-black/45 backdrop-blur-[2px]"
          />

          <PlannerJobDetailsPanel
            event={selectedJob}
            onClose={() =>
              setSelectedJobId(null)
            }
          />
        </>
      )}
    </div>
  );
}   