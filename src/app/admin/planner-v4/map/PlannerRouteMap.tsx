"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Eye,
  Loader2,
  MapPinned,
  Route as RouteIcon,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import type {
  RouteStop,
  TechnicianRoute,
} from "../routing";
import {
  usePlannerPreview,
} from "../preview/usePlannerPreview";
import {
  decodePolyline,
  type LatLngLiteral,
} from "./utils/decodePolyline";
import {
  loadGoogleMaps,
} from "./utils/loadGoogleMaps";

type Props = {
  apiKey?: string;
  routes:
    | Record<string, TechnicianRoute>
    | TechnicianRoute[];
  selectedTechnician?: string | null;
  activeTechnician?: string | null;

  selectedWorkOrderId?: number | null;
  hoveredWorkOrderId?: number | null;

  onHoveredWorkOrderChange?: (
    workOrderId: number | null,
  ) => void;

  onTechnicianChange?: (
    technician: string,
  ) => void;

  className?: string;
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

function getStopPosition(
  stop: RouteStop,
): LatLngLiteral | null {
  if (!stop.coordinate) {
    return null;
  }

  const {
    latitude,
    longitude,
  } = stop.coordinate;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    lat: latitude,
    lng: longitude,
  };
}

function reorderStops(
  stops: RouteStop[],
  stopOrder: string[],
) {
  if (stopOrder.length === 0) {
    return stops;
  }

  const stopMap =
    new Map(
      stops.map((stop) => [
        stop.id,
        stop,
      ]),
    );

  const orderedStops =
    stopOrder
      .map((stopId) =>
        stopMap.get(stopId),
      )
      .filter(
        (
          stop,
        ): stop is RouteStop =>
          stop !== undefined,
      );

  const orderedIds =
    new Set(
      orderedStops.map(
        (stop) => stop.id,
      ),
    );

  return [
    ...orderedStops,
    ...stops.filter(
      (stop) =>
        !orderedIds.has(stop.id),
    ),
  ];
}

