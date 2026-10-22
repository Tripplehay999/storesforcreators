import Link from "next/link";
import { getSession } from "@/lib/data";
import Brand from "./Brand";
import MainNav from "./MainNav";

export default async function SiteHeader() {
  const session = await getSession();

  return (
    <>
      <div className="announcement">
        ✳ FOR CREATORS READY FOR SOMETHING MORE
        <Link href="/#calculator">Explore your potential ↗</Link>
      </div>

      <header className="site-header">
        <div className="container nav-wrap">
          <Brand />
          <MainNav signedIn={Boolean(session)} />
        </div>
      </header>
    </>
  );
}
