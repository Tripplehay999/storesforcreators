import SiteHeader from "@/components/SiteHeader";
import NotFound from "../(site)/not-found";

// A missing store or product gets the normal site header, so visitors can find their way around.
export default function StorefrontNotFound() {
  return (
    <>
      <SiteHeader />
      <NotFound />
    </>
  );
}
