"use client";

import { useEffect, useState } from "react";

type Props = { name: string; price: string; label: string; formId: string };

/**
 * Phones: once the main Buy button scrolls off screen, a bar with the price and a Buy button
 * stays at the bottom. It submits the same form, so a discount code typed above still applies.
 */
export default function StickyBuy({ name, price, label, formId }: Props) {
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!form) return;

    const observer = new IntersectionObserver(([entry]) => {
      // Only after the buyer has scrolled past the form, not before they reach it.
      setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(form);

    const onSubmit = () => setBusy(true);
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) setBusy(false);
    };
    form.addEventListener("submit", onSubmit);
    window.addEventListener("pageshow", onShow);

    return () => {
      observer.disconnect();
      form.removeEventListener("submit", onSubmit);
      window.removeEventListener("pageshow", onShow);
    };
  }, [formId]);

  return (
    <div className={`sf-sticky${shown ? " is-shown" : ""}`} inert={!shown} aria-hidden={!shown}>
      <div className="sf-sticky-inner">
        <div className="sf-sticky-copy">
          <strong>{price}</strong>
          <small>{name}</small>
        </div>
        <button className="sf-btn sf-btn-ink" type="submit" form={formId} disabled={busy}>
          {busy ? "Opening…" : label}
        </button>
      </div>
    </div>
  );
}
