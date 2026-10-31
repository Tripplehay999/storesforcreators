import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import { updatePassword } from "../actions";

export const metadata: Metadata = { title: "Choose a new password | Stores for Creators" };

export default function ResetPasswordPage() {
  return (
    <>
      <div className="au-head">
        <h1>Choose a new password</h1>
        <p>You&apos;ll use it the next time you log in.</p>
      </div>

      <AuthForm
        action={updatePassword}
        submitLabel="Save new password"
        pendingLabel="Saving…"
        fields={[
          { name: "password", label: "New password", type: "password", autoComplete: "new-password", strength: true, autoFocus: true },
          { name: "confirm", label: "Confirm new password", type: "password", autoComplete: "new-password", matches: "password" }
        ]}
      />
    </>
  );
}
