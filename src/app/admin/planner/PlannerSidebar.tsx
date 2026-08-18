"use client";

import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleDot,
  Clock3,
  Loader2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
} from "react";
import { updatePlannerEventTechnician } from "./plannerActions";

export type PlannerTechnician = {
  id: string;
  name: string;
  jobCount: number;
};

type Props = {
  technicians: PlannerTechnician[];
  selectedTechnician: string;
  onTechnicianSelect: (value: string) => void;
  plannedCount: number;
  activeCount: number;
  completedCount: number;
};

export default function PlannerSidebar({
  technicians,
  selectedTechnician,
  onTechnicianSelect,
  plannedCount,
  activeCount,
  completedCount,
}: Props) {
  const router = useRouter();

  const [
    dropTarget,
    setDropTarget,
  ] = useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  function readWorkOrderId(
    event: React.DragEvent,
  ) {
    const rawId =
      event.dataTransfer.getData(
        "text/plain",
      );

    const workOrderId =
      Number(rawId);

    return Number.isInteger(workOrderId) &&
      workOrderId > 0
      ? workOrderId
      : null;
  }

  function assignTechnician(
    event: React.DragEvent,
    technician: string | null,
  ) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const workOrderId =
      readWorkOrderId(event);

    if (!workOrderId) {
      setError(
        "Jobbet kunde inte identifieras.",
      );
      setDropTarget(null);
      return;
    }

    setMessage("");
    setError("");
    setDropTarget(null);

    startTransition(async () => {
      const result =
        await updatePlannerEventTechnician({
          workOrderId,
          technician,
        });

      if (!result.success) {
        setError(
          result.message ??
            "Teknikern kunde inte uppdateras.",
        );
        return;
      }

      setMessage(
        result.message ??
          "Teknikern har uppdaterats.",
      );

      router.refresh();
    });
  }

  function handleDragOver(
    event: React.DragEvent,
    target: string,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect =
      "move";

    if (!isPending) {
      setDropTarget(target);
    }
  }

  function handleDragLeave(
    event: React.DragEvent,
  ) {
    const nextTarget =
      event.relatedTarget;

    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(
        nextTarget,
      )
    ) {
      return;
    }

    setDropTarget(null);
  }

  return (
    <aside className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <UsersRound className="h-5 w-5 text-purple-300" />

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
              Team
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Tekniker
            </h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-400">
          Klicka för att filtrera eller dra ett jobb till
          en tekniker för att tilldela det.
        </p>

        {isPending && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-purple-400/20 bg-purple-400/10 p-3 text-sm text-purple-100">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sparar tilldelningen...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {message}
          </div>
        )}

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={() =>
              onTechnicianSelect("")
            }
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
              selectedTechnician === ""
                ? "border-purple-400/30 bg-purple-400/15 text-purple-100"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
            }`}
          >
            <span className="flex items-center gap-3">
              <UsersRound className="h-4 w-4" />
              Alla tekniker
            </span>

            <span className="text-xs text-slate-400">
              {technicians.reduce(
                (sum, technician) =>
                  sum +
                  technician.jobCount,
                0,
              )}
            </span>
          </button>

          <div
            onDragOver={(event) =>
              handleDragOver(
                event,
                "__unassigned__",
              )
            }
            onDragLeave={handleDragLeave}
            onDrop={(event) =>
              assignTechnician(
                event,
                null,
              )
            }
            className={`rounded-2xl border border-dashed px-4 py-3 transition ${
              dropTarget ===
              "__unassigned__"
                ? "border-slate-300/40 bg-slate-300/10 text-white ring-2 ring-slate-300/10"
                : "border-white/10 bg-black/10 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/15">
                <UserRound className="h-4 w-4" />
              </span>

              <div>
                <p className="text-sm font-medium">
                  Ej tilldelad
                </p>

                <p className="mt-0.5 text-xs opacity-65">
                  Släpp här för att ta bort teknikern.
                </p>
              </div>
            </div>
          </div>

          {technicians.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-sm text-slate-500">
              Inga tekniker är tilldelade ännu.
            </div>
          ) : (
            technicians.map(
              (technician) => {
                const isActive =
                  selectedTechnician ===
                  technician.name;

                const isDropTarget =
                  dropTarget ===
                  technician.name;

                return (
                  <div
                    key={technician.id}
                    onDragOver={(event) =>
                      handleDragOver(
                        event,
                        technician.name,
                      )
                    }
                    onDragLeave={
                      handleDragLeave
                    }
                    onDrop={(event) =>
                      assignTechnician(
                        event,
                        technician.name,
                      )
                    }
                    className={`rounded-2xl border transition ${
                      isDropTarget
                        ? "border-blue-400/40 bg-blue-400/15 ring-2 ring-blue-400/10"
                        : isActive
                          ? "border-blue-400/30 bg-blue-400/15"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onTechnicianSelect(
                          technician.name,
                        )
                      }
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-slate-300"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/15">
                          <UserRound className="h-4 w-4" />
                        </span>

                        <span className="min-w-0">
                          <span className="block truncate font-medium text-white">
                            {technician.name}
                          </span>

                          <span className="mt-0.5 block text-xs text-slate-500">
                            {isDropTarget
                              ? "Släpp jobbet här"
                              : "Klicka för att filtrera"}
                          </span>
                        </span>
                      </span>

                      <span className="ml-3 shrink-0 rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-xs text-slate-400">
                        {technician.jobCount}
                      </span>
                    </button>
                  </div>
                );
              },
            )
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <BriefcaseBusiness className="h-5 w-5 text-blue-300" />

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Överblick
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Jobbstatus
            </h2>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-blue-400/15 bg-blue-400/[0.06] p-4">
            <span className="flex items-center gap-3 text-sm font-medium text-blue-100">
              <Clock3 className="h-4 w-4 text-blue-300" />
              Planerade
            </span>

            <span className="text-xl font-bold text-white">
              {plannedCount}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-4">
            <span className="flex items-center gap-3 text-sm font-medium text-amber-100">
              <CircleDot className="h-4 w-4 text-amber-300" />
              Pågående
            </span>

            <span className="text-xl font-bold text-white">
              {activeCount}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
            <span className="flex items-center gap-3 text-sm font-medium text-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Slutförda
            </span>

            <span className="text-xl font-bold text-white">
              {completedCount}
            </span>
          </div>
        </div>
      </section>
    </aside>
  );
}