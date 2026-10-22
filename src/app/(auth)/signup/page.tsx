import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signUp } from "../actions";

export const metadata: Metadata = { title: "Create your creator account | Browne's Talent Group" };

export default function SignupPage() {
  return (
    <>
      <div className="modal-heading">
        <span className="eyebrow">BECOME A BTG CREATOR</span>
        <h2>Let&apos;s build<br /><em>your next thing.</em></h2>
        <p>Create your account to set up your storefront and track your earnings.</p>
      </div>

      <AuthForm
        action={signUp}
        submitLabel="Create my account ↗"
        pendingLabel="Creating your account…"
        fields={[
          { name: "full_name", label: "Your name", placeholder: "Your full name", autoComplete: "name" },
          { name: "social_handle", label: "TikTok or Instagram profile", placeholder: "@yourhandle", required: false },
          { name: "email", label: "Email address", type: "email", placeholder: "you@example.com", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", placeholder: "At least 8 characters", autoComplete: "new-password", minLength: 8 }
        ]}
        footer={
          <div className="auth-links">
            <span>Already a creator? <Link href="/login">Log in ↗</Link></span>
          </div>
        }
      />
    </>
  );
}
