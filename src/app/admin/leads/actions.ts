"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const allowedStatuses = [
  "Ny",
  "Kontaktad",
  "Bokad",
  "Avslutad",
] as const;

type LeadStatus = (typeof allowedStatuses)[number];

export async function updateLeadStatus(
  leadId: number,
  status: LeadStatus,
) {
  if (!Number.isInteger(leadId) || leadId <= 0) {
    throw new Error("Ogiltigt lead-id.");
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error("Ogiltig status.");
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Supabase-inställningarna saknas i .env.local.",
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { error } = await supabase
    .from("leads")
    .update({
      status,
    })
    .eq("id", leadId);

  if (error) {
    console.error("Kunde inte uppdatera status:", error);
    throw new Error("Statusen kunde inte uppdateras.");
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin/dashboard");
}