import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import { requestPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Reset your password | Stores for Creators" };

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="au-head">
        <h1>Reset your password</h1>
        <p>Enter your email and we&apos;ll send you a link to choose a new one.</p>
      </div>

      <AuthForm
        action={requestPasswordReset}
        submitLabel="Send reset link"
        pendingLabel="Sending…"
        fields={[{ name: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email", autoFocus: true }]}
      />

      <p className="au-switch">Remembered it? <Link href="/login">Back to login</Link></p>
    </>
  );
}
