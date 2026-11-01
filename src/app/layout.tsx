import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Serif, Manrope } from "next/font/google";
import UIRoot from "@/components/UIRoot";
import { getSession } from "@/lib/data";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans"
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif"
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope"
});

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

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable} ${manrope.variable}`}
    >
      <body>
        {children}
        <UIRoot signedIn={Boolean(session)} />
      </body>
    </html>
  );
}
