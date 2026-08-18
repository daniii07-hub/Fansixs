import type {
  LatLngLiteral,
} from "./decodePolyline";

export type GoogleLatLngBounds = {
  extend: (
    position: LatLngLiteral,
  ) => void;
  isEmpty: () => boolean;
};

export type GoogleMapInstance = {
  fitBounds: (
    bounds: GoogleLatLngBounds,
    padding?: number,
  ) => void;
  panTo: (
    position: LatLngLiteral,
  ) => void;
  setZoom: (
    zoom: number,
  ) => void;
  getZoom: () => number | undefined;
};

export type GoogleMapsEventListener = {
  remove: () => void;
};

export type GoogleMarkerInstance = {
  setMap: (
    map: GoogleMapInstance | null,
  ) => void;
  addListener: (
    eventName: "mouseover" | "mouseout",
    handler: () => void,
  ) => GoogleMapsEventListener;
};

export type GooglePolylineInstance = {
  setMap: (
    map: GoogleMapInstance | null,
  ) => void;
};

export type GoogleMapsApi = {
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => GoogleMapInstance;
  Marker: new (
    options: Record<string, unknown>,
  ) => GoogleMarkerInstance;
  Polyline: new (
    options: Record<string, unknown>,
  ) => GooglePolylineInstance;
  LatLngBounds: new () => GoogleLatLngBounds;
};

declare global {
  interface Window {
    google?: {
      maps: GoogleMapsApi;
    };
    __plannerGoogleMapsPromise?: Promise<void>;
  }
}

export function loadGoogleMaps(
  apiKey: string,
): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error(
        "Google Maps kan endast laddas i webbläsaren.",
      ),
    );
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (window.__plannerGoogleMapsPromise) {
    return window.__plannerGoogleMapsPromise;
  }

  const promise = new Promise<void>(
    (resolve, reject) => {
      const existingScript =
        document.querySelector<HTMLScriptElement>(
          'script[data-planner-google-maps="true"]',
        );

      if (existingScript) {
        existingScript.addEventListener(
          "load",
          () => resolve(),
          { once: true },
        );

        existingScript.addEventListener(
          "error",
          () => {
            window.__plannerGoogleMapsPromise =
              undefined;

            reject(
              new Error(
                "Google Maps kunde inte laddas.",
              ),
            );
          },
          { once: true },
        );

        return;
      }

      const script =
        document.createElement("script");

      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
          apiKey,
        )}&v=weekly`;

      script.async = true;
      script.defer = true;
      script.dataset.plannerGoogleMaps =
        "true";

      script.addEventListener(
        "load",
        () => resolve(),
        { once: true },
      );

      script.addEventListener(
        "error",
        () => {
          window.__plannerGoogleMapsPromise =
            undefined;

          reject(
            new Error(
              "Google Maps kunde inte laddas.",
            ),
          );
        },
        { once: true },
      );

      document.head.appendChild(script);
    },
  );

  window.__plannerGoogleMapsPromise =
    promise;

  return promise;
}