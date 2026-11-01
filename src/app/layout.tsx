import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import UIRoot from "@/components/UIRoot";
import { getSession } from "@/lib/data";
import "./fonts.css";
import "./globals.css";

// Fonts are self-hosted (fonts.css, files in public/fonts) so they load even when Google Fonts can't be reached.
// These are the ones every page uses; the other character sets load only when needed.
const PRELOADED_FONTS = ["manrope-latin", "dm-sans-latin", "instrument-serif-latin", "instrument-serif-italic-latin"];

const TITLE = "Stores for Creators | Your Audience. Our Expertise.";
const DESCRIPTION =
  "Stores for Creators creates and operates beautifully branded digital storefronts for creators. Your audience. Our expertise.";

/** Absolute base for share links and preview images. On Vercel, Next falls back to the deployment URL. */
function siteBase() {
  try {
    return process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined;
  } catch {
    return undefined;
  }
}

// Icons, the app manifest and the share image come from files in this folder
// (icon.svg, favicon.ico, apple-icon.png, manifest.ts, opengraph-image.png, twitter-image.png).
export const metadata: Metadata = {
  metadataBase: siteBase(),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Stores for Creators",
  appleWebApp: { title: "Creator Hub", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: "Stores for Creators",
    title: TITLE,
    description: DESCRIPTION
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION }
};

export const viewport: Viewport = {
  themeColor: "#1c1722",
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  for (const font of PRELOADED_FONTS) {
    preload(`/fonts/${font}.woff2`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }

  return (
    <html lang="en">
      <body>
        {children}
        <UIRoot signedIn={Boolean(session)} />
      </body>
    </html>
  );
}
