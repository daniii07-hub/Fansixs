import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Lead } from "./types";

export async function getLeads(): Promise<Lead[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .select(
      `
        id,
        created_at,
        name,
        phone,
        email,
        service,
        size,
        property_type,
        city,
        desired_date,
        frequency,
        status
      `,
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Kunde inte hämta leads:",
      error,
    );

    throw new Error(
      "Leads kunde inte hämtas.",
    );
  }

  return (data ?? []) as Lead[];
}