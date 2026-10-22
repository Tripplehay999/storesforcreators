import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Creator login | Browne's Talent Group" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;

  return (
    <>
      <div className="modal-heading">
        <span className="eyebrow">CREATOR LOGIN</span>
        <h2>Welcome back,<br /><em>creator.</em></h2>
        <p>Log in to see your store, products, and earnings.</p>
      </div>

      {error === "link" && (
        <p className="form-status form-error auth-banner">
          That link has expired or was already used. Log in, or request a new one.
        </p>
      )}

      <AuthForm
        action={signIn}
        hidden={{ next: next ?? "/dashboard" }}
        submitLabel="Log in ↗"
        pendingLabel="Logging in…"
        fields={[
          { name: "email", label: "Email address", type: "email", placeholder: "you@example.com", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", placeholder: "Your password", autoComplete: "current-password" }
        ]}
        footer={
          <div className="auth-links">
            <Link href="/forgot-password">Forgot your password?</Link>
            <span>New here? <Link href="/signup">Create a creator account ↗</Link></span>
          </div>
        }
      />
    </>
  );
}
