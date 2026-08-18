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
  GoogleMarkerInstance,
  GoogleMapsEventListener,
} from "../utils/loadGoogleMaps";

type UseRouteMarkersOptions = {
  map: GoogleMapInstance | null;
  stops: RouteStop[];
  selectedStopId?: string | null;
  hoveredStopId?: string | null;
  onStopHoverChange?: (
    stop: RouteStop | null,
  ) => void;
};

type UseRouteMarkersResult = {
  selectedPosition: LatLngLiteral | null;
  error: string;
};

const SELECTED_MARKER_ICON =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="56" viewBox="0 0 46 56">
      <path fill="#a855f7" stroke="#ffffff" stroke-width="3"
        d="M23 2C11.4 2 2 11.4 2 23c0 15.75 21 31 21 31s21-15.25 21-31C44 11.4 34.6 2 23 2z"/>
      <circle cx="23" cy="23" r="8" fill="#ffffff"/>
    </svg>
  `);

const HOVERED_MARKER_ICON =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="52" viewBox="0 0 46 56">
      <path fill="#c084fc" stroke="#ffffff" stroke-width="3"
        d="M23 2C11.4 2 2 11.4 2 23c0 15.75 21 31 21 31s21-15.25 21-31C44 11.4 34.6 2 23 2z"/>
      <circle cx="23" cy="23" r="7" fill="#ffffff"/>
    </svg>
  `);

export function useRouteMarkers({
  map,
  stops,
  selectedStopId,
  hoveredStopId,
  onStopHoverChange,
}: UseRouteMarkersOptions): UseRouteMarkersResult {
  const [error, setError] =
    useState("");

  const selectedStop =
    selectedStopId
      ? stops.find(
          (stop) =>
            stop.id === selectedStopId,
        ) ?? null
      : null;

  const selectedPosition =
    selectedStop
      ? getStopPosition(selectedStop)
      : null;

  useEffect(() => {
    if (
      !map ||
      !window.google?.maps
    ) {
      setError("");
      return;
    }

    const maps = window.google.maps;
    const markers: GoogleMarkerInstance[] =
      [];
    const listeners:
      GoogleMapsEventListener[] = [];

    try {
      setError("");

      stops.forEach(
        (stop, index) => {
          const position =
            getStopPosition(stop);

          if (!position) {
            return;
          }

          const isSelected =
            stop.id === selectedStopId;

          const isHovered =
            !isSelected &&
            stop.id === hoveredStopId;

          const marker =
            new maps.Marker({
              map,
              position,
              title: stop.label,
              label:
                isSelected || isHovered
                  ? undefined
                  : String(index + 1),
              icon: isSelected
                ? SELECTED_MARKER_ICON
                : isHovered
                  ? HOVERED_MARKER_ICON
                  : undefined,
              zIndex: isSelected
                ? 1000
                : isHovered
                  ? 900
                  : index + 1,
            });

          listeners.push(
            marker.addListener(
              "mouseover",
              () =>
                onStopHoverChange?.(stop),
            ),
            marker.addListener(
              "mouseout",
              () =>
                onStopHoverChange?.(null),
            ),
          );

          markers.push(marker);
        },
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Kartmarkörerna kunde inte visas.",
      );
    }

    return () => {
      listeners.forEach((listener) => {
        listener.remove();
      });

      markers.forEach((marker) => {
        marker.setMap(null);
      });
    };
  }, [
    hoveredStopId,
    map,
    onStopHoverChange,
    selectedStopId,
    stops,
  ]);

  return {
    selectedPosition,
    error,
  };
}