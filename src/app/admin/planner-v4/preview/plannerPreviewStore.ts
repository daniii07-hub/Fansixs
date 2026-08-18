"use client";

import {
  useSyncExternalStore,
} from "react";

import type {
  TechnicianRoute,
} from "../routing";
import type {
  RouteOptimizationComparison,
} from "../routing/optimization/types";

export type PlannerPreviewStatus =
  | "idle"
  | "previewing"
  | "accepted";

export type PlannerPreviewVerificationMode =
  | "local"
  | "google"
  | "google-failed";

export type PlannerPreviewRollbackItem = {
  bookingId: number;
  bookingDate: string;
  startTime: string | null;
  endTime: string | null;

  appliedBookingDate: string;
  appliedStartTime: string | null;
  appliedEndTime: string | null;
};

export type PlannerPreviewRollbackSnapshot = {
  technicianName: string;
  candidateId: string;
  createdAt: string;
  items: PlannerPreviewRollbackItem[];
};

export type PlannerAppliedOptimization = {
  technicianName: string;
  candidateId: string;
  appliedAt: string;
  appliedCount: number;
};

export type PlannerPreviewSnapshot = {
  technicianName: string;
  comparison:
    RouteOptimizationComparison;

  stopOrder: string[];
  baselineStopOrder: string[];
  workOrderOrder: number[];
  movedWorkOrderIds: number[];

  /*
   * Route-geometri för kartpreview.
   *
   * Dessa är tomma tills ett separat
   * Google Routes-verifieringssteg matar
   * in riktiga legs för baseline/candidate.
   */
  baselineLegs:
    TechnicianRoute["legs"];
  previewLegs:
    TechnicianRoute["legs"];

  verificationMode:
    PlannerPreviewVerificationMode;
  verifiedAt: string | null;

  createdAt: string;
};

export type PlannerPreviewState = {
  status:
    PlannerPreviewStatus;
  snapshot:
    PlannerPreviewSnapshot | null;
  rollbackSnapshot:
    PlannerPreviewRollbackSnapshot | null;
  appliedOptimization:
    PlannerAppliedOptimization | null;
  updatedAt: string | null;
};

export type PlannerPreviewRoutePayload = {
  baselineLegs?:
    TechnicianRoute["legs"];
  previewLegs?:
    TechnicianRoute["legs"];
  verificationMode?:
    PlannerPreviewVerificationMode;
  verifiedAt?:
    string | null;
};

export type PlannerPreviewActions = {
  showComparison: (
    technicianName: string,
    comparison:
      RouteOptimizationComparison,
  ) => void;

  setRoutePreview: (
    payload:
      PlannerPreviewRoutePayload,
  ) => void;

  acceptPreview: () => void;

  setRollbackSnapshot: (
    snapshot:
      PlannerPreviewRollbackSnapshot,
  ) => void;

  clearRollbackSnapshot: () => void;

  setAppliedOptimization: (
    applied:
      PlannerAppliedOptimization,
  ) => void;

  clearAppliedOptimization: () => void;

  clearPreview: () => void;
  reset: () => void;
};

export type PlannerPreviewStore = {
  getState: () =>
    PlannerPreviewState;
  subscribe: (
    listener: () => void,
  ) => () => void;
  actions:
    PlannerPreviewActions;
};

type Listener = () => void;

const EMPTY_NUMBER_ARRAY =
  Object.freeze(
    [],
  ) as unknown as number[];

const EMPTY_LEGS =
  Object.freeze(
    [],
  ) as unknown as TechnicianRoute["legs"];

const INITIAL_STATE:
  PlannerPreviewState = {
    status: "idle",
    snapshot: null,
    rollbackSnapshot: null,
    appliedOptimization: null,
    updatedAt: null,
  };

function nowIsoString() {
  return new Date().toISOString();
}

function buildWorkOrderOrder(
  comparison:
    RouteOptimizationComparison,
) {
  const stopMap =
    new Map(
      comparison.candidate.stops.map(
        (stop) => [
          stop.id,
          stop,
        ],
      ),
    );

  return comparison.candidate.stopOrder
    .map(
      (stopId) =>
        stopMap.get(stopId)
          ?.workOrderId ??
        null,
    )
    .filter(
      (
        workOrderId,
      ): workOrderId is number =>
        typeof workOrderId ===
          "number" &&
        Number.isInteger(
          workOrderId,
        ) &&
        workOrderId > 0,
    );
}

