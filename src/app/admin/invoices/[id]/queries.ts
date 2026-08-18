import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { InvoiceDetails, Invoice, InvoiceItem } from "./types";

export async function getInvoiceDetails(
  invoiceId: number,
): Promise<InvoiceDetails | null> {
  const supabase = getSupabaseServerClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError) {
    console.error(invoiceError);
    throw new Error("Kunde inte hämta fakturan.");
  }

  if (!invoice) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.error(itemsError);
    throw new Error("Kunde inte hämta fakturarader.");
  }

  return {
    invoice: invoice as Invoice,
    items: (items ?? []) as InvoiceItem[],
  };
}