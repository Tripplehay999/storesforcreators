import { getSession } from "@/lib/data";
import Brand from "./Brand";
import MainNav from "./MainNav";

export default async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Brand />
        <MainNav signedIn={Boolean(session)} />
      </div>
    </header>
  );
}