function buildMovedWorkOrderIds(
  comparison:
    RouteOptimizationComparison,
) {
  const baselineIndexes =
    new Map(
      comparison.baseline.stopOrder.map(
        (
          stopId,
          index,
        ) => [
          stopId,
          index,
        ],
      ),
    );

  const candidateStopMap =
    new Map(
      comparison.candidate.stops.map(
        (stop) => [
          stop.id,
          stop,
        ],
      ),
    );

  return comparison.candidate.stopOrder
    .map(
      (
        stopId,
        candidateIndex,
      ) => {
        const baselineIndex =
          baselineIndexes.get(
            stopId,
          );

        const workOrderId =
          candidateStopMap.get(
            stopId,
          )?.workOrderId;

        if (
          baselineIndex ===
            undefined ||
          baselineIndex ===
            candidateIndex ||
          typeof workOrderId !==
            "number" ||
          !Number.isInteger(
            workOrderId,
          ) ||
          workOrderId <= 0
        ) {
          return null;
        }

        return workOrderId;
      },
    )
    .filter(
      (
        workOrderId,
      ): workOrderId is number =>
        workOrderId !== null,
    );
}

function createSnapshot(
  technicianName: string,
  comparison:
    RouteOptimizationComparison,
): PlannerPreviewSnapshot {
  return {
    technicianName,
    comparison,

    stopOrder: [
      ...comparison.candidate
        .stopOrder,
    ],

    baselineStopOrder: [
      ...comparison.baseline
        .stopOrder,
    ],

    workOrderOrder:
      buildWorkOrderOrder(
        comparison,
      ),

    movedWorkOrderIds:
      buildMovedWorkOrderIds(
        comparison,
      ),

    baselineLegs: [],
    previewLegs: [],

    /*
     * Comparison-data ensam är lokal
     * optimeringsdata. Google-status sätts
     * först när verifieringsflödet explicit
     * matar in riktiga route legs.
     */
    verificationMode:
      "local",
    verifiedAt: null,

    createdAt:
      nowIsoString(),
  };
}

export function createPlannerPreviewStore(
  initialState?:
    Partial<PlannerPreviewState>,
): PlannerPreviewStore {
  let state:
    PlannerPreviewState = {
      ...INITIAL_STATE,
      ...initialState,
    };

  const listeners =
    new Set<Listener>();

  function emit() {
    listeners.forEach(
      (listener) =>
        listener(),
    );
  }

  function setState(
    patch:
      | Partial<PlannerPreviewState>
      | ((
          current:
            PlannerPreviewState,
        ) =>
          Partial<PlannerPreviewState>),
  ) {
    const nextPatch =
      typeof patch ===
      "function"
        ? patch(state)
        : patch;

    const nextState = {
      ...state,
      ...nextPatch,
    };

    if (
      Object.is(
        nextState.status,
        state.status,
      ) &&
      Object.is(
        nextState.snapshot,
        state.snapshot,
      ) &&
      Object.is(
        nextState.rollbackSnapshot,
        state.rollbackSnapshot,
      ) &&
      Object.is(
        nextState.appliedOptimization,
        state.appliedOptimization,
      ) &&
      Object.is(
        nextState.updatedAt,
        state.updatedAt,
      )
    ) {
      return;
    }

    state = nextState;
    emit();
  }

  const actions:
    PlannerPreviewActions = {
    showComparison(
      technicianName,
      comparison,
    ) {
      if (
        !comparison.improved ||
        !comparison.candidate
          .score.feasible
      ) {
        return;
      }

      setState({
        status:
          "previewing",
        snapshot:
          createSnapshot(
            technicianName,
            comparison,
          ),
        updatedAt:
          nowIsoString(),
      });
    },

    setRoutePreview(
      payload,
    ) {
      setState(
        (current) => {
          if (
            !current.snapshot
          ) {
            return {};
          }

          return {
            snapshot: {
              ...current.snapshot,

              baselineLegs:
                payload.baselineLegs
                  ? [
                      ...payload.baselineLegs,
                    ]
                  : current.snapshot
                      .baselineLegs,

              previewLegs:
                payload.previewLegs
                  ? [
                      ...payload.previewLegs,
                    ]
                  : current.snapshot
                      .previewLegs,

              verificationMode:
                payload.verificationMode ??
                current.snapshot
                  .verificationMode,

              verifiedAt:
                payload.verifiedAt !==
                undefined
                  ? payload.verifiedAt
                  : current.snapshot
                      .verifiedAt,
            },

            updatedAt:
              nowIsoString(),
          };
        },
      );
    },

    acceptPreview() {
      if (
        !state.snapshot
      ) {
        return;
      }

      setState({
        status:
          "accepted",
        updatedAt:
          nowIsoString(),
      });
    },

    setRollbackSnapshot(
      rollbackSnapshot,
    ) {
      setState({
        rollbackSnapshot: {
          ...rollbackSnapshot,
          items:
            rollbackSnapshot.items.map(
              (item) => ({
                ...item,
              }),
            ),
        },
        updatedAt:
          nowIsoString(),
      });
    },

    clearRollbackSnapshot() {
      if (
        state.rollbackSnapshot ===
        null
      ) {
        return;
      }

      setState({
        rollbackSnapshot: null,
        updatedAt:
          nowIsoString(),
      });
    },

    setAppliedOptimization(
      appliedOptimization,
    ) {
      setState({
        appliedOptimization: {
          ...appliedOptimization,
        },
        updatedAt:
          nowIsoString(),
      });
    },

    clearAppliedOptimization() {
      if (
        state.appliedOptimization ===
        null
      ) {
        return;
      }

      setState({
        appliedOptimization: null,
        updatedAt:
          nowIsoString(),
      });
    },

    clearPreview() {
      if (
        state.status ===
          "idle" &&
        state.snapshot ===
          null
      ) {
        return;
      }

      setState({
        status: "idle",
        snapshot: null,
        updatedAt:
          nowIsoString(),
      });
    },

    reset() {
      if (
        state.status ===
          "idle" &&
        state.snapshot ===
          null &&
        state.rollbackSnapshot ===
          null &&
        state.appliedOptimization ===
          null &&
        state.updatedAt ===
          null
      ) {
        return;
      }

      state = {
        ...INITIAL_STATE,
      };

      emit();
    },
  };

  return {
    getState: () =>
      state,

    subscribe(listener) {
      listeners.add(
        listener,
      );

      return () =>
        listeners.delete(
          listener,
        );
    },

    actions,
  };
}

