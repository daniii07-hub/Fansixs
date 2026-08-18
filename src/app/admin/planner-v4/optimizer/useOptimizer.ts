"use client";

import {
  useCallback,
  useMemo,
  useTransition,
} from "react";

import {
  plannerPreviewStore,
} from "../preview/plannerPreviewStore";
import type {
  RouteLeg,
  TechnicianRoute,
} from "../routing/types";
import type {
  RouteOptimizationComparison,
  RouteOptimizationLegSnapshot,
  RouteOptimizationOptions,
  RouteOptimizationResult,
} from "../routing/optimization/types";
import {
  optimizeRouteAction,
} from "./optimizerActions";
import {
  createOptimizerStore,
  optimizerSelectors,
  type OptimizerStore,
  useOptimizerStore,
} from "./optimizerStore";

type UseOptimizerOptions = {
  routes:
    | Record<string, TechnicianRoute>
    | TechnicianRoute[];
  selectedTechnician?: string | null;
  optimizationOptions?: RouteOptimizationOptions;
  departureTime?: string | null;
  store?: OptimizerStore;
};

function normalizeRoutes(
  routes:
    | Record<string, TechnicianRoute>
    | TechnicianRoute[],
): TechnicianRoute[] {
  return Array.isArray(routes)
    ? routes
    : Object.values(routes);
}

function findTechnicianRoute(
  routes: TechnicianRoute[],
  technicianName: string,
) {
  return (
    routes.find(
      (route) =>
        route.technicianName ===
        technicianName,
    ) ?? null
  );
}

function toRouteLegs(
  legs: RouteOptimizationLegSnapshot[],
): RouteLeg[] {
  return legs.map(
    (leg) => ({
      id: leg.id,
      fromStopId:
        leg.fromStopId,
      toStopId:
        leg.toStopId,
      distanceMeters:
        leg.distanceMeters,
      durationSeconds:
        leg.durationSeconds,
      staticDurationSeconds:
        leg.staticDurationSeconds ??
        null,
      encodedPolyline:
        leg.encodedPolyline ??
        null,
      departureTime:
        leg.departureTime ??
        null,
      arrivalTime:
        leg.arrivalTime ??
        null,
    }),
  );
}

function hasGooglePolyline(
  legs: RouteOptimizationLegSnapshot[],
) {
  return legs.some(
    (leg) =>
      typeof leg.encodedPolyline ===
        "string" &&
      leg.encodedPolyline.length > 0,
  );
}

