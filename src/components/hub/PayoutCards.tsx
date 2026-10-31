"use client";

import { useActionState, useState, useTransition } from "react";
import { cancelPayoutRequest, requestPayout, savePayoutSettings } from "@/app/dashboard/actions";
import { money, shortDate } from "@/lib/format";
import type { PayoutRequest } from "@/lib/growth-data";
import type { Profile } from "@/lib/types";
import Icon from "./Icon";

const METHODS = [
  { value: "paypal", label: "PayPal", hint: "Your PayPal email address" },
  { value: "etransfer", label: "Interac e-Transfer", hint: "The email or phone number for e-Transfers" },
  { value: "bank", label: "Bank transfer", hint: "Account holder name, bank, and account details" },
  { value: "other", label: "Something else", hint: "Tell us how you'd like to be paid" }
];

export function PayoutRequestCard({ available, openRequest, hasMethod }: {
  available: number;
  openRequest: PayoutRequest | null;
  hasMethod: boolean;
}) {
  const [state, action, pending] = useActionState(requestPayout, {});
  const [cancelling, startCancel] = useTransition();
  const [cancelError, setCancelError] = useState("");

  if (openRequest) {
    return (
      <section className="card">
        <div className="card-head">
          <h2>Payout requested</h2>
          <span className="badge badge-warn">In progress</span>
        </div>
        <p className="payout-open">
          You asked for <strong>{money(openRequest.amount, 2)}</strong> on {shortDate(openRequest.createdAt, true)}.
          We&apos;ll email you when it&apos;s sent.
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={cancelling}
          onClick={() => startCancel(async () => {
            const result = await cancelPayoutRequest(openRequest.id);
            setCancelError(result.ok ? "" : result.error);
          })}
        >
          {cancelling ? "Cancelling…" : "Cancel request"}
        </button>
        {cancelError && <p className="form-error">{cancelError}</p>}
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Request a payout</h2>
        <span className="muted">{money(available, 2)} available</span>
      </div>

      {available <= 0 ? (
        <p className="muted">Nothing to pay out yet. Your share of each sale is added to your balance.</p>
      ) : (
        <form className="payout-form" action={action}>
          <label className="field">
            Amount
            <span className="input-prefix">
              <span>$</span>
              <input name="amount" type="number" min="1" max={available} step="0.01" defaultValue={available.toFixed(2)} inputMode="decimal" required />
            </span>
          </label>
          <label className="field">
            Note <span className="field-hint">Optional</span>
            <input name="note" maxLength={500} placeholder="Anything we should know" />
          </label>
          <button className="btn btn-primary" type="submit" disabled={pending || !hasMethod}>
            <Icon name="send" size={15} /> {pending ? "Sending…" : "Request payout"}
          </button>
          {!hasMethod && <p className="field-hint">Add how you&apos;d like to be paid (below) first.</p>}
          {state.error && <p className="form-error" role="alert">{state.error}</p>}
          {state.message && <p className="form-ok" role="status">{state.message}</p>}
        </form>
      )}
    </section>
  );
}

export function PayoutSettingsCard({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(savePayoutSettings, {});
  const [method, setMethod] = useState<string>(profile.payoutMethod);
  const hint = METHODS.find(item => item.value === method)?.hint;

  return (
    <form className="card" action={action}>
      <div className="card-head">
        <h2>How you get paid</h2>
        <span className="muted">Only you and our team see this</span>
      </div>

      <div className="form-section">
        <label className="field full">
          Payout method
          <select name="payout_method" value={method} onChange={event => setMethod(event.target.value)}>
            <option value="">Choose one…</option>
            {METHODS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>

        {method && (
          <label className="field full">
            Details
            <textarea name="payout_details" rows={2} maxLength={500} defaultValue={profile.payoutDetails} placeholder={hint} required />
            <span className="field-hint">{hint}</span>
          </label>
        )}

        <label className="toggle full">
          <span>
            <strong>Email me when I make a sale</strong>
            <small>Plus payout updates.</small>
          </span>
          <input name="email_notifications" type="checkbox" defaultChecked={profile.emailNotifications} />
          <span className="switch" aria-hidden="true" />
        </label>
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        {state.message && <p className="form-ok" role="status">{state.message}</p>}
      </div>
    </form>
  );
}
