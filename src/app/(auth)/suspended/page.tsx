import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account paused | Browne's Talent Group" };

export default function SuspendedPage() {
  return (
    <>
      <div className="modal-heading">
        <span className="eyebrow">ACCOUNT PAUSED</span>
        <h2>Your creator hub<br /><em>is on hold.</em></h2>
        <p>
          Your account has been paused by the Browne&apos;s Talent Group team.
          If you think this is a mistake, reply to any email from us and we&apos;ll sort it out.
        </p>
      </div>

      <form action="/auth/signout" method="post">
        <button className="btn btn-dark" type="submit">Log out</button>
      </form>
    </>
  );
}
