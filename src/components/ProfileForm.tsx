"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveProfile } from "@/app/dashboard/actions";
import type { Profile } from "@/lib/types";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveProfile, {});

  return (
    <form className="editor-fields" action={action}>
      <label>
        Your name
        <input name="full_name" defaultValue={profile.fullName} required />
      </label>

      <label>
        TikTok or Instagram profile
        <input name="social_handle" defaultValue={profile.socialHandle} placeholder="@yourhandle" />
      </label>

      <label className="full">
        Email address
        <input value={profile.email} disabled />
      </label>

      <div className="full editor-footer">
        <button className="btn btn-soft" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </button>
        <Link className="small-button" href="/reset-password">Change password</Link>
        {state.error && <p className="form-status form-error">{state.error}</p>}
        {state.message && <p className="form-status">{state.message}</p>}
      </div>
    </form>
  );
}
