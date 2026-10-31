import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { after } from "next/server";
import { sendEmail, type Email } from "./email";

/** Sends an email after the response has gone out, so a slow or failing email never blocks the user. */
export function sendLater(email: Email | null | (() => Promise<Email | null>)) {
  after(async () => {
    try {
      const message = typeof email === "function" ? await email() : email;
      if (message) await sendEmail(message);
    } catch (error) {
      console.error("[notify] couldn't send email:", error);
    }
  });
}

export type Contact = { email: string; name: string; wantsEmail: boolean };

/** The store owner's email and preferences. Needs a client allowed to read their profile (admin or service role). */
export async function storeOwnerContact(client: SupabaseClient, storeSlug: string): Promise<Contact | null> {
  const { data: store } = await client.from("stores").select("owner_id").eq("slug", storeSlug).maybeSingle();
  if (!store?.owner_id) return null;

  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", store.owner_id)
    .maybeSingle();

  if (!profile?.email) return null;

  return {
    email: profile.email,
    name: profile.full_name ?? "",
    // Older databases (before migration 004) have no preference column: default to on.
    wantsEmail: profile.email_notifications !== false
  };
}
