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

export const metadata: Metadata = {
  title: "Browne's Talent Group | Your Audience. Our Expertise.",
  description:
    "Browne's Talent Group creates and operates beautifully branded digital storefronts for creators. Your audience. Our expertise."
};

export const viewport: Viewport = {
  themeColor: "#211c28"
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
