"use client";

import { useActionState, useEffect } from "react";
import type { AdminState } from "@/app/admin/actions";
import { toast } from "@/lib/ui";

type Props = {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  children: React.ReactNode;
  className?: string;
  /** Ask before submitting (destructive actions). */
  confirm?: string;
  /** Submit as soon as any field changes (selects, toggles). */
  autoSubmit?: boolean;
};

/** Server-action form that reports the result as a toast. */
export default function ActionForm({ action, children, className, confirm, autoSubmit }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.error) toast(state.error);
    else if (state.message) toast(state.message);
  }, [state]);

  return (
    <form
      action={formAction}
      className={className}
      data-pending={pending || undefined}
      onSubmit={event => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      onChange={autoSubmit ? event => event.currentTarget.requestSubmit() : undefined}
    >
      {children}
    </form>
  );
}
