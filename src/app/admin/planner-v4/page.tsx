import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  MapPinned,
  Route,
  UsersRound,
} from "lucide-react";

import {
  getPlannerData,
} from "../planner/queries";
import PlannerHeroActions from "./PlannerHeroActions";
import PlannerV4Client from "./PlannerV4Client";
import OptimizationHistoryPanel from "./optimizer/OptimizationHistoryPanel";

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

export default async function PlannerV4Page() {
  try {
    const plannerData =
      await getPlannerData();

    const selectedDate =
      getInitialPlannerDate(
        plannerData.events,
      );

    const routeInputTechnicians =
      Array.from(
        plannerData.events.reduce(
          (counts, event) => {
            const eventDate =
              String(
                event.date ?? "",
              ).slice(0, 10);

            const technician =
              event.technician?.trim();

            if (
              eventDate !==
                selectedDate ||
              !technician ||
              !event.city?.trim()
            ) {
              return counts;
            }

            counts.set(
              technician,
              (counts.get(
                technician,
              ) ?? 0) + 1,
            );

            return counts;
          },
          new Map<string, number>(),
        ),
      ).filter(
        ([, jobCount]) =>
          jobCount >= 2,
      ).length;

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
              Ruttunderlag
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {
                routeInputTechnicians
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