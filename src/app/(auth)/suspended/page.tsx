import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account paused | Stores for Creators" };

export default function SuspendedPage() {
  return (
    <>
      <div className="au-head">
        <h1>Your account is paused</h1>
        <p>
          The Stores for Creators team has paused your account. If you think this is a mistake,
          reply to any email from us and we&apos;ll sort it out.
        </p>
      </div>

      <form action="/auth/signout" method="post">
        <button className="au-submit" type="submit">Log out</button>
      </form>
    </>
  );
}
