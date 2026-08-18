"use client";

import {
  useSyncExternalStore,
} from "react";

import type {
  RouteOptimizationComparison,
  RouteOptimizationResult,
} from "../routing/optimization/types";

export type OptimizerStatus =
  | "idle"
  | "running"
  | "ready"
  | "error";

export type OptimizerStoreState = {
  status: OptimizerStatus;
  error: string;
  results: Record<
    string,
    RouteOptimizationResult
  >;
  previewTechnician: string | null;
  previewComparison:
    | RouteOptimizationComparison
    | null;
  acceptedTechnician: string | null;
  acceptedComparison:
    | RouteOptimizationComparison
    | null;
  rejectedTechnicians: Set<string>;
  updatedAt: string | null;
};

export type OptimizerStoreActions = {
  start: () => void;
  setResults: (
    results: Record<
      string,
      RouteOptimizationResult
    >,
  ) => void;
  setError: (
    message: string,
  ) => void;
  preview: (
    technicianName: string,
    comparison: RouteOptimizationComparison,
  ) => void;
  clearPreview: () => void;
  accept: (
    technicianName: string,
    comparison: RouteOptimizationComparison,
  ) => void;
  reject: (
    technicianName: string,
  ) => void;
  clearDecision: (
    technicianName: string,
  ) => void;
  reset: () => void;
};

export type OptimizerStore = {
  getState: () => OptimizerStoreState;
  subscribe: (
    listener: () => void,
  ) => () => void;
  actions: OptimizerStoreActions;
};

type Listener = () => void;

const EMPTY_RESULTS: Record<
  string,
  RouteOptimizationResult
> = Object.freeze({});

const EMPTY_REJECTED =
  new Set<string>();

function createInitialState(): OptimizerStoreState {
  return {
    status: "idle",
    error: "",
    results: EMPTY_RESULTS,
    previewTechnician: null,
    previewComparison: null,
    acceptedTechnician: null,
    acceptedComparison: null,
    rejectedTechnicians:
      EMPTY_REJECTED,
    updatedAt: null,
  };
}

function nowIsoString() {
  return new Date().toISOString();
}

export function createOptimizerStore(
  initialState?: Partial<OptimizerStoreState>,
): OptimizerStore {
  let state: OptimizerStoreState = {
    ...createInitialState(),
    ...initialState,
    results:
      initialState?.results ??
      EMPTY_RESULTS,
    rejectedTechnicians:
      initialState
        ?.rejectedTechnicians
        ? new Set(
            initialState.rejectedTechnicians,
          )
        : EMPTY_REJECTED,
  };

  const listeners =
    new Set<Listener>();

  function emit() {
    listeners.forEach(
      (listener) => listener(),
    );
  }

  function setState(
    updater:
      | Partial<OptimizerStoreState>
      | ((
          current:
            OptimizerStoreState,
        ) => Partial<OptimizerStoreState>),
  ) {
    const patch =
      typeof updater === "function"
        ? updater(state)
        : updater;

    const nextState = {
      ...state,
      ...patch,
    };

    const changed =
      Object.keys(
        patch,
      ).some((key) => {
        const typedKey =
          key as keyof OptimizerStoreState;

        return !Object.is(
          nextState[typedKey],
          state[typedKey],
        );
      });

    if (!changed) {
      return;
    }

    state = nextState;
    emit();
  }

  const actions: OptimizerStoreActions = {
    start() {
      setState({
        status: "running",
        error: "",
        results: EMPTY_RESULTS,
        previewTechnician: null,
        previewComparison: null,
        acceptedTechnician: null,
        acceptedComparison: null,
        rejectedTechnicians:
          EMPTY_REJECTED,
        updatedAt: nowIsoString(),
      });
    },

    setResults(results) {
      setState({
        status: "ready",
        error: "",
        results,
        updatedAt: nowIsoString(),
      });
    },

    setError(message) {
      setState({
        status: "error",
        error: message,
        results: EMPTY_RESULTS,
        updatedAt: nowIsoString(),
      });
    },

    preview(
      technicianName,
      comparison,
    ) {
      if (
        state.previewTechnician ===
          technicianName &&
        state.previewComparison ===
          comparison
      ) {
        return;
      }

      setState({
        previewTechnician:
          technicianName,
        previewComparison:
          comparison,
        updatedAt: nowIsoString(),
      });
    },

    clearPreview() {
      if (
        state.previewTechnician ===
          null &&
        state.previewComparison ===
          null
      ) {
        return;
      }

      setState({
        previewTechnician: null,
        previewComparison: null,
        updatedAt: nowIsoString(),
      });
    },

    accept(
      technicianName,
      comparison,
    ) {
      if (
        !comparison.improved ||
        !comparison.candidate.score
          .feasible
      ) {
        return;
      }

      setState((current) => {
        const rejectedTechnicians =
          new Set(
            current.rejectedTechnicians,
          );

        rejectedTechnicians.delete(
          technicianName,
        );

        return {
          acceptedTechnician:
            technicianName,
          acceptedComparison:
            comparison,
          previewTechnician:
            technicianName,
          previewComparison:
            comparison,
          rejectedTechnicians,
          updatedAt: nowIsoString(),
        };
      });
    },

    reject(technicianName) {
      if (
        state.rejectedTechnicians.has(
          technicianName,
        )
      ) {
        return;
      }

      setState((current) => {
        const rejectedTechnicians =
          new Set(
            current.rejectedTechnicians,
          );

        rejectedTechnicians.add(
          technicianName,
        );

        const isPreviewed =
          current.previewTechnician ===
          technicianName;

        const isAccepted =
          current.acceptedTechnician ===
          technicianName;

        return {
          rejectedTechnicians,
          previewTechnician:
            isPreviewed
              ? null
              : current.previewTechnician,
          previewComparison:
            isPreviewed
              ? null
              : current.previewComparison,
          acceptedTechnician:
            isAccepted
              ? null
              : current.acceptedTechnician,
          acceptedComparison:
            isAccepted
              ? null
              : current.acceptedComparison,
          updatedAt: nowIsoString(),
        };
      });
    },

    clearDecision(
      technicianName,
    ) {
      const isRejected =
        state.rejectedTechnicians.has(
          technicianName,
        );

      const isAccepted =
        state.acceptedTechnician ===
        technicianName;

      if (
        !isRejected &&
        !isAccepted
      ) {
        return;
      }

      setState((current) => {
        const rejectedTechnicians =
          new Set(
            current.rejectedTechnicians,
          );

        rejectedTechnicians.delete(
          technicianName,
        );

        return {
          rejectedTechnicians,
          acceptedTechnician:
            isAccepted
              ? null
              : current.acceptedTechnician,
          acceptedComparison:
            isAccepted
              ? null
              : current.acceptedComparison,
          updatedAt: nowIsoString(),
        };
      });
    },

    reset() {
      const initial =
        createInitialState();

      if (
        state.status ===
          initial.status &&
        state.error ===
          initial.error &&
        state.results ===
          initial.results &&
        state.previewTechnician ===
          null &&
        state.previewComparison ===
          null &&
        state.acceptedTechnician ===
          null &&
        state.acceptedComparison ===
          null &&
        state.rejectedTechnicians ===
          initial.rejectedTechnicians &&
        state.updatedAt === null
      ) {
        return;
      }

      state = initial;
      emit();
    },
  };

  return {
    getState() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    actions,
  };
}

export const optimizerStore =
  createOptimizerStore();

export function useOptimizerStore<
  Selected,
>(
  selector: (
    state: OptimizerStoreState,
  ) => Selected,
  store: OptimizerStore =
    optimizerStore,
): Selected {
  /*
   * React måste få samma snapshot-referens
   * tills store-state faktiskt ändras.
   */
  const snapshot =
    useSyncExternalStore(
      store.subscribe,
      store.getState,
      store.getState,
    );

  return selector(snapshot);
}

export const optimizerSelectors = {
  status(
    state: OptimizerStoreState,
  ) {
    return state.status;
  },

  error(
    state: OptimizerStoreState,
  ) {
    return state.error;
  },

  results(
    state: OptimizerStoreState,
  ) {
    return state.results;
  },

  preview(
    state: OptimizerStoreState,
  ) {
    return {
      technicianName:
        state.previewTechnician,
      comparison:
        state.previewComparison,
    };
  },

  accepted(
    state: OptimizerStoreState,
  ) {
    return {
      technicianName:
        state.acceptedTechnician,
      comparison:
        state.acceptedComparison,
    };
  },

  rejectedTechnicians(
    state: OptimizerStoreState,
  ) {
    return state.rejectedTechnicians;
  },

  hasResults(
    state: OptimizerStoreState,
  ) {
    return (
      Object.keys(
        state.results,
      ).length > 0
    );
  },

  successfulResults(
    state: OptimizerStoreState,
  ) {
    return Object.entries(
      state.results,
    ).filter(
      (
        entry,
      ): entry is [
        string,
        Extract<
          RouteOptimizationResult,
          { success: true }
        >,
      ] => entry[1].success,
    );
  },

  improvedResults(
    state: OptimizerStoreState,
  ) {
    return Object.entries(
      state.results,
    ).filter(
      (
        entry,
      ): entry is [
        string,
        Extract<
          RouteOptimizationResult,
          { success: true }
        >,
      ] =>
        entry[1].success &&
        entry[1].comparison
          .improved,
    );
  },
} as const;