"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Loader2,
  RotateCcw,
} from "lucide-react";

type ChecklistItem = {
  id: number;
  work_order_id: number;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at?: string;
};

type Props = {
  workOrderId: number;
};

type ApiResponse = {
  success?: boolean;
  items?: ChecklistItem[];
  item?: ChecklistItem;
  message?: string;
};

export default function Checklist({
  workOrderId,
}: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const completedCount = useMemo(
    () => items.filter((item) => item.completed).length,
    [items],
  );

  const progress =
    items.length > 0
      ? Math.round(
          (completedCount / items.length) * 100,
        )
      : 0;

  useEffect(() => {
    let cancelled = false;

    async function loadChecklist() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/work-orders/checklist?workOrderId=${workOrderId}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const responseText = await response.text();

        let data: ApiResponse = {};

        if (responseText) {
          try {
            data = JSON.parse(
              responseText,
            ) as ApiResponse;
          } catch {
            throw new Error(
              "Servern returnerade ett ogiltigt svar.",
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Checklistan kunde inte hämtas.",
          );
        }

        if (!cancelled) {
          setItems(
            Array.isArray(data.items) ? data.items : [],
          );
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Checklistan kunde inte hämtas.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadChecklist();

    return () => {
      cancelled = true;
    };
  }, [workOrderId]);

  async function toggleItem(item: ChecklistItem) {
    if (updatingId !== null) {
      return;
    }

    setUpdatingId(item.id);
    setError("");
    setSuccess("");

    const nextCompleted = !item.completed;

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              completed: nextCompleted,
            }
          : currentItem,
      ),
    );

    try {
      const response = await fetch(
        "/api/work-orders/checklist",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: item.id,
            workOrderId,
            completed: nextCompleted,
          }),
        },
      );

      const responseText = await response.text();

      let data: ApiResponse = {};

      if (responseText) {
        try {
          data = JSON.parse(
            responseText,
          ) as ApiResponse;
        } catch {
          throw new Error(
            "Servern returnerade ett ogiltigt svar.",
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Checklistan kunde inte uppdateras.",
        );
      }

      if (data.item) {
        setItems((currentItems) =>
          currentItems.map((currentItem) =>
            currentItem.id === data.item?.id
              ? data.item
              : currentItem,
          ),
        );
      }

      setSuccess(
        nextCompleted
          ? "Momentet markerades som klart."
          : "Markeringen togs bort.",
      );
    } catch (caughtError) {
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                completed: item.completed,
              }
            : currentItem,
        ),
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Checklistan kunde inte uppdateras.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function resetChecklist() {
    if (
      updatingId !== null ||
      items.length === 0 ||
      completedCount === 0
    ) {
      return;
    }

    setUpdatingId(-1);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/work-orders/checklist",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workOrderId,
            completed: false,
          }),
        },
      );

      const responseText = await response.text();

      let data: ApiResponse = {};

      if (responseText) {
        try {
          data = JSON.parse(
            responseText,
          ) as ApiResponse;
        } catch {
          throw new Error(
            "Servern returnerade ett ogiltigt svar.",
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Checklistan kunde inte återställas.",
        );
      }

      setItems((currentItems) =>
        currentItems.map((item) => ({
          ...item,
          completed: false,
        })),
      );

      setSuccess("Checklistan har återställts.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Checklistan kunde inte återställas.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-purple-300" />

            <h2 className="text-xl font-semibold text-white">
              Checklista
            </h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Bocka av momenten under arbetets gång.
            Ändringar sparas direkt.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={resetChecklist}
            disabled={
              updatingId !== null ||
              completedCount === 0
            }
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {updatingId === -1 ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}

            Återställ
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-6 flex min-h-40 items-center justify-center rounded-2xl border border-white/10 bg-black/15">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-purple-300" />

            <p className="mt-3 text-sm text-slate-400">
              Hämtar checklista...
            </p>
          </div>
        </div>
      ) : error && items.length === 0 ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center">
          <ClipboardCheck className="mx-auto h-9 w-9 text-slate-600" />

          <p className="mt-4 font-medium text-white">
            Ingen checklista finns ännu
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
            Lägg till checklistpunkter för arbetsordern i
            databasen så visas de här automatiskt.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-white">
                {completedCount} av {items.length} klara
              </p>

              <p className="text-sm font-semibold text-purple-300">
                {progress}%
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {items.map((item) => {
              const isUpdating =
                updatingId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item)}
                  disabled={updatingId !== null}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    item.completed
                      ? "border-emerald-400/20 bg-emerald-400/[0.08]"
                      : "border-white/10 bg-black/15 hover:border-purple-400/25 hover:bg-white/[0.04]"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    {isUpdating ? (
                      <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
                    ) : item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500" />
                    )}
                  </span>

                  <span
                    className={`font-medium ${
                      item.completed
                        ? "text-emerald-100 line-through decoration-emerald-400/40"
                        : "text-white"
                    }`}
                  >
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {error && items.length > 0 && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}
    </section>
  );
}