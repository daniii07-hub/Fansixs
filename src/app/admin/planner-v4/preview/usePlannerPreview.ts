"use client";

import {
  useCallback,
} from "react";

import type {
  PlannerAppliedOptimization,
  PlannerPreviewRollbackSnapshot,
  PlannerPreviewRoutePayload,
} from "./plannerPreviewStore";

import {
  plannerPreviewSelectors,
  plannerPreviewStore,
  usePlannerPreviewStore,
} from "./plannerPreviewStore";

import type {
  RouteOptimizationComparison,
} from "../routing/optimization/types";

export function usePlannerPreview() {
  const status =
    usePlannerPreviewStore(
      plannerPreviewSelectors.status,
    );

  const snapshot =
    usePlannerPreviewStore(
      plannerPreviewSelectors.snapshot,
    );

  const isPreviewing =
    usePlannerPreviewStore(
      plannerPreviewSelectors.isPreviewing,
    );

  const isAccepted =
    usePlannerPreviewStore(
      plannerPreviewSelectors.isAccepted,
    );

  const technicianName =
    usePlannerPreviewStore(
      plannerPreviewSelectors.technicianName,
    );

  const workOrderOrder =
    usePlannerPreviewStore(
      plannerPreviewSelectors.workOrderOrder,
    );

  const movedWorkOrderIds =
    usePlannerPreviewStore(
      plannerPreviewSelectors.movedWorkOrderIds,
    );

  const comparison =
    usePlannerPreviewStore(
      plannerPreviewSelectors.comparison,
    );

  const baselineLegs =
    usePlannerPreviewStore(
      plannerPreviewSelectors.baselineLegs,
    );

  const previewLegs =
    usePlannerPreviewStore(
      plannerPreviewSelectors.previewLegs,
    );

  const verificationMode =
    usePlannerPreviewStore(
      plannerPreviewSelectors.verificationMode,
    );

  const verifiedAt =
    usePlannerPreviewStore(
      plannerPreviewSelectors.verifiedAt,
    );

  const rollbackSnapshot =
    usePlannerPreviewStore(
      plannerPreviewSelectors.rollbackSnapshot,
    );

  const canRollback =
    usePlannerPreviewStore(
      plannerPreviewSelectors.canRollback,
    );

  const appliedOptimization =
    usePlannerPreviewStore(
      plannerPreviewSelectors.appliedOptimization,
    );

  const hasAppliedOptimization =
    usePlannerPreviewStore(
      plannerPreviewSelectors.hasAppliedOptimization,
    );

  const showPreview =
    useCallback(
      (
        technician: string,
        comparison:
          RouteOptimizationComparison,
      ) => {
        plannerPreviewStore.actions.showComparison(
          technician,
          comparison,
        );
      },
      [],
    );

  const setRoutePreview =
    useCallback(
      (
        payload:
          PlannerPreviewRoutePayload,
      ) => {
        plannerPreviewStore.actions.setRoutePreview(
          payload,
        );
      },
      [],
    );

  const setRollbackSnapshot =
    useCallback(
      (
        rollback:
          PlannerPreviewRollbackSnapshot,
      ) => {
        plannerPreviewStore.actions.setRollbackSnapshot(
          rollback,
        );
      },
      [],
    );

  const clearRollbackSnapshot =
    useCallback(() => {
      plannerPreviewStore.actions.clearRollbackSnapshot();
    }, []);

  const setAppliedOptimization =
    useCallback(
      (
        applied:
          PlannerAppliedOptimization,
      ) => {
        plannerPreviewStore.actions.setAppliedOptimization(
          applied,
        );
      },
      [],
    );

  const clearAppliedOptimization =
    useCallback(() => {
      plannerPreviewStore.actions.clearAppliedOptimization();
    }, []);

  const acceptPreview =
    useCallback(() => {
      plannerPreviewStore.actions.acceptPreview();
    }, []);

  const clearPreview =
    useCallback(() => {
      plannerPreviewStore.actions.clearPreview();
    }, []);

  const resetPreview =
    useCallback(() => {
      plannerPreviewStore.actions.reset();
    }, []);

  return {
    status,
    snapshot,

    comparison,

    technicianName,

    workOrderOrder,
    movedWorkOrderIds,

    baselineLegs,
    previewLegs,

    verificationMode,
    verifiedAt,

    rollbackSnapshot,
    canRollback,

    appliedOptimization,
    hasAppliedOptimization,

    isPreviewing,
    isAccepted,

    showPreview,
    setRoutePreview,

    setRollbackSnapshot,
    clearRollbackSnapshot,

    setAppliedOptimization,
    clearAppliedOptimization,

    acceptPreview,
    clearPreview,
    resetPreview,
  };
}