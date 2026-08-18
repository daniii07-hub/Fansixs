"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { InvoiceStatus } from "./types";

type InvoiceItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

type ActionResult = {
  success: boolean;
  message?: string;
};

function isValidId(value: number) {
  return Number.isInteger(value) && value > 0;
}

function normalizeNumber(
  value: number,
  minimum = 0,
) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(minimum, parsed);
}

function validateItemInput(
  input: InvoiceItemInput,
) {
  const description = input.description
    .trim()
    .slice(0, 500);

  const quantity = normalizeNumber(
    input.quantity,
    0.01,
  );

  const unitPrice = normalizeNumber(
    input.unitPrice,
    0,
  );

  const vatRate = normalizeNumber(
    input.vatRate,
    0,
  );

  if (!description) {
    return {
      error: "Beskrivning saknas.",
    } as const;
  }

  if (quantity === null) {
    return {
      error: "Antalet är ogiltigt.",
    } as const;
  }

  if (unitPrice === null) {
    return {
      error: "Priset är ogiltigt.",
    } as const;
  }

  if (
    vatRate === null ||
    vatRate > 100
  ) {
    return {
      error: "Momssatsen är ogiltig.",
    } as const;
  }

  return {
    value: {
      description,
      quantity,
      unit_price: unitPrice,
      vat_rate: vatRate,
    },
  } as const;
}

async function recalculateInvoiceTotals(
  invoiceId: number,
) {
  const supabase =
    getSupabaseServerClient();

  const [
    itemsResult,
    invoiceResult,
  ] = await Promise.all([
    supabase
      .from("invoice_items")
      .select(
        `
          quantity,
          unit_price,
          vat_rate
        `,
      )
      .eq("invoice_id", invoiceId),

    supabase
      .from("invoices")
      .select("deduction_amount")
      .eq("id", invoiceId)
      .maybeSingle(),
  ]);

  if (itemsResult.error) {
    throw new Error(
      "Fakturaraderna kunde inte räknas om.",
    );
  }

  if (invoiceResult.error) {
    throw new Error(
      "Fakturans avdrag kunde inte hämtas.",
    );
  }

  const items = itemsResult.data ?? [];

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity) *
        Number(item.unit_price),
    0,
  );

  const vatAmount = items.reduce(
    (sum, item) => {
      const rowSubtotal =
        Number(item.quantity) *
        Number(item.unit_price);

      return (
        sum +
        rowSubtotal *
          (Number(item.vat_rate) / 100)
      );
    },
    0,
  );

  const deductionAmount = Number(
    invoiceResult.data
      ?.deduction_amount ?? 0,
  );

  const totalAmount = Math.max(
    0,
    subtotal +
      vatAmount -
      deductionAmount,
  );

  const { error } = await supabase
    .from("invoices")
    .update({
      subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount,
    })
    .eq("id", invoiceId);

  if (error) {
    throw new Error(
      "Fakturans totalsummor kunde inte sparas.",
    );
  }
}

function refreshInvoicePages(
  invoiceId: number,
) {
  revalidatePath(
    `/admin/invoices/${invoiceId}`,
  );

  revalidatePath("/admin/invoices");
}

export async function createInvoiceItem(
  invoiceId: number,
  input: InvoiceItemInput,
): Promise<ActionResult> {
  try {
    if (!isValidId(invoiceId)) {
      return {
        success: false,
        message: "Ogiltigt faktura-ID.",
      };
    }

    const validation =
      validateItemInput(input);

    if ("error" in validation) {
      return {
        success: false,
        message: validation.error,
      };
    }

    const supabase =
      getSupabaseServerClient();

    const {
      data: lastItem,
      error: orderError,
    } = await supabase
      .from("invoice_items")
      .select("sort_order")
      .eq("invoice_id", invoiceId)
      .order("sort_order", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      throw new Error(
        "Radordningen kunde inte hämtas.",
      );
    }

    const nextSortOrder =
      Number(lastItem?.sort_order ?? 0) + 1;

    const { error } = await supabase
      .from("invoice_items")
      .insert({
        invoice_id: invoiceId,
        ...validation.value,
        sort_order: nextSortOrder,
      });

    if (error) {
      throw new Error(
        "Fakturaraden kunde inte skapas.",
      );
    }

    await recalculateInvoiceTotals(
      invoiceId,
    );

    refreshInvoicePages(invoiceId);

    return {
      success: true,
      message:
        "Fakturaraden har lagts till.",
    };
  } catch (error) {
    console.error(
      "Create invoice item error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Fakturaraden kunde inte skapas.",
    };
  }
}

