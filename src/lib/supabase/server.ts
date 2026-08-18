import "server-only";

import {
  createClient,
} from "@supabase/supabase-js";

export function getSupabaseServerClient() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "SUPABASE_URL eller NEXT_PUBLIC_SUPABASE_URL saknas.",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY eller SUPABASE_SERVICE_ROLE_KEY saknas.",
    );
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}