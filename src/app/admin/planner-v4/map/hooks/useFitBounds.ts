"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  RouteStop,
} from "../../routing";
import type {
  LatLngLiteral,
} from "../utils/decodePolyline";
import {
  getStopPosition,
} from "../utils/getStopPosition";
import type {
  GoogleMapInstance,
} from "../utils/loadGoogleMaps";

type UseFitBoundsOptions = {
  map: GoogleMapInstance | null;
  stops: RouteStop[];
  path: LatLngLiteral[];
  padding?: number;
};

type UseFitBoundsResult = {
  error: string;
};

export function useFitBounds({
  map,
  stops,
  path,
  padding = 56,
}: UseFitBoundsOptions): UseFitBoundsResult {
  const [error, setError] =
    useState("");

  useEffect(() => {
    if (
      !map ||
      !window.google?.maps
    ) {
      setError("");
      return;
    }

    try {
      setError("");

      const bounds =
        new window.google.maps.LatLngBounds();

      stops.forEach((stop) => {
        const position =
          getStopPosition(stop);

        if (position) {
          bounds.extend(position);
        }
      });

      path.forEach((position) => {
        bounds.extend(position);
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(
          bounds,
          padding,
        );
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Kartan kunde inte anpassa zoomen till rutten.",
      );
    }
  }, [
    map,
    padding,
    path,
    stops,
  ]);

  return {
    error,
  };
}