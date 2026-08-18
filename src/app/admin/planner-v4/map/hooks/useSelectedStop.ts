"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  LatLngLiteral,
} from "../utils/decodePolyline";
import type {
  GoogleMapInstance,
} from "../utils/loadGoogleMaps";

type UseSelectedStopOptions = {
  map: GoogleMapInstance | null;
  position: LatLngLiteral | null;
  zoom?: number;
};

type UseSelectedStopResult = {
  error: string;
};

export function useSelectedStop({
  map,
  position,
  zoom = 15,
}: UseSelectedStopOptions): UseSelectedStopResult {
  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!map || !position) {
      setError("");
      return;
    }

    try {
      setError("");

      map.panTo(position);

      const currentZoom =
        map.getZoom();

      if (
        currentZoom === undefined ||
        currentZoom < zoom
      ) {
        map.setZoom(zoom);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Det valda stoppet kunde inte visas.",
      );
    }
  }, [
    map,
    position,
    zoom,
  ]);

  return {
    error,
  };
}