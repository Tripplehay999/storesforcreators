"use client";

import { toast } from "@/lib/ui";

/** Copies a block of text (like an email template's HTML) and says so. */
export default function CopyButton({ text, label = "Copy", done = "Copied." }: { text: string; label?: string; done?: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast(done);
    } catch {
      toast("Couldn't copy. Your browser blocked it: try again, or use a different browser.");
    }
  }

  return <button className="adm-btn adm-btn-sm" type="button" onClick={copy}>{label}</button>;
}