export function useOptimizer({
  routes,
  selectedTechnician,
  optimizationOptions,
  departureTime,
  store,
}: UseOptimizerOptions) {
  const optimizerStore =
    useMemo(
      () =>
        store ??
        createOptimizerStore(),
      [store],
    );

  const routeList =
    useMemo(
      () =>
        normalizeRoutes(
          routes,
        ),
      [routes],
    );

  const visibleRoutes =
    useMemo(
      () =>
        selectedTechnician
          ? routeList.filter(
              (route) =>
                route.technicianName ===
                selectedTechnician,
            )
          : routeList,
      [
        routeList,
        selectedTechnician,
      ],
    );

  const status =
    useOptimizerStore(
      optimizerSelectors.status,
      optimizerStore,
    );

  const error =
    useOptimizerStore(
      optimizerSelectors.error,
      optimizerStore,
    );

  const results =
    useOptimizerStore(
      optimizerSelectors.results,
      optimizerStore,
    );

  const preview =
    useOptimizerStore(
      optimizerSelectors.preview,
      optimizerStore,
    );

  const accepted =
    useOptimizerStore(
      optimizerSelectors.accepted,
      optimizerStore,
    );

  const rejectedTechnicians =
    useOptimizerStore(
      optimizerSelectors
        .rejectedTechnicians,
      optimizerStore,
    );

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const attachRoutePreview =
    useCallback(
      (
        technicianName: string,
      ) => {
        const route =
          findTechnicianRoute(
            routeList,
            technicianName,
          );

        if (!route) {
          return;
        }

        const optimizationResult =
          results[
            technicianName
          ];

        if (
          !optimizationResult ||
          !optimizationResult.success
        ) {
          plannerPreviewStore.actions.setRoutePreview({
            baselineLegs:
              route.legs,
            previewLegs: [],
            verificationMode:
              "local",
            verifiedAt: null,
          });

          return;
        }

        const candidateLegs =
          optimizationResult
            .bestCandidate
            .legs;

        const googleVerified =
          hasGooglePolyline(
            candidateLegs,
          );

        plannerPreviewStore.actions.setRoutePreview({
          baselineLegs:
            route.legs,

          previewLegs:
            toRouteLegs(
              candidateLegs,
            ),

          verificationMode:
            googleVerified
              ? "google"
              : "local",

          /*
           * optimizerActions använder verifiedAt
           * som generatedAt för det verifierade
           * resultatet, så den tidsstämpeln är
           * den bästa tillgängliga här.
           */
          verifiedAt:
            googleVerified
              ? optimizationResult
                  .generatedAt
              : null,
        });
      },
      [
        results,
        routeList,
      ],
    );

  const runOptimization =
    useCallback(() => {
      if (
        visibleRoutes.length ===
        0
      ) {
        optimizerStore.actions.setError(
          "Det finns inga rutter att optimera.",
        );
        return;
      }

      optimizerStore.actions.start();
      plannerPreviewStore.actions.reset();

      startTransition(
        async () => {
          try {
            const entries =
              await Promise.all(
                visibleRoutes.map(
                  async (
                    route,
                  ): Promise<
                    [
                      string,
                      RouteOptimizationResult,
                    ]
                  > => {
                    const result =
                      await optimizeRouteAction({
                        route,
                        options:
                          optimizationOptions,
                        departureTime:
                          departureTime ??
                          null,
                      });

                    return [
                      route.technicianName,
                      result,
                    ];
                  },
                ),
              );

            optimizerStore.actions.setResults(
              Object.fromEntries(
                entries,
              ),
            );
          } catch (
            caughtError
          ) {
            optimizerStore.actions.setError(
              caughtError instanceof
                Error
                ? caughtError.message
                : "Optimeringen kunde inte genomföras.",
            );
          }
        },
      );
    }, [
      departureTime,
      optimizationOptions,
      optimizerStore,
      visibleRoutes,
    ]);

  const previewCandidate =
    useCallback(
      (
        technicianName: string,
        comparison:
          RouteOptimizationComparison,
      ) => {
        optimizerStore.actions.preview(
          technicianName,
          comparison,
        );

        /*
         * Först skapar vi preview-snapshoten.
         */
        plannerPreviewStore.actions.showComparison(
          technicianName,
          comparison,
        );

        /*
         * Sedan fyller vi snapshoten med:
         * - baseline-route från Planner
         * - Google-verifierade candidate legs
         * - encodedPolyline
         * - verification-status
         */
        attachRoutePreview(
          technicianName,
        );
      },
      [
        attachRoutePreview,
        optimizerStore,
      ],
    );

  const clearPreview =
    useCallback(() => {
      optimizerStore.actions.clearPreview();
      plannerPreviewStore.actions.clearPreview();
    }, [
      optimizerStore,
    ]);

  const acceptCandidate =
    useCallback(
      (
        technicianName: string,
        comparison:
          RouteOptimizationComparison,
      ) => {
        optimizerStore.actions.accept(
          technicianName,
          comparison,
        );

        plannerPreviewStore.actions.showComparison(
          technicianName,
          comparison,
        );

        attachRoutePreview(
          technicianName,
        );

        plannerPreviewStore.actions.acceptPreview();
      },
      [
        attachRoutePreview,
        optimizerStore,
      ],
    );

  const rejectCandidate =
    useCallback(
      (
        technicianName: string,
      ) => {
        optimizerStore.actions.reject(
          technicianName,
        );

        const previewState =
          plannerPreviewStore.getState();

        if (
          previewState.snapshot
            ?.technicianName ===
          technicianName
        ) {
          plannerPreviewStore.actions.clearPreview();
        }
      },
      [
        optimizerStore,
      ],
    );

  const resetOptimizer =
    useCallback(() => {
      optimizerStore.actions.reset();
      plannerPreviewStore.actions.reset();
    }, [
      optimizerStore,
    ]);

  return {
    store:
      optimizerStore,

    status,
    isPending,
    error,
    results,

    previewTechnician:
      preview.technicianName,

    previewComparison:
      preview.comparison,

    acceptedTechnician:
      accepted.technicianName,

    acceptedComparison:
      accepted.comparison,

    rejectedTechnicians,
    visibleRoutes,

    runOptimization,
    previewCandidate,
    clearPreview,
    acceptCandidate,
    rejectCandidate,
    resetOptimizer,
  };
}