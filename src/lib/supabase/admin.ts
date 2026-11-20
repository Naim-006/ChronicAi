import { createClient } from "@supabase/supabase-js";

/**
 * Creates an admin Supabase client with the Service Role Key.
 * This client bypasses Row Level Security and should ONLY be used in secure
 * server-side environments (e.g. background sync, OCR ingestion, system crons).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey.includes("placeholder")) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
