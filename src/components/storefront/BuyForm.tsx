"use client";

import { useEffect, useState } from "react";

type Props = {
  productId: string;
  label: string;
  /** Shown while Stripe's payment page loads. */
  busyLabel?: string;
  id?: string;
  className?: string;
  buttonClassName: string;
  /** Extra fields shown above the button, such as the discount code. */
  children?: React.ReactNode;
};

/**
 * A Buy button. It posts to /api/checkout, which sends the buyer to Stripe's secure payment page.
 * While that loads, the button says so, which stops double taps.
 */
export default function BuyForm({ productId, label, busyLabel = "Opening secure checkout…", id, className, buttonClassName, children }: Props) {
  const [busy, setBusy] = useState(false);

  // Coming back with the browser's Back button restores the page as it was; reset the button.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setBusy(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <form id={id} className={className} action="/api/checkout" method="post" onSubmit={() => setBusy(true)}>
      <input type="hidden" name="product_id" value={productId} />
      {children}
      <button className={buttonClassName} type="submit" disabled={busy} aria-live="polite">
        {busy ? (
          <>
            <span className="sf-spinner" aria-hidden="true" /> {busyLabel}
          </>
        ) : label}
      </button>
    </form>
  );
}
