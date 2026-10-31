"use client";

import Link from "next/link";
import { useState } from "react";
import { sendLoginLink, signIn } from "@/app/(auth)/actions";
import AuthForm from "./AuthForm";

/** Password login, with a switch to a one-time email link instead. */
export default function LoginForm({ next, notice }: { next: string; notice?: React.ReactNode }) {
  const [mode, setMode] = useState<"password" | "link">("password");

  return (
    <>
      {mode === "password" ? (
        <AuthForm
          key="password"
          action={signIn}
          hidden={{ next }}
          notice={notice}
          submitLabel="Log in"
          pendingLabel="Logging in…"
          fields={[
            { name: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email", autoFocus: true },
            {
              name: "password",
              label: "Password",
              type: "password",
              placeholder: "Your password",
              autoComplete: "current-password",
              labelAction: <Link className="au-label-link" href="/forgot-password">Forgot password?</Link>
            }
          ]}
        />
      ) : (
        <AuthForm
          key="link"
          action={sendLoginLink}
          hidden={{ next }}
          submitLabel="Email me a login link"
          pendingLabel="Sending…"
          fields={[
            {
              name: "email",
              label: "Email",
              type: "email",
              placeholder: "you@example.com",
              autoComplete: "email",
              autoFocus: true,
              hint: "We'll email you a link that logs you straight in. No password needed."
            }
          ]}
        />
      )}

      <div className="au-divider"><span>or</span></div>

      <button type="button" className="au-secondary" onClick={() => setMode(mode === "password" ? "link" : "password")}>
        {mode === "password" ? "Email me a login link instead" : "Log in with my password"}
      </button>
    </>
  );
}
