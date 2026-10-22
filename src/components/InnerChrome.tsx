import Link from "next/link";
import Brand from "./Brand";

export function DemoRibbon() {
  return (
    <div className="demo-ribbon">
      <span>✳ STOREFRONT DESIGN PREVIEW — NOT A LIVE CHECKOUT</span>
      <Link href="/">← Back to Browne&apos;s Talent Group</Link>
    </div>
  );
}

export function InnerTop({ back = "/" }: { back?: string }) {
  return (
    <div className="container inner-top">
      <Link className="back-link" href={back}>← Back</Link>
      <Brand />
    </div>
  );
}
