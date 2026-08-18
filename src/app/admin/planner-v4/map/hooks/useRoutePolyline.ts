"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  TechnicianRoute,
} from "../../routing";
import {
  decodePolyline,
  type LatLngLiteral,
} from "../utils/decodePolyline";
import type {
  GoogleMapInstance,
} from "../utils/loadGoogleMaps";

type GoogleMapOverlay = {
  setMap: (
    map: GoogleMapInstance | null,
  ) => void;
};

type UseRoutePolylineOptions = {
  map: GoogleMapInstance | null;

  /**
   * Nuvarande/baseline-rutt.
   *
   * Behålls som `legs` för bakåtkompatibilitet
   * med befintliga PlannerRouteMap-anrop.
   */
  legs: TechnicianRoute["legs"];

  /**
   * Valfri Google Routes-verifierad preview-rutt.
   * När denna skickas in kan hooken rita både
   * baseline och AI-förslag samtidigt.
   */
  previewLegs?: TechnicianRoute["legs"];

  /**
   * Anger om preview-läget är aktivt.
   * Baseline tonas då ned när preview-path finns.
   */
  previewActive?: boolean;
};

type UseRoutePolylineResult = {
  /**
   * Bakåtkompatibelt alias.
   * Returnerar previewPath när preview finns,
   * annars baselinePath.
   */
  path: LatLngLiteral[];

  baselinePath: LatLngLiteral[];
  previewPath: LatLngLiteral[];
  error: string;
};

function buildPath(
  legs: TechnicianRoute["legs"],
) {
  return legs.flatMap(
    (leg) =>
      leg.encodedPolyline
        ? decodePolyline(
            leg.encodedPolyline,
          )
        : [],
  );
}

export function useRoutePolyline({
  map,
  legs,
  previewLegs = [],
  previewActive = false,
}: UseRoutePolylineOptions): UseRoutePolylineResult {
  const [error, setError] =
    useState("");

  const baselinePath =
    useMemo(
      () =>
        buildPath(legs),
      [legs],
    );

  const previewPath =
    useMemo(
      () =>
        buildPath(
          previewLegs,
        ),
      [previewLegs],
    );

  const hasPreviewPath =
    previewActive &&
    previewPath.length > 0;

  useEffect(() => {
    if (
      !map ||
      !window.google?.maps
    ) {
      setError("");
      return;
    }

    let baselinePolyline:
      GoogleMapOverlay | null =
      null;

    let previewPolyline:
      GoogleMapOverlay | null =
      null;

    try {
      setError("");

      if (
        baselinePath.length >
        0
      ) {
        baselinePolyline =
          new window.google.maps.Polyline({
            map,
            path:
              baselinePath,
            geodesic:
              true,

            /*
             * Baseline ska fortfarande vara tydlig
             * i normalt läge, men tonas ned när en
             * verifierad preview visas ovanpå.
             */
            strokeColor:
              hasPreviewPath
                ? "#94a3b8"
                : "#7c3aed",
            strokeOpacity:
              hasPreviewPath
                ? 0.45
                : 0.9,
            strokeWeight:
              hasPreviewPath
                ? 4
                : 5,
            zIndex: 10,
          }) as GoogleMapOverlay;
      }

      if (hasPreviewPath) {
        previewPolyline =
          new window.google.maps.Polyline({
            map,
            path:
              previewPath,
            geodesic:
              true,
            strokeColor:
              "#c026d3",
            strokeOpacity:
              0.95,
            strokeWeight:
              6,
            zIndex: 20,
          }) as GoogleMapOverlay;
      }
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Ruttlinjen kunde inte visas.",
      );
    }

    return () => {
      baselinePolyline?.setMap(
        null,
      );

      previewPolyline?.setMap(
        null,
      );
    };
  }, [
    map,
    baselinePath,
    previewPath,
    hasPreviewPath,
  ]);

  return {
    path:
      hasPreviewPath
        ? previewPath
        : baselinePath,
    baselinePath,
    previewPath,
    error,
  };
}