import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { updatePassword } from "../actions";

export const metadata: Metadata = { title: "Choose a new password | Browne's Talent Group" };

export default function ResetPasswordPage() {
  return (
    <>
      <div className="modal-heading">
        <span className="eyebrow">NEW PASSWORD</span>
        <h2>Choose a<br /><em>new password.</em></h2>
        <p>Pick something at least 8 characters long.</p>
      </div>

      <AuthForm
        action={updatePassword}
        submitLabel="Save new password ↗"
        pendingLabel="Saving…"
        fields={[
          { name: "password", label: "New password", type: "password", autoComplete: "new-password", minLength: 8 },
          { name: "confirm", label: "Confirm new password", type: "password", autoComplete: "new-password", minLength: 8 }
        ]}
      />
    </>
  );
}
