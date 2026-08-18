import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Invoice } from "./types";

export async function getInvoices(): Promise<Invoice[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Kunde inte hämta fakturor:", error);
    throw new Error("Fakturor kunde inte hämtas.");
  }

  return (data ?? []) as Invoice[];
}