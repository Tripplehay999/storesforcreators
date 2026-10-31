"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { createDiscountCode, deleteDiscountCode, setDiscountActive } from "@/app/dashboard/actions";
import { shortDate } from "@/lib/format";
import type { DiscountCode } from "@/lib/growth-data";
import { toast } from "@/lib/ui";
import Icon from "./Icon";
import { Empty } from "./ui";

function status(code: DiscountCode) {
  if (!code.active) return <span className="badge badge-muted">Paused</span>;
  if (code.expiresAt && new Date(code.expiresAt) < new Date()) return <span className="badge badge-muted">Ended</span>;
  if (code.maxUses !== null && code.uses >= code.maxUses) return <span className="badge badge-muted">Used up</span>;
  return <span className="badge badge-pos">Live</span>;
}

/** Create, pause and delete percent-off codes for a store. */
export default function DiscountCodes({ storeSlug, codes, viewingStore }: { storeSlug: string; codes: DiscountCode[]; viewingStore?: string }) {
  const [state, action, pending] = useActionState(createDiscountCode, {});
  const [working, startWork] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      if (state.message) toast(state.message);
    }
  }, [state]);

  const run = (task: () => Promise<{ ok: boolean; error?: string }>) =>
    startWork(async () => {
      const result = await task();
      if (!result.ok && result.error) toast(result.error);
    });

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="ideas-title"><Icon name="tag" size={18} /> Discount codes</h2>
        <span className="muted">Buyers enter these at checkout</span>
      </div>

      <form ref={formRef} className="form-section code-form" action={action}>
        {viewingStore && <input type="hidden" name="store" value={viewingStore} />}
        <label className="field">
          Code
          <input name="code" required maxLength={24} placeholder="LAUNCH20" autoCapitalize="characters" autoComplete="off" />
        </label>
        <label className="field">
          Percent off
          <span className="input-prefix input-suffix">
            <input name="percent_off" type="number" min={1} max={90} required placeholder="20" inputMode="numeric" />
            <span>%</span>
          </span>
        </label>
        <label className="field">
          Use limit <span className="field-hint">Optional</span>
          <input name="max_uses" type="number" min={1} placeholder="Unlimited" inputMode="numeric" />
        </label>
        <label className="field">
          Ends on <span className="field-hint">Optional</span>
          <input name="expires" type="date" />
        </label>
        <div className="full code-form-actions">
          <button className="btn btn-primary" type="submit" disabled={pending}>
            <Icon name="plus" size={15} /> {pending ? "Creating…" : "Create code"}
          </button>
          {state.error && <p className="form-error" role="alert">{state.error}</p>}
        </div>
      </form>

      {codes.length === 0 ? (
        <Empty title="No codes yet">Create one for a launch, a holiday, or to thank your followers.</Empty>
      ) : (
        <ul className="rows code-list" aria-busy={working}>
          {codes.map(code => (
            <li key={code.id}>
              <div className="rows-main">
                <span className="rows-title mono-code">{code.code}</span>
                <span className="rows-meta">
                  {code.percentOff}% off · used {code.uses}{code.maxUses !== null ? ` of ${code.maxUses}` : ""} times
                  {code.expiresAt ? ` · ends ${shortDate(code.expiresAt, true)}` : ""} {status(code)}
                </span>
              </div>
              <div className="code-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={working}
                  onClick={() => run(() => setDiscountActive(code.id, storeSlug, !code.active))}
                >
                  {code.active ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-danger"
                  disabled={working}
                  onClick={() => {
                    if (confirm(`Delete ${code.code}? Anyone who has it won't be able to use it.`)) run(() => deleteDiscountCode(code.id, storeSlug));
                  }}
                  aria-label={`Delete ${code.code}`}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
