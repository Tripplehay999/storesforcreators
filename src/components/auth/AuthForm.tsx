"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { AuthState } from "@/app/(auth)/actions";
import Icon from "@/components/hub/Icon";
import InboxNotice from "./InboxNotice";

export type AuthField = {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  optional?: boolean;
  hint?: string;
  /** Shown at the right of the label, e.g. a "Forgot password?" link. */
  labelAction?: React.ReactNode;
  /** New-password field: shows the length requirement as you type. */
  strength?: boolean;
  /** Confirm field: checks it matches the named field. */
  matches?: string;
  autoFocus?: boolean;
  defaultValue?: string;
};

type Props = {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  fields: AuthField[];
  submitLabel: string;
  pendingLabel: string;
  hidden?: Record<string, string>;
  /** Shown above the fields, e.g. an expired-link notice. */
  notice?: React.ReactNode;
};

function PasswordInput({ field, value, onChange }: { field: AuthField; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="au-password">
      <input
        id={`au-${field.name}`}
        name={field.name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        required={!field.optional}
        minLength={field.strength ? 8 : undefined}
        autoFocus={field.autoFocus}
        aria-describedby={field.strength || field.matches ? `au-${field.name}-check` : undefined}
      />
      <button
        type="button"
        className="au-reveal"
        onClick={() => setVisible(value => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}

export default function AuthForm({ action, fields, submitLabel, pendingLabel, hidden = {}, notice }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map(field => [field.name, field.defaultValue ?? ""]))
  );
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state]);

  if (state.sentTo && state.sentKind) return <InboxNotice email={state.sentTo} kind={state.sentKind} />;

  const set = (name: string, value: string) => setValues(current => ({ ...current, [name]: value }));

  return (
    <form className="au-form" action={formAction}>
      {Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}

      {notice}

      {state.error && (
        <div className="au-error" role="alert" tabIndex={-1} ref={errorRef}>
          <Icon name="alert" size={18} />
          <span>{state.error}</span>
        </div>
      )}

      {fields.map(field => {
        const value = values[field.name] ?? "";
        const match = field.matches ? values[field.matches] ?? "" : "";

        return (
          <div className="au-field" key={field.name}>
            <div className="au-label-row">
              <label htmlFor={`au-${field.name}`}>
                {field.label}
                {field.optional && <span className="au-optional">Optional</span>}
              </label>
              {field.labelAction}
            </div>

            {field.type === "password" ? (
              <PasswordInput field={field} value={value} onChange={next => set(field.name, next)} />
            ) : (
              <input
                id={`au-${field.name}`}
                name={field.name}
                type={field.type ?? "text"}
                value={value}
                onChange={event => set(field.name, event.target.value)}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                required={!field.optional}
                autoFocus={field.autoFocus}
                autoCapitalize={field.type === "email" ? "none" : undefined}
                spellCheck={field.type === "email" ? false : undefined}
              />
            )}

            {field.hint && <p className="au-hint">{field.hint}</p>}

            {field.strength && (
              <p id={`au-${field.name}-check`} className={`au-check${value.length >= 8 ? " is-met" : ""}`}>
                <Icon name={value.length >= 8 ? "check" : "alert"} size={14} />
                {value.length >= 8 ? "Good to go" : `At least 8 characters${value.length ? ` (${8 - value.length} more)` : ""}`}
              </p>
            )}

            {field.matches && value && (
              <p id={`au-${field.name}-check`} className={`au-check${value === match ? " is-met" : " is-bad"}`} aria-live="polite">
                <Icon name={value === match ? "check" : "close"} size={14} />
                {value === match ? "Passwords match" : "Passwords don't match yet"}
              </p>
            )}
          </div>
        );
      })}

      <button className="au-submit" type="submit" disabled={pending}>
        {pending && <span className="au-spinner" aria-hidden="true" />}
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
