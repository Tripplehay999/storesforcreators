import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for auth admin operations (delete user, confirm email).
 * Optional: only available when SUPABASE_SERVICE_ROLE_KEY is set. Never import
 * this from client components — the key bypasses row-level security.
 */
export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
