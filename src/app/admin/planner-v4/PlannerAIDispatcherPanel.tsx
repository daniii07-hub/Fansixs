"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  Bot,
  ChevronRight,
  CircleCheck,
  Clock3,
  Gauge,
  ArrowRight,
  MapPinned,
  Route,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import type {
  RouteLeg,
  RouteStop,
  TechnicianRoute,
} from "./routing";
import type {
  PlannerEventWithDate,
} from "../planner/queries";
import {
  analyzeDispatcher,
} from "./dispatcher/analyzeDispatcher";
import type {
  DispatcherMoveCandidate,
} from "./dispatcher";
import {
  verifyDispatcherCandidateAction,
} from "./dispatcher/verifyDispatcherCandidateAction";
import type {
  DispatcherVerificationResult,
} from "./dispatcher/verifyDispatcherCandidateAction";
import DispatcherPreviewPanel from "./dispatcher/DispatcherPreviewPanel";

type InsightSeverity =
  | "info"
  | "warning"
  | "success";

type DispatcherInsight = {
  id: string;
  severity: InsightSeverity;
  technicianName: string;
  title: string;
  description: string;
  metric?: string;
  workOrderId?: number | null;
};

type Technician = {
  id: string;
  name: string;
};

type Props = {
  routes:
    | Record<string, TechnicianRoute>
    | TechnicianRoute[];
  events: PlannerEventWithDate[];
  technicians: Technician[];
  onJobSelect?: (
    workOrderId: number,
  ) => void;
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

function getStopById(
  stops: RouteStop[],
  stopId: string,
) {
  return (
    stops.find(
      (stop) => stop.id === stopId,
    ) ?? null
  );
}

function getLongestLeg(
  legs: RouteLeg[],
) {
  return (
    [...legs].sort(
      (a, b) =>
        b.durationSeconds -
        a.durationSeconds,
    )[0] ?? null
  );
}

function buildInsights(
  routes: TechnicianRoute[],
): DispatcherInsight[] {
  const insights: DispatcherInsight[] =
    [];

  for (const route of routes) {
    const {
      summary,
      technicianName,
    } = route;

    const trafficDelayMinutes =
      summary.totalStaticDurationSeconds ==
      null
        ? 0
        : Math.max(
            0,
            Math.round(
              (summary.totalDurationSeconds -
                summary.totalStaticDurationSeconds) /
                60,
            ),
          );

    if (trafficDelayMinutes >= 10) {
      const longestLeg =
        getLongestLeg(route.legs);

      const destinationStop =
        longestLeg
          ? getStopById(
              route.stops,
              longestLeg.toStopId,
            )
          : null;

      insights.push({
        id: `${route.technicianId}-traffic`,
        severity: "warning",
        technicianName,
        title:
          "Trafiken påverkar dagens rutt",
        description:
          "Den beräknade körtiden är tydligt längre än rutten utan trafik.",
        metric: `+${trafficDelayMinutes} min`,
        workOrderId:
          destinationStop?.workOrderId ??
          null,
      });
    }

    if (summary.totalDriveMinutes >= 120) {
      const longestLeg =
        getLongestLeg(route.legs);

      const destinationStop =
        longestLeg
          ? getStopById(
              route.stops,
              longestLeg.toStopId,
            )
          : null;

      insights.push({
        id: `${route.technicianId}-drive`,
        severity: "warning",
        technicianName,
        title:
          "Hög total körtid",
        description:
          "Dagen innehåller mycket transporttid. Den längsta sträckan är en bra kandidat för omplanering.",
        metric:
          `${summary.totalDriveMinutes} min körning`,
        workOrderId:
          destinationStop?.workOrderId ??
          null,
      });
    }

    if (summary.totalWorkMinutes > 480) {
      insights.push({
        id: `${route.technicianId}-workday`,
        severity: "warning",
        technicianName,
        title:
          "Arbetsdagen överskrider åtta timmar",
        description:
          "Servicetid och körning ger en lång total arbetsdag. Kontrollera belastningen innan schemat låses.",
        metric:
          `${Math.floor(
            summary.totalWorkMinutes / 60,
          )} h ${summary.totalWorkMinutes % 60} min`,
      });
    }

    const distancePerJob =
      summary.jobCount > 0
        ? summary.totalDistanceMeters /
          1000 /
          summary.jobCount
        : 0;

    if (
      summary.jobCount >= 2 &&
      distancePerJob >= 25
    ) {
      insights.push({
        id: `${route.technicianId}-distance`,
        severity: "info",
        technicianName,
        title:
          "Stor körsträcka per jobb",
        description:
          "Jobben ligger geografiskt utspridda. En annan tekniker eller dag kan ge en tätare rutt.",
        metric:
          `${distancePerJob.toFixed(
            1,
          )} km per jobb`,
      });
    }

    route.warnings.forEach(
      (warning, index) => {
        insights.push({
          id: `${route.technicianId}-provider-${index}`,
          severity: "warning",
          technicianName,
          title:
            "Ruttmotorn rapporterar en varning",
          description: warning,
        });
      },
    );

    const hasRouteInsight =
      insights.some((insight) =>
        insight.id.startsWith(
          `${route.technicianId}-`,
        ),
      );

    if (!hasRouteInsight) {
      insights.push({
        id: `${route.technicianId}-healthy`,
        severity: "success",
        technicianName,
        title:
          "Dagens rutt ser balanserad ut",
        description:
          "Ingen tydlig risk hittades i körsträcka, körtid eller total arbetsdag.",
        metric:
          `${summary.jobCount} jobb · ${summary.totalDriveMinutes} min körning`,
      });
    }
  }

  return insights;
}

function formatSignedMinutes(
  value: number,
) {
  if (value > 0) {
    return `-${value} min`;
  }

  if (value < 0) {
    return `+${Math.abs(value)} min`;
  }

  return "0 min";
}

function formatSignedDistance(
  value: number,
) {
  const kilometers =
    Math.abs(value) / 1000;

  if (value > 0) {
    return `-${kilometers.toFixed(1)} km`;
  }

  if (value < 0) {
    return `+${kilometers.toFixed(1)} km`;
  }

  return "0.0 km";
}

function getDispatcherReasonLabel(
  reason:
    DispatcherMoveCandidate["reason"],
) {
  if (
    reason ===
    "reduce_drive_time"
  ) {
    return "Minska körtid";
  }

  if (
    reason ===
    "reduce_distance"
  ) {
    return "Minska körsträcka";
  }

  return "Balansera arbetsbelastning";
}

function getVerificationLabel(
  result:
    DispatcherVerificationResult,
) {
  if (!result.success) {
    return "Verifiering misslyckades";
  }

  if (result.status === "improved") {
    return "Verifierad förbättring";
  }

  if (result.status === "worse") {
    return "Verifierad försämring";
  }

  return "Verifierad neutral";
}

function getVerificationStyles(
  result:
    DispatcherVerificationResult,
) {
  if (!result.success) {
    return "border-red-400/20 bg-red-400/[0.06] text-red-200";
  }

  if (result.status === "improved") {
    return "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200";
  }

  if (result.status === "worse") {
    return "border-red-400/20 bg-red-400/[0.06] text-red-200";
  }

  return "border-slate-400/20 bg-slate-400/[0.06] text-slate-300";
}

const severityStyles = {
  info: {
    card:
      "border-blue-400/20 bg-blue-400/[0.06]",
    icon:
      "bg-blue-400/10 text-blue-300",
  },
  warning: {
    card:
      "border-amber-400/20 bg-amber-400/[0.07]",
    icon:
      "bg-amber-400/10 text-amber-300",
  },
  success: {
    card:
      "border-emerald-400/20 bg-emerald-400/[0.06]",
    icon:
      "bg-emerald-400/10 text-emerald-300",
  },
} satisfies Record<
  InsightSeverity,
  {
    card: string;
    icon: string;
  }
>;

function InsightIcon({
  severity,
}: {
  severity: InsightSeverity;
}) {
  if (severity === "warning") {
    return (
      <TriangleAlert className="h-5 w-5" />
    );
  }

  if (severity === "success") {
    return (
      <CircleCheck className="h-5 w-5" />
    );
  }

  return <Gauge className="h-5 w-5" />;
}

export default function PlannerAIDispatcherPanel({
  routes,
  events,
  technicians,
  onJobSelect,
}: Props) {
  const routeList =
    useMemo(
      () =>
        normalizeRoutes(
          routes,
        ),
      [routes],
    );

  const insights =
    useMemo(
      () =>
        buildInsights(
          routeList,
        ),
      [routeList],
    );

  const dispatcherAnalysis =
    useMemo(
      () =>
        analyzeDispatcher(
          routeList,
          {
            events,
            technicians,
          },
          {
            maxCandidates: 8,
            maxTargetWorkMinutes: 480,
            minimumEstimatedDriveMinutesSaved: 0,
          },
        ),
      [
        events,
        routeList,
        technicians,
      ],
    );

  const dispatcherCandidates =
    dispatcherAnalysis.candidates.filter(
      (candidate) =>
        candidate.status ===
        "candidate",
    );

  const bestDispatcherCandidate =
    dispatcherAnalysis.bestCandidate;

  const [
    verificationResult,
    setVerificationResult,
  ] =
    useState<DispatcherVerificationResult | null>(
      null,
    );

  const [
    isVerifying,
    startVerification,
  ] = useTransition();

  const [
    isPreviewOpen,
    setIsPreviewOpen,
  ] = useState(false);

  useEffect(() => {
    setVerificationResult(
      null,
    );

    setIsPreviewOpen(
      false,
    );
  }, [
    bestDispatcherCandidate?.id,
  ]);

  const verifyBestCandidate =
    () => {
      if (
        !bestDispatcherCandidate
      ) {
        return;
      }

      const sourceRoute =
        routeList.find(
          (route) =>
            route.technicianName ===
            bestDispatcherCandidate.sourceTechnician,
        );

      const targetRoute =
        routeList.find(
          (route) =>
            route.technicianName ===
            bestDispatcherCandidate.targetTechnician,
        );

      if (!sourceRoute) {
        setVerificationResult({
          success: false,
          code: "INVALID_INPUT",
          message:
            "Källteknikerns rutt kunde inte hittas.",
        });

        return;
      }

      startVerification(
        async () => {
          const result =
            await verifyDispatcherCandidateAction({
              candidate:
                bestDispatcherCandidate,
              sourceRoute,
              targetRoute:
                targetRoute ?? null,
              events,
            });

          setVerificationResult(
            result,
          );

          setIsPreviewOpen(
            result.success,
          );
        },
      );
    };

  if (routeList.length === 0) {
    return null;
  }

  const warningCount =
    insights.filter(
      (insight) =>
        insight.severity === "warning",
    ).length;

  const totalDistanceKm =
    routeList.reduce(
      (total, route) =>
        total +
        route.summary
          .totalDistanceMeters,
      0,
    ) / 1000;

  const totalDriveMinutes =
    routeList.reduce(
      (total, route) =>
        total +
        route.summary
          .totalDriveMinutes,
      0,
    );

  return (
    <section className="overflow-hidden rounded-3xl border border-purple-400/20 bg-[#0b1020] shadow-2xl shadow-black/20">
      <div className="border-b border-white/[0.07] bg-gradient-to-r from-purple-500/15 via-fuchsia-500/10 to-transparent px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-400/10 text-purple-200">
              <Bot className="h-6 w-6" />
            </span>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
                AI Dispatcher · Preview
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Analys av dagens planering
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                Regelbaserad lokal analys av Route Engine-data. Inga jobb flyttas automatiskt i denna version.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-lg font-semibold text-white">
                {warningCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                risker
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-lg font-semibold text-white">
                {totalDistanceKm.toFixed(
                  0,
                )}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                km
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-lg font-semibold text-white">
                {totalDriveMinutes}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                körmin
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/[0.07] bg-[#0e1525] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fuchsia-300" />

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fuchsia-300">
                Dispatcher Engine V1
              </p>
            </div>

            <h3 className="mt-1 text-base font-semibold text-white">
              Förslag på omfördelning mellan tekniker
            </h3>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Lokal uppskattning baserad på koordinater, körtid och arbetsbelastning. Förslagen ändrar inte Planner.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-400">
              {dispatcherAnalysis.candidatesEvaluated} flyttar analyserade
            </span>

            <span className="rounded-full border border-fuchsia-400/15 bg-fuchsia-400/[0.06] px-3 py-1.5 text-fuchsia-200">
              {dispatcherCandidates.length} kandidater
            </span>
          </div>
        </div>

        {bestDispatcherCandidate ? (
          <div className="mt-4 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/[0.07] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-fuchsia-200">
                    Bästa förslag
                  </span>

                  <span className="text-xs font-semibold text-slate-500">
                    Jobb #{bestDispatcherCandidate.workOrderId}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-base font-semibold text-white">
                  <span>
                    {bestDispatcherCandidate.sourceTechnician}
                  </span>

                  <ArrowRight className="h-4 w-4 text-fuchsia-300" />

                  <span>
                    {bestDispatcherCandidate.targetTechnician}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  {getDispatcherReasonLabel(
                    bestDispatcherCandidate.reason,
                  )}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    Körtid
                  </p>

                  <p className="mt-1 font-semibold text-emerald-300">
                    {formatSignedMinutes(
                      bestDispatcherCandidate.estimatedDriveMinutesSaved,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    Sträcka
                  </p>

                  <p className="mt-1 font-semibold text-emerald-300">
                    {formatSignedDistance(
                      bestDispatcherCandidate.estimatedDistanceMetersSaved,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    Score
                  </p>

                  <p className="mt-1 font-semibold text-white">
                    {bestDispatcherCandidate.score.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
                <p className="text-xs font-semibold text-slate-300">
                  {bestDispatcherCandidate.sourceTechnician}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {bestDispatcherCandidate.sourceImpact.beforeJobCount} →{" "}
                  {bestDispatcherCandidate.sourceImpact.estimatedAfterJobCount} jobb
                  {" · "}
                  {bestDispatcherCandidate.sourceImpact.beforeWorkMinutes} →{" "}
                  {bestDispatcherCandidate.sourceImpact.estimatedAfterWorkMinutes} min arbete
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
                <p className="text-xs font-semibold text-slate-300">
                  {bestDispatcherCandidate.targetTechnician}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {bestDispatcherCandidate.targetImpact.beforeJobCount} →{" "}
                  {bestDispatcherCandidate.targetImpact.estimatedAfterJobCount} jobb
                  {" · "}
                  {bestDispatcherCandidate.targetImpact.beforeWorkMinutes} →{" "}
                  {bestDispatcherCandidate.targetImpact.estimatedAfterWorkMinutes} min arbete
                </p>
              </div>
            </div>

            {bestDispatcherCandidate.warnings.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] px-3 py-2 text-xs leading-5 text-amber-200/80">
                {bestDispatcherCandidate.warnings.join(" ")}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={
                  verifyBestCandidate
                }
                disabled={
                  isVerifying
                }
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/[0.12] disabled:cursor-wait disabled:opacity-60"
              >
                <Route className="h-4 w-4" />

                {isVerifying
                  ? "Verifierar med Google Routes..."
                  : "Verifiera med Google Routes"}
              </button>

              {onJobSelect && (
                <button
                  type="button"
                  onClick={() =>
                    onJobSelect(
                      bestDispatcherCandidate.workOrderId,
                    )
                  }
                  className="inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-300 transition hover:text-fuchsia-200"
                >
                  Visa jobb #{bestDispatcherCandidate.workOrderId}
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {verificationResult && (
              <>
                <div
                  className={`mt-4 rounded-2xl border p-4 ${getVerificationStyles(
                    verificationResult,
                  )}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {getVerificationLabel(
                          verificationResult,
                        )}
                      </p>

                      {!verificationResult.success && (
                        <p className="mt-1 text-xs leading-5 opacity-80">
                          {verificationResult.message}
                        </p>
                      )}

                      {verificationResult.success && (
                        <p className="mt-1 text-xs leading-5 opacity-75">
                          Google Routes har verifierat båda teknikernas simulerade rutter.
                        </p>
                      )}
                    </div>

                    {verificationResult.success && (
                      <button
                        type="button"
                        onClick={() =>
                          setIsPreviewOpen(
                            (current) =>
                              !current,
                          )
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-current/20 bg-black/10 px-3 py-2 text-xs font-semibold transition hover:bg-black/20"
                      >
                        <Route className="h-4 w-4" />

                        {isPreviewOpen
                          ? "Dölj preview"
                          : "Visa preview"}
                      </button>
                    )}
                  </div>
                </div>

                {verificationResult.success &&
                  isPreviewOpen && (
                    <div className="mt-4">
                      <DispatcherPreviewPanel
                        result={
                          verificationResult
                        }
                        onClose={() =>
                          setIsPreviewOpen(
                            false,
                          )
                        }
                        onJobSelect={
                          onJobSelect
                        }
                      />
                    </div>
                  )}
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-sm text-slate-500">
            Ingen tydlig omfördelningskandidat hittades för dagens rutter.
          </div>
        )}

        {dispatcherCandidates.length > 1 && (
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {dispatcherCandidates
              .filter(
                (candidate) =>
                  candidate.id !==
                  bestDispatcherCandidate?.id,
              )
              .slice(0, 4)
              .map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() =>
                    onJobSelect?.(
                      candidate.workOrderId,
                    )
                  }
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-left transition hover:bg-white/[0.045]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-300">
                      Jobb #{candidate.workOrderId}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      {candidate.sourceTechnician}
                      <ArrowRight className="h-3 w-3" />
                      {candidate.targetTechnician}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-semibold text-emerald-300">
                    {formatSignedMinutes(
                      candidate.estimatedDriveMinutesSaved,
                    )}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-2">
        {insights.map((insight) => {
          const style =
            severityStyles[
              insight.severity
            ];

          return (
            <article
              key={insight.id}
              className={`rounded-2xl border p-4 ${style.card}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
                >
                  <InsightIcon
                    severity={
                      insight.severity
                    }
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {
                        insight.technicianName
                      }
                    </p>

                    {insight.metric && (
                      <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
                        {insight.metric}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 font-semibold text-white">
                    {insight.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {insight.description}
                  </p>

                  {insight.workOrderId &&
                    onJobSelect && (
                      <button
                        type="button"
                        onClick={() =>
                          onJobSelect(
                            insight.workOrderId!,
                          )
                        }
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-purple-300 transition hover:text-purple-200"
                      >
                        Visa berört jobb
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-3 border-t border-white/[0.07] bg-[#10182b] px-5 py-4 text-xs text-slate-500 sm:grid-cols-3">
        <span className="flex items-center gap-2">
          <Route className="h-4 w-4" />
          {dispatcherAnalysis.technicianCount} tekniker analyserade
        </span>

        <span className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          Route Engine-data
        </span>

        <span className="flex items-center gap-2">
          <MapPinned className="h-4 w-4" />
          Inga automatiska ändringar
        </span>
      </div>
    </section>
  );
}