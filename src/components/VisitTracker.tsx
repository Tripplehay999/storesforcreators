"use client";

import { useEffect } from "react";
import { detectSource } from "@/lib/sources";
import { createClient } from "@/lib/supabase/client";

/**
 * Counts one visit per page per browser session for store analytics. The first source in a session
 * sticks, so a product view after arriving from TikTok still counts as TikTok.
 */
export default function VisitTracker({ store, product = "" }: { store: string; product?: string }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const seenKey = `sfc-seen:${store}:${product}`;
    const sourceKey = `sfc-source:${store}`;
    let source: string;

    try {
      if (sessionStorage.getItem(seenKey)) return;
      source = sessionStorage.getItem(sourceKey)
        ?? detectSource(window.location.search, document.referrer, window.location.hostname);
      sessionStorage.setItem(sourceKey, source);
      sessionStorage.setItem(seenKey, "1");
    } catch {
      source = detectSource(window.location.search, document.referrer, window.location.hostname);
    }

    // Fire and forget; analytics must never break the page.
    createClient()
      .rpc("track_visit", { p_store: store, p_product: product, p_source: source })
      .then(() => undefined, () => undefined);
  }, [store, product]);

  return null;
}
