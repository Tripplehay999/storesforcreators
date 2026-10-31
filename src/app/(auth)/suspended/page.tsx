import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account paused | Stores for Creators" };

export default function SuspendedPage() {
  return (
    <>
      <div className="modal-heading">
        <h2>Your account is paused</h2>
        <p>
          Your account has been paused by the Stores for Creators team.
          If you think this is a mistake, reply to any email from us and we&apos;ll sort it out.
        </p>
      </div>

      <form action="/auth/signout" method="post">
        <button className="btn btn-dark" type="submit">Log out</button>
      </form>
    </>
  );
}
