"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveProfile } from "@/app/dashboard/actions";
import type { Profile } from "@/lib/types";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveProfile, {});

  return (
    <form className="card" action={action}>
      <div className="form-section">
        <div className="form-section-head">
          <h2>Your account</h2>
          <p>Only the Stores for Creators team sees these details.</p>
        </div>

        <label className="field">
          Your name
          <input name="full_name" defaultValue={profile.fullName} required autoComplete="name" />
        </label>

        <label className="field">
          TikTok or Instagram
          <input name="social_handle" defaultValue={profile.socialHandle} placeholder="@yourhandle" autoCapitalize="none" />
        </label>

        <label className="field full">
          Email address
          <input value={profile.email} disabled />
        </label>
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save account"}
        </button>
        <Link className="btn btn-ghost" href="/reset-password">Change password</Link>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        {state.message && <p className="form-ok" role="status">{state.message}</p>}
      </div>
    </form>
  );
}