function buildRoutePath(
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

export default function PlannerRouteMap({
  apiKey,
  routes,
  selectedTechnician,
  activeTechnician,

  selectedWorkOrderId = null,
  hoveredWorkOrderId = null,

  onHoveredWorkOrderChange,
  onTechnicianChange,

  className = "",
}: Props) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const {
    isPreviewing,
    technicianName:
      previewTechnicianName,
    snapshot:
      previewSnapshot,
    baselineLegs:
      previewBaselineLegs,
    previewLegs,
    verificationMode,
    verifiedAt,
  } = usePlannerPreview();

  const routeList = useMemo(
    () =>
      normalizeRoutes(routes),
    [routes],
  );

  const requestedTechnician =
    selectedTechnician ??
    activeTechnician ??
    null;

  const [
    internalTechnician,
    setInternalTechnician,
  ] = useState<string | null>(
    requestedTechnician ??
      routeList[0]
        ?.technicianName ??
      null,
  );

  useEffect(() => {
    if (requestedTechnician) {
      setInternalTechnician(
        requestedTechnician,
      );

      return;
    }

    const technicianStillExists =
      internalTechnician !== null &&
      routeList.some(
        (route) =>
          route.technicianName ===
          internalTechnician,
      );

    if (technicianStillExists) {
      return;
    }

    setInternalTechnician(
      routeList[0]
        ?.technicianName ??
        null,
    );
  }, [
    internalTechnician,
    requestedTechnician,
    routeList,
  ]);

  useEffect(() => {
    if (
      isPreviewing &&
      previewTechnicianName
    ) {
      setInternalTechnician(
        previewTechnicianName,
      );
    }
  }, [
    isPreviewing,
    previewTechnicianName,
  ]);

  const activeRoute =
    useMemo(
      () =>
        routeList.find(
          (route) =>
            route.technicianName ===
            internalTechnician,
        ) ??
        routeList[0] ??
        null,
      [
        internalTechnician,
        routeList,
      ],
    );

  const previewAppliesToActiveRoute =
    Boolean(
      isPreviewing &&
        previewSnapshot &&
        activeRoute &&
        previewTechnicianName ===
          activeRoute.technicianName,
    );

  const visibleStops =
    useMemo(() => {
      if (!activeRoute) {
        return [];
      }

      if (
        !previewAppliesToActiveRoute ||
        !previewSnapshot
      ) {
        return activeRoute.stops;
      }

      return reorderStops(
        activeRoute.stops,
        previewSnapshot.stopOrder,
      );
    }, [
      activeRoute,
      previewAppliesToActiveRoute,
      previewSnapshot,
    ]);

  const baselineLegs =
    useMemo(() => {
      if (!activeRoute) {
        return [];
      }

      if (
        previewAppliesToActiveRoute &&
        previewBaselineLegs.length > 0
      ) {
        return previewBaselineLegs;
      }

      return activeRoute.legs;
    }, [
      activeRoute,
      previewAppliesToActiveRoute,
      previewBaselineLegs,
    ]);

  useEffect(() => {
    const mapContainer =
      mapContainerRef.current;

    if (
      !mapContainer ||
      !activeRoute
    ) {
      setIsLoading(false);
      setError("");
      return;
    }

    if (!apiKey) {
      setError(
        "Google Maps API-nyckel saknas.",
      );
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function renderMap(
      apiKeyValue: string,
    ) {
      try {
        setIsLoading(true);
        setError("");

        await loadGoogleMaps(
          apiKeyValue,
        );

        if (
          cancelled ||
          !mapContainerRef.current ||
          !window.google?.maps
        ) {
          return;
        }

        const maps =
          window.google.maps;

        const map =
          new maps.Map(
            mapContainerRef.current,
            {
              center: {
                lat: 59.3293,
                lng: 18.0686,
              },
              zoom: 10,
              disableDefaultUI:
                false,
              mapTypeControl:
                false,
              streetViewControl:
                false,
              fullscreenControl:
                true,
              backgroundColor:
                "#0b1020",
            },
          );

        const bounds =
          new maps.LatLngBounds();

        visibleStops.forEach(
          (stop, index) => {
            const position =
              getStopPosition(
                stop,
              );

            if (!position) {
              return;
            }

            bounds.extend(
              position,
            );

            const workOrderId =
              typeof stop.workOrderId ===
                "number"
                ? stop.workOrderId
                : null;

            const isSelected =
              workOrderId !== null &&
              workOrderId ===
                selectedWorkOrderId;

            const isHovered =
              workOrderId !== null &&
              workOrderId ===
                hoveredWorkOrderId;

            const marker =
              new maps.Marker({
                map,
                position,
                title:
                  stop.label,
                label: {
                  text:
                    String(
                      index + 1,
                    ),
                  color:
                    "#ffffff",
                  fontWeight:
                    "700",
                },
                zIndex:
                  isSelected
                    ? 40
                    : isHovered
                      ? 30
                      : 10,
              });

            if (
              workOrderId !== null &&
              onHoveredWorkOrderChange
            ) {
              marker.addListener(
                "mouseover",
                () => {
                  onHoveredWorkOrderChange(
                    workOrderId,
                  );
                },
              );

              marker.addListener(
                "mouseout",
                () => {
                  onHoveredWorkOrderChange(
                    null,
                  );
                },
              );
            }
          },
        );

        const baselinePath =
          buildRoutePath(
            baselineLegs,
          );

        baselinePath.forEach(
          (position) => {
            bounds.extend(
              position,
            );
          },
        );

        if (
          baselinePath.length >
          0
        ) {
          new maps.Polyline({
            map,
            path:
              baselinePath,
            geodesic:
              true,
            strokeColor:
              previewAppliesToActiveRoute
                ? "#94a3b8"
                : "#7c3aed",
            strokeOpacity:
              previewAppliesToActiveRoute
                ? 0.45
                : 0.9,
            strokeWeight:
              previewAppliesToActiveRoute
                ? 4
                : 5,
            zIndex: 10,
          });
        }

        const previewPath =
          previewAppliesToActiveRoute
            ? buildRoutePath(
                previewLegs,
              )
            : [];

        previewPath.forEach(
          (position) => {
            bounds.extend(
              position,
            );
          },
        );

        if (
          previewPath.length >
          0
        ) {
          new maps.Polyline({
            map,
            path:
              previewPath,
            geodesic:
              true,
            strokeColor:
              "#c026d3",
            strokeOpacity:
              0.96,
            strokeWeight:
              6,
            zIndex: 20,
          });
        }

        if (
          !bounds.isEmpty()
        ) {
          map.fitBounds(
            bounds,
            56,
          );
        }
      } catch (
        caughtError
      ) {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Kartan kunde inte visas.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(
            false,
          );
        }
      }
    }

    void renderMap(
      apiKey,
    );

    return () => {
      cancelled = true;
    };
  }, [
    activeRoute,
    apiKey,
    baselineLegs,
    previewAppliesToActiveRoute,
    previewLegs,
    visibleStops,
    selectedWorkOrderId,
    hoveredWorkOrderId,
    onHoveredWorkOrderChange,
  ]);

  function selectTechnician(
    technician: string,
  ) {
    setInternalTechnician(
      technician,
    );

    onTechnicianChange?.(
      technician,
    );
  }

  const hasVerifiedPreview =
    previewAppliesToActiveRoute &&
    previewLegs.length > 0 &&
    verificationMode ===
      "google";

  return (
    <section
      className={[
        "overflow-hidden rounded-3xl border border-white/[0.08]",
        "bg-[#0b1020] shadow-2xl shadow-black/20",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-4 border-b border-white/[0.07] bg-[#10182b] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
              Google Maps
            </p>

            {previewAppliesToActiveRoute && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-purple-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI Preview
              </span>
            )}

            {hasVerifiedPreview && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                Google verifierad
              </span>
            )}
          </div>

          <h2 className="mt-1 text-xl font-semibold text-white">
            {previewAppliesToActiveRoute
              ? "Nuvarande rutt vs AI-förslag"
              : "Dagens rutt"}
          </h2>

          {activeRoute && (
            <p className="mt-1 text-xs text-slate-500">
              {
                activeRoute.technicianName
              }
            </p>
          )}
        </div>

        {routeList.length > 1 && (
          <select
            value={
              activeRoute?.technicianName ??
              ""
            }
            onChange={(event) =>
              selectTechnician(
                event.target.value,
              )
            }
            aria-label="Välj tekniker"
            className="rounded-xl border border-white/10 bg-[#0b1020] px-4 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
          >
            {routeList.map(
              (route) => (
                <option
                  key={
                    route.technicianId
                  }
                  value={
                    route.technicianName
                  }
                >
                  {
                    route.technicianName
                  }
                </option>
              ),
            )}
          </select>
        )}
      </div>

      <div className="relative min-h-[520px]">
        <div
          ref={mapContainerRef}
          className="absolute inset-0"
          aria-label={
            activeRoute
              ? `Ruttkarta för ${activeRoute.technicianName}`
              : "Ruttkarta"
          }
        />

        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b1020]/85">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#10182b] px-5 py-4 text-sm text-slate-200 shadow-xl">
              <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
              Laddar Google Maps...
            </div>
          </div>
        )}

        {!isLoading &&
          routeList.length ===
            0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <RouteIcon className="h-10 w-10 text-slate-600" />

              <p className="mt-4 font-semibold text-white">
                Ingen rutt att visa
              </p>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Minst två jobb med samma tekniker och giltiga positioner behövs.
              </p>
            </div>
          )}

        {previewAppliesToActiveRoute && (
          <div className="absolute inset-x-4 top-4 z-20 rounded-2xl border border-purple-400/20 bg-[#17102a]/95 p-4 text-sm text-purple-100 shadow-xl backdrop-blur">
            <div className="flex items-start gap-3">
              <Eye className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />

              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  AI-preview aktiv
                </p>

                <p className="mt-1 leading-6 text-purple-100/70">
                  Grå linje visar nuvarande rutt. Lila linje visas när kandidatens Google Routes-data finns tillgänglig.
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  <span className="rounded-full border border-slate-300/10 bg-slate-300/[0.06] px-2.5 py-1 text-slate-300">
                    Baseline
                  </span>

                  <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2.5 py-1 text-fuchsia-200">
                    AI-förslag
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-400">
                    {verificationMode ===
                    "google"
                      ? "Google verifierad"
                      : verificationMode ===
                          "google-failed"
                        ? "Verifiering misslyckades"
                        : "Lokal simulering"}
                  </span>
                </div>

                {verifiedAt && (
                  <p className="mt-2 text-[10px] text-purple-100/45">
                    Verifierad:{" "}
                    {new Date(
                      verifiedAt,
                    ).toLocaleString(
                      "sv-SE",
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="absolute inset-x-4 bottom-4 z-20 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-[#1a1018]/95 p-4 text-sm text-red-200 shadow-xl"
          >
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {activeRoute && (
        <div className="flex flex-col gap-2 border-t border-white/[0.07] bg-[#10182b] px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <MapPinned className="h-4 w-4" />

            {previewAppliesToActiveRoute
              ? `${visibleStops.filter(
                  (stop) =>
                    stop.type ===
                    "job",
                ).length} jobb i föreslagen ordning`
              : `${activeRoute.summary.jobCount} jobb · ${(
                  activeRoute.summary
                    .totalDistanceMeters /
                  1000
                ).toFixed(1)} km`}
          </span>

          <span>
            {previewAppliesToActiveRoute
              ? hasVerifiedPreview
                ? "Google Routes-preview aktiv"
                : "Inväntar verifierad preview-rutt"
              : `${activeRoute.summary.totalDriveMinutes} min körning`}
          </span>
        </div>
      )}
    </section>
  );
}