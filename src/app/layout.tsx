import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";

import { Providers } from "./providers";
import { ErrorListeners } from "./error-listeners";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Core Rental — Your Bali Office, Delivered.",
  description:
    "Design your dream workspace and rent it month-to-month in Bali. Desks, chairs, monitors, plants and more — delivered.",
  openGraph: {
    title: "Core Rental — Your Bali Office, Delivered.",
    description:
      "Design your dream workspace and rent it month-to-month in Bali. Desks, chairs, monitors, plants and more — delivered.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Material Symbols (decision D6): <link> to preserve the FILL axis; CSP allowlists fonts.googleapis.com */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Material Symbols via <link> per D6: next/font cannot preserve the FILL axis; host is CSP-allowlisted */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${manrope.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <ErrorListeners />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
