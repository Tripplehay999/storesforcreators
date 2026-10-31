import { getSession } from "@/lib/data";
import HeaderBar from "./HeaderBar";

export default async function SiteHeader() {
  const session = await getSession();
  return <HeaderBar signedIn={Boolean(session)} />;
}
