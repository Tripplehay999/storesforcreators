import Link from "next/link";
import Brand from "./Brand";

export function DemoRibbon() {
  return (
    <div className="demo-ribbon">
      <span>✳ STOREFRONT DESIGN PREVIEW — NOT A LIVE CHECKOUT</span>
      <Link href="/">← Back to Stores for Creators</Link>
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