export const plannerPreviewStore =
  createPlannerPreviewStore();

export function usePlannerPreviewStore<
  Selected,
>(
  selector: (
    state:
      PlannerPreviewState,
  ) => Selected,
  store:
    PlannerPreviewStore =
      plannerPreviewStore,
): Selected {
  const snapshot =
    useSyncExternalStore(
      store.subscribe,
      store.getState,
      store.getState,
    );

  return selector(
    snapshot,
  );
}

export const plannerPreviewSelectors = {
  status(
    state:
      PlannerPreviewState,
  ) {
    return state.status;
  },

  snapshot(
    state:
      PlannerPreviewState,
  ) {
    return state.snapshot;
  },

  isPreviewing(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.status ===
        "previewing" &&
      state.snapshot !==
        null
    );
  },

  isAccepted(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.status ===
        "accepted" &&
      state.snapshot !==
        null
    );
  },

  technicianName(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.snapshot
        ?.technicianName ??
      null
    );
  },

  workOrderOrder(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.snapshot
        ?.workOrderOrder ??
      EMPTY_NUMBER_ARRAY
    );
  },

  movedWorkOrderIds(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.snapshot
        ?.movedWorkOrderIds ??
      EMPTY_NUMBER_ARRAY
    );
  },

  comparison(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.snapshot
        ?.comparison ??
      null
    );
  },

  baselineLegs(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.snapshot
        ?.baselineLegs ??
      EMPTY_LEGS
    );
  },

  previewLegs(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.snapshot
        ?.previewLegs ??
      EMPTY_LEGS
    );
  },

  verificationMode(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.snapshot
        ?.verificationMode ??
      "local"
    );
  },

  verifiedAt(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.snapshot
        ?.verifiedAt ??
      null
    );
  },
  rollbackSnapshot(
    state:
      PlannerPreviewState,
  ) {
    return state.rollbackSnapshot;
  },

  canRollback(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.rollbackSnapshot !== null &&
      state.rollbackSnapshot.items.length > 0
    );
  },

  appliedOptimization(
    state:
      PlannerPreviewState,
  ) {
    return state.appliedOptimization;
  },

  hasAppliedOptimization(
    state:
      PlannerPreviewState,
  ) {
    return (
      state.appliedOptimization !==
      null
    );
  },

} as const;