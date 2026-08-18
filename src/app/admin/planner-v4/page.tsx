import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  MapPinned,
  Route,
  UsersRound,
} from "lucide-react";

import type {
  PlannerEventWithDate,
} from "../planner/queries";
import {
  getPlannerData,
} from "../planner/queries";
import PlannerHeroActions from "./PlannerHeroActions";
import PlannerRouteSummary from "./PlannerRouteSummary";
import PlannerV4Client from "./PlannerV4Client";
import OptimizationHistoryPanel from "./optimizer/OptimizationHistoryPanel";
import {
  getRoutesForTechnicians,
} from "./routing/getTechnicianRoute";

export const dynamic =
  "force-dynamic";

function getInitialPlannerDate(
  events: Array<{
    date: string;
  }>,
) {
  const today = new Date();

  const todayKey = [
    today.getFullYear(),
    String(
      today.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      today.getDate(),
    ).padStart(2, "0"),
  ].join("-");

  const dates = events
    .map((event) =>
      String(
        event.date ?? "",
      ).slice(0, 10),
    )
    .filter((date) =>
      /^\d{4}-\d{2}-\d{2}$/.test(
        date,
      ),
    )
    .sort();

  return (
    dates.find(
      (date) =>
        date >= todayKey,
    ) ??
    dates.at(-1) ??
    todayKey
  );
}

function getRoutableTechnicians({
  date,
  events,
}: {
  date: string;
  events: PlannerEventWithDate[];
}) {
  const jobsPerTechnician =
    new Map<string, number>();

  for (const event of events) {
    const eventDate =
      String(
        event.date ?? "",
      ).slice(0, 10);

    const technician =
      event.technician?.trim();

    if (
      eventDate !== date ||
      !technician ||
      !event.city?.trim()
    ) {
      continue;
    }

    jobsPerTechnician.set(
      technician,
      (jobsPerTechnician.get(
        technician,
      ) ?? 0) + 1,
    );
  }

  return Array.from(
    jobsPerTechnician.entries(),
  )
    .filter(
      ([, jobCount]) =>
        jobCount >= 2,
    )
    .map(
      ([technician]) =>
        technician,
    );
}

export default async function PlannerV4Page() {
  try {
    const plannerData =
      await getPlannerData();

    const selectedDate =
      getInitialPlannerDate(
        plannerData.events,
      );

    const routableTechnicians =
      getRoutableTechnicians({
        date: selectedDate,
        events:
          plannerData.events,
      });

    const routeEvents =
      plannerData.events.filter(
        (event) =>
          String(
            event.date ?? "",
          ).slice(0, 10) ===
            selectedDate &&
          Boolean(
            event.city?.trim(),
          ),
      );

    const routeResults =
      routableTechnicians.length >
      0
        ? await getRoutesForTechnicians(
            {
              technicians:
                routableTechnicians,
              date: selectedDate,
              events: routeEvents,
            },
          )
        : {};

    const successfulRoutes =
      Object.values(routeResults)
        .filter(
          (result) =>
            result.success,
        )
        .map(
          (result) =>
            result.route,
        );

    const routeErrors =
      Object.entries(routeResults)
        .filter(
          ([, result]) =>
            !result.success,
        )
        .map(
          ([
            technician,
            result,
          ]) => ({
            technician,
            message:
              result.success
                ? ""
                : result.error
                    .message,
          }),
        );

    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#10182b] via-[#0b1020] to-purple-950/40 p-6 shadow-2xl shadow-black/25 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link
                href="/admin/planner"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Tillbaka till Planner
              </Link>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
                Fansixs Planner V5
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Intelligent planering
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Planera tekniker,
                tider och
                arbetsorder med
                konfliktdetektering,
                Google Routes och
                beräknad körsträcka.
              </p>
            </div>

            <PlannerHeroActions />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-blue-400/15 bg-blue-400/[0.06] p-5">
            <CalendarClock className="h-5 w-5 text-blue-300" />

            <p className="mt-4 text-sm text-blue-100/70">
              Planerade jobb
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {
                plannerData.plannedCount
              }
            </p>
          </article>

          <article className="rounded-3xl border border-amber-400/15 bg-amber-400/[0.06] p-5">
            <Route className="h-5 w-5 text-amber-300" />

            <p className="mt-4 text-sm text-amber-100/70">
              Beräknade rutter
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {
                successfulRoutes.length
              }
            </p>
          </article>

          <article className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.06] p-5">
            <UsersRound className="h-5 w-5 text-emerald-300" />

            <p className="mt-4 text-sm text-emerald-100/70">
              Aktiva tekniker
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {
                plannerData
                  .technicians
                  .length
              }
            </p>
          </article>

          <article className="rounded-3xl border border-purple-400/15 bg-purple-400/[0.06] p-5">
            <MapPinned className="h-5 w-5 text-purple-300" />

            <p className="mt-4 text-sm text-purple-100/70">
              Kalenderhändelser
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {
                plannerData.events
                  .length
              }
            </p>
          </article>
        </section>

        {successfulRoutes.length >
          0 && (
          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
                Google Routes
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-white">
                Ruttöversikt för
                startdatumet
              </h2>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {successfulRoutes.map(
                (route) => (
                  <PlannerRouteSummary
                    key={
                      route.technicianId
                    }
                    route={route}
                  />
                ),
              )}
            </div>
          </section>
        )}

        {routeErrors.length > 0 && (
          <section className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
            <p className="font-semibold text-amber-100">
              Några rutter kunde
              inte beräknas
            </p>

            <div className="mt-3 space-y-2 text-sm text-amber-100/70">
              {routeErrors.map(
                (routeError) => (
                  <p
                    key={
                      routeError.technician
                    }
                  >
                    <span className="font-semibold">
                      {
                        routeError.technician
                      }
                      :
                    </span>{" "}
                    {
                      routeError.message
                    }
                  </p>
                ),
              )}
            </div>
          </section>
        )}

        {routableTechnicians.length ===
          0 && (
          <section className="rounded-3xl border border-white/10 bg-[#0b1020] p-5 text-sm text-slate-400">
            Minst två jobb med
            tekniker och ort behövs
            på samma dag för att en
            rutt ska kunna
            beräknas.
          </section>
        )}

        <section
          id="planner-route-optimizer"
          className="scroll-mt-24"
        >
          <PlannerV4Client
            initialDate={
              selectedDate
            }
            events={
              plannerData.events
            }
            technicians={
              plannerData.technicians
            }
          />
        </section>

        <OptimizationHistoryPanel
          limit={20}
        />
      </div>
    );
  } catch (error) {
    console.error(
      "Planner V5 page error:",
      error,
    );

    return (
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-300">
          Planner V5
        </p>

        <h1 className="mt-3 text-4xl font-bold text-white">
          Intelligent planering
        </h1>

        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">
          {error instanceof Error
            ? error.message
            : "Planner V5 kunde inte laddas."}
        </div>
      </div>
    );
  }
}