import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/hub/Icon";
import LoginForm from "@/components/auth/LoginForm";
import { safeRedirectPath } from "@/lib/redirect";

export const metadata: Metadata = { title: "Log in | Stores for Creators" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;

  return (
    <>
      <div className="au-head">
        <h1>Welcome back</h1>
        <p>Log in to manage your store.</p>
      </div>

      <LoginForm
        next={safeRedirectPath(next)}
        notice={error === "link" ? (
          <div className="au-note" role="status">
            <Icon name="alert" size={18} />
            <span>That link has expired or was already used. Log in below, or ask for a new link.</span>
          </div>
        ) : undefined}
      />

      <p className="au-switch">New to Stores for Creators? <Link href="/signup">Create an account</Link></p>
    </>
  );
}
