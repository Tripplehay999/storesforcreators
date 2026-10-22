"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/(auth)/actions";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
};

type Props = {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  fields: Field[];
  submitLabel: string;
  pendingLabel: string;
  hidden?: Record<string, string>;
  footer?: React.ReactNode;
};

export default function AuthForm({ action, fields, submitLabel, pendingLabel, hidden = {}, footer }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  if (state.notice) {
    return (
      <div className="auth-notice" role="status">
        <span>✳</span>
        <p>{state.notice}</p>
      </div>
    );
  }

  return (
    <form className="auth-form" action={formAction}>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {fields.map(field => (
        <label key={field.name}>
          {field.label}
          <input
            name={field.name}
            type={field.type ?? "text"}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            required={field.required ?? true}
            minLength={field.minLength}
            defaultValue={field.name === "email" ? state.email : undefined}
          />
        </label>
      ))}

      {state.error && <p className="form-status form-error" role="alert">{state.error}</p>}

      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>

      {footer}
    </form>
  );
}