export async function updateInvoiceItem(
  invoiceId: number,
  itemId: number,
  input: InvoiceItemInput,
): Promise<ActionResult> {
  try {
    if (
      !isValidId(invoiceId) ||
      !isValidId(itemId)
    ) {
      return {
        success: false,
        message:
          "Ogiltigt faktura- eller rad-ID.",
      };
    }

    const validation =
      validateItemInput(input);

    if ("error" in validation) {
      return {
        success: false,
        message: validation.error,
      };
    }

    const supabase =
      getSupabaseServerClient();

    const { data, error } = await supabase
      .from("invoice_items")
      .update(validation.value)
      .eq("id", itemId)
      .eq("invoice_id", invoiceId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(
        "Fakturaraden kunde inte uppdateras.",
      );
    }

    if (!data) {
      return {
        success: false,
        message:
          "Fakturaraden kunde inte hittas.",
      };
    }

    await recalculateInvoiceTotals(
      invoiceId,
    );

    refreshInvoicePages(invoiceId);

    return {
      success: true,
      message:
        "Fakturaraden har uppdaterats.",
    };
  } catch (error) {
    console.error(
      "Update invoice item error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Fakturaraden kunde inte uppdateras.",
    };
  }
}

export async function deleteInvoiceItem(
  invoiceId: number,
  itemId: number,
): Promise<ActionResult> {
  try {
    if (
      !isValidId(invoiceId) ||
      !isValidId(itemId)
    ) {
      return {
        success: false,
        message:
          "Ogiltigt faktura- eller rad-ID.",
      };
    }

    const supabase =
      getSupabaseServerClient();

    const { data, error } = await supabase
      .from("invoice_items")
      .delete()
      .eq("id", itemId)
      .eq("invoice_id", invoiceId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(
        "Fakturaraden kunde inte tas bort.",
      );
    }

    if (!data) {
      return {
        success: false,
        message:
          "Fakturaraden kunde inte hittas.",
      };
    }

    await recalculateInvoiceTotals(
      invoiceId,
    );

    refreshInvoicePages(invoiceId);

    return {
      success: true,
      message:
        "Fakturaraden har tagits bort.",
    };
  } catch (error) {
    console.error(
      "Delete invoice item error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Fakturaraden kunde inte tas bort.",
    };
  }
}

export async function updateInvoiceStatus(
  invoiceId: number,
  status: InvoiceStatus,
): Promise<ActionResult> {
  try {
    if (!isValidId(invoiceId)) {
      return {
        success: false,
        message: "Ogiltigt faktura-ID.",
      };
    }

    const allowedStatuses: InvoiceStatus[] = [
      "Utkast",
      "Godkänd",
      "Skickad",
      "Betald",
      "Förfallen",
    ];

    if (!allowedStatuses.includes(status)) {
      return {
        success: false,
        message: "Ogiltig fakturastatus.",
      };
    }

    const supabase =
      getSupabaseServerClient();

    const { data, error } = await supabase
      .from("invoices")
      .update({
        status,
      })
      .eq("id", invoiceId)
      .select("id, status")
      .maybeSingle();

    if (error) {
      throw new Error(
        "Fakturastatusen kunde inte uppdateras.",
      );
    }

    if (!data) {
      return {
        success: false,
        message:
          "Fakturan kunde inte hittas.",
      };
    }

    refreshInvoicePages(invoiceId);

    return {
      success: true,
      message: `Fakturan är nu markerad som ${status.toLowerCase()}.`,
    };
  } catch (error) {
    console.error(
      "Update invoice status error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Fakturastatusen kunde inte uppdateras.",
    };
  }
}