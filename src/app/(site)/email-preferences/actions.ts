"use server";

import { redirect } from "next/navigation";
import { LIST_COLUMNS, verifyPreferencesToken } from "@/lib/email-links";
import { isMissingSchema } from "@/lib/schema";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

/** Saves the email settings page. The signed token in the form says whose settings these are. */
export async function updateEmailPreferences(formData: FormData) {
  const token = String(formData.get("t") || "");
  const back = (status: string) => `/email-preferences?t=${encodeURIComponent(token)}&status=${status}`;
  const userId = verifyPreferencesToken(token);

  if (!userId || !hasServiceRole()) redirect(back("error"));

  const only = String(formData.get("unsubscribe") || "");
  const update: Record<string, boolean> = only === "tips" || only === "sales"
    ? { [LIST_COLUMNS[only]]: false }
    : { email_notifications: formData.get("sales") === "on", tips_emails: formData.get("tips") === "on" };

  const db = createServiceClient();
  let { error } = await db.from("profiles").update(update).eq("id", userId);

  // Before migration 007 there's no tips switch; still save the sale-alerts one.
  if (error && isMissingSchema(error) && "tips_emails" in update) {
    delete update.tips_emails;
    if (Object.keys(update).length === 0) redirect(back("error"));
    ({ error } = await db.from("profiles").update(update).eq("id", userId));
  }

  if (error) {
    console.error("[email-preferences] couldn't save:", error.message);
    redirect(back("error"));
  }

  redirect(back(only ? `unsubscribed-${only}` : "saved"));
}
