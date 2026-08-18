"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  loadGoogleMaps,
  type GoogleMapInstance,
} from "../utils/loadGoogleMaps";

type UseGoogleMapOptions = {
  apiKey?: string;
  container: HTMLDivElement | null;
};

type UseGoogleMapResult = {
  map: GoogleMapInstance | null;
  isLoading: boolean;
  error: string;
};

const DEFAULT_CENTER = {
  lat: 59.3293,
  lng: 18.0686,
};

export function useGoogleMap({
  apiKey,
  container,
}: UseGoogleMapOptions): UseGoogleMapResult {
  const mapRef =
    useRef<GoogleMapInstance | null>(null);

  const [map, setMap] =
    useState<GoogleMapInstance | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const mapContainer = container;

    if (!mapContainer) {
      return;
    }

    if (mapRef.current) {
      setMap(mapRef.current);
      return;
    }

    const googleMapsApiKey = apiKey;

    if (!googleMapsApiKey) {
      setError(
        "Google Maps API-nyckel saknas.",
      );
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function initializeMap(
      apiKeyValue: string,
      containerElement: HTMLDivElement,
    ) {
      try {
        setIsLoading(true);
        setError("");

        await loadGoogleMaps(apiKeyValue);

        if (
          cancelled ||
          mapRef.current ||
          !window.google?.maps
        ) {
          return;
        }

        const createdMap =
          new window.google.maps.Map(
            containerElement,
            {
              center: DEFAULT_CENTER,
              zoom: 10,
              disableDefaultUI: false,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
              backgroundColor: "#0b1020",
            },
          );

        mapRef.current = createdMap;
        setMap(createdMap);
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Google Maps kunde inte initieras.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void initializeMap(
      googleMapsApiKey,
      mapContainer,
    );

    return () => {
      cancelled = true;
    };
  }, [
    apiKey,
    container,
  ]);

  return {
    map,
    isLoading,
    error,
  };
}