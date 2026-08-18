"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  createInvoiceItem,
  deleteInvoiceItem,
  updateInvoiceItem,
} from "../actions";
import {
  calculateInvoiceItemSubtotal,
  formatCurrency,
} from "../formatters";
import type { InvoiceItem } from "../types";

type Props = {
  invoiceId: number;
  items: InvoiceItem[];
};

type EditableItem = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

type NewItem = {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

const emptyNewItem: NewItem = {
  description: "",
  quantity: "1",
  unitPrice: "0",
  vatRate: "25",
};

function toEditableItem(
  item: InvoiceItem,
): EditableItem {
  return {
    id: item.id,
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: String(item.unit_price),
    vatRate: String(item.vat_rate),
  };
}

function parseNumber(value: string) {
  return Number(value.replace(",", "."));
}

export default function InvoiceItems({
  invoiceId,
  items,
}: Props) {
  const [editableItems, setEditableItems] =
    useState<EditableItem[]>(
      items.map(toEditableItem),
    );

  const [newItem, setNewItem] =
    useState<NewItem>(emptyNewItem);

  const [showNewItem, setShowNewItem] =
    useState(false);

  const [activeItemId, setActiveItemId] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isPending, startTransition] =
    useTransition();

  const displayedTotal = useMemo(
    () =>
      editableItems.reduce((sum, item) => {
        const quantity = parseNumber(
          item.quantity,
        );
        const unitPrice = parseNumber(
          item.unitPrice,
        );

        if (
          !Number.isFinite(quantity) ||
          !Number.isFinite(unitPrice)
        ) {
          return sum;
        }

        return sum + quantity * unitPrice;
      }, 0),
    [editableItems],
  );

  function updateLocalItem(
    itemId: number,
    field: keyof Omit<
      EditableItem,
      "id"
    >,
    value: string,
  ) {
    setEditableItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );

    setError("");
    setMessage("");
  }

  function saveItem(item: EditableItem) {
    setActiveItemId(item.id);
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateInvoiceItem(
        invoiceId,
        item.id,
        {
          description: item.description,
          quantity: parseNumber(
            item.quantity,
          ),
          unitPrice: parseNumber(
            item.unitPrice,
          ),
          vatRate: parseNumber(
            item.vatRate,
          ),
        },
      );

      if (!result.success) {
        setError(
          result.message ||
            "Fakturaraden kunde inte sparas.",
        );
      } else {
        setMessage(
          result.message ||
            "Fakturaraden har sparats.",
        );
      }

      setActiveItemId(null);
    });
  }

  function removeItem(itemId: number) {
    const confirmed = window.confirm(
      "Vill du ta bort fakturaraden?",
    );

    if (!confirmed) {
      return;
    }

    setActiveItemId(itemId);
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await deleteInvoiceItem(
        invoiceId,
        itemId,
      );

      if (!result.success) {
        setError(
          result.message ||
            "Fakturaraden kunde inte tas bort.",
        );
      } else {
        setEditableItems((current) =>
          current.filter(
            (item) => item.id !== itemId,
          ),
        );

        setMessage(
          result.message ||
            "Fakturaraden har tagits bort.",
        );
      }

      setActiveItemId(null);
    });
  }

  function addItem() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await createInvoiceItem(
        invoiceId,
        {
          description: newItem.description,
          quantity: parseNumber(
            newItem.quantity,
          ),
          unitPrice: parseNumber(
            newItem.unitPrice,
          ),
          vatRate: parseNumber(
            newItem.vatRate,
          ),
        },
      );

      if (!result.success) {
        setError(
          result.message ||
            "Fakturaraden kunde inte läggas till.",
        );
        return;
      }

      setMessage(
        result.message ||
          "Fakturaraden har lagts till.",
      );
      setNewItem(emptyNewItem);
      setShowNewItem(false);
    });
  }

  return (
    <div>
      {editableItems.length === 0 &&
      !showNewItem ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-slate-400">
            Fakturan saknar fakturarader.
          </p>

          <button
            type="button"
            onClick={() => setShowNewItem(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Lägg till första raden
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-4 font-medium sm:px-6">
                    Beskrivning
                  </th>
                  <th className="px-4 py-4 text-right font-medium">
                    Antal
                  </th>
                  <th className="px-4 py-4 text-right font-medium">
                    À-pris
                  </th>
                  <th className="px-4 py-4 text-right font-medium">
                    Moms
                  </th>
                  <th className="px-4 py-4 text-right font-medium">
                    Belopp
                  </th>
                  <th className="px-4 py-4 text-right font-medium sm:px-6">
                    Åtgärder
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {editableItems.map((item) => {
                  const quantity = parseNumber(
                    item.quantity,
                  );
                  const unitPrice = parseNumber(
                    item.unitPrice,
                  );

                  const rowTotal =
                    Number.isFinite(quantity) &&
                    Number.isFinite(unitPrice)
                      ? calculateInvoiceItemSubtotal({
                          quantity,
                          unit_price: unitPrice,
                        })
                      : 0;

                  const isActive =
                    activeItemId === item.id &&
                    isPending;

                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-4 sm:px-6">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(event) =>
                            updateLocalItem(
                              item.id,
                              "description",
                              event.target.value,
                            )
                          }
                          disabled={isPending}
                          className="w-full min-w-56 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500 disabled:opacity-60"
                          placeholder="Beskrivning"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) =>
                            updateLocalItem(
                              item.id,
                              "quantity",
                              event.target.value,
                            )
                          }
                          disabled={isPending}
                          className="ml-auto block w-24 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-right text-white outline-none transition focus:border-purple-500 disabled:opacity-60"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateLocalItem(
                              item.id,
                              "unitPrice",
                              event.target.value,
                            )
                          }
                          disabled={isPending}
                          className="ml-auto block w-32 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-right text-white outline-none transition focus:border-purple-500 disabled:opacity-60"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={item.vatRate}
                          onChange={(event) =>
                            updateLocalItem(
                              item.id,
                              "vatRate",
                              event.target.value,
                            )
                          }
                          disabled={isPending}
                          className="ml-auto block w-24 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-right text-white outline-none transition focus:border-purple-500 disabled:opacity-60"
                        >
                          <option value="25">25%</option>
                          <option value="12">12%</option>
                          <option value="6">6%</option>
                          <option value="0">0%</option>
                        </select>
                      </td>

                      <td className="px-4 py-4 text-right font-semibold text-white">
                        {formatCurrency(rowTotal)}
                      </td>

                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              saveItem(item)
                            }
                            disabled={isPending}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Spara fakturarad"
                          >
                            {isActive ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.id)
                            }
                            disabled={isPending}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Ta bort fakturarad"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {showNewItem && (
                  <tr className="bg-purple-400/[0.035]">
                    <td className="px-4 py-4 sm:px-6">
                      <input
                        type="text"
                        value={newItem.description}
                        onChange={(event) =>
                          setNewItem((current) => ({
                            ...current,
                            description:
                              event.target.value,
                          }))
                        }
                        disabled={isPending}
                        autoFocus
                        className="w-full min-w-56 rounded-xl border border-purple-400/30 bg-black/20 px-3 py-2.5 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500 disabled:opacity-60"
                        placeholder="Ny fakturarad"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newItem.quantity}
                        onChange={(event) =>
                          setNewItem((current) => ({
                            ...current,
                            quantity:
                              event.target.value,
                          }))
                        }
                        disabled={isPending}
                        className="ml-auto block w-24 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-right text-white outline-none transition focus:border-purple-500 disabled:opacity-60"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItem.unitPrice}
                        onChange={(event) =>
                          setNewItem((current) => ({
                            ...current,
                            unitPrice:
                              event.target.value,
                          }))
                        }
                        disabled={isPending}
                        className="ml-auto block w-32 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-right text-white outline-none transition focus:border-purple-500 disabled:opacity-60"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={newItem.vatRate}
                        onChange={(event) =>
                          setNewItem((current) => ({
                            ...current,
                            vatRate:
                              event.target.value,
                          }))
                        }
                        disabled={isPending}
                        className="ml-auto block w-24 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-right text-white outline-none transition focus:border-purple-500 disabled:opacity-60"
                      >
                        <option value="25">25%</option>
                        <option value="12">12%</option>
                        <option value="6">6%</option>
                        <option value="0">0%</option>
                      </select>
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-white">
                      {formatCurrency(
                        Math.max(
                          0,
                          parseNumber(
                            newItem.quantity,
                          ) *
                            parseNumber(
                              newItem.unitPrice,
                            ) || 0,
                        ),
                      )}
                    </td>

                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={addItem}
                          disabled={isPending}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Lägg till fakturarad"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowNewItem(false);
                            setNewItem(emptyNewItem);
                          }}
                          disabled={isPending}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Avbryt ny fakturarad"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setShowNewItem(true);
                setError("");
                setMessage("");
              }}
              disabled={showNewItem || isPending}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-purple-400/20 bg-purple-400/10 px-4 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-purple-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Lägg till rad
            </button>

            <p className="text-sm text-slate-400">
              Synligt radbelopp:{" "}
              <span className="font-semibold text-white">
                {formatCurrency(displayedTotal)}
              </span>
            </p>
          </div>
        </>
      )}

      {error && (
        <div
          role="alert"
          className="mx-6 mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {message && (
        <div className="mx-6 mb-5 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <Check className="h-5 w-5 shrink-0" />
          {message}
        </div>
      )}
    </div>
  );
}