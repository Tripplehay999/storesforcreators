import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { requestPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Reset your password | Browne's Talent Group" };

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="modal-heading">
        <span className="eyebrow">PASSWORD RESET</span>
        <h2>Happens to<br /><em>the best of us.</em></h2>
        <p>Enter your email and we&apos;ll send you a link to choose a new password.</p>
      </div>

      <AuthForm
        action={requestPasswordReset}
        submitLabel="Send reset link ↗"
        pendingLabel="Sending…"
        fields={[
          { name: "email", label: "Email address", type: "email", placeholder: "you@example.com", autoComplete: "email" }
        ]}
        footer={
          <div className="auth-links">
            <Link href="/login">← Back to login</Link>
          </div>
        }
      />
    </>
  );
}
