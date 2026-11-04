import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import { signUp } from "../actions";

export const metadata: Metadata = { title: "Create your account | Stores for Creators" };

export default function SignupPage() {
  return (
    <>
      <div className="au-head">
        <h1>Create your account</h1>
        <p>Free to start. It takes about a minute.</p>
      </div>

      <AuthForm
        action={signUp}
        submitLabel="Create account"
        pendingLabel="Creating your account…"
        fields={[
          { name: "full_name", label: "Your name", placeholder: "Jasmine Carter", autoComplete: "name", autoFocus: true },
          { name: "social_handle", label: "TikTok or Instagram", placeholder: "@yourhandle", optional: true },
          { name: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", placeholder: "Create a password", autoComplete: "new-password", strength: true }
        ]}
      />

      <p className="au-legal">
        By creating an account, you agree to our <Link href="/terms">Terms</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <p className="au-switch">Already have an account? <Link href="/login">Log in</Link></p>
    </>
  );
}
