import Link from "next/link";

export function InnerTop({ back = "/" }: { back?: string }) {
  return (
    <div className="container inner-top">
      <Link className="back-link" href={back}>← Back</Link>
    </div>
  );
}
