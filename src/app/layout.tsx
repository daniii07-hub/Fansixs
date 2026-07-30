// src/app/layout.tsx

import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fansixs.se"),

  title: {
    default: "Fansixs | AI-medarbetare för svenska företag",
    template: "%s | Fansixs",
  },

  description:
    "Fansixs hjälper svenska företag att automatisera kundservice, bokningar och offertförfrågningar med AI-medarbetare som arbetar dygnet runt.",

  keywords: [
    "AI",
    "AI agent",
    "AI medarbetare",
    "Automatisering",
    "Städfirma",
    "Svenska företag",
    "Kundservice",
    "Bokningar",
    "Offert",
    "Fansixs",
  ],

  authors: [
    {
      name: "Fansixs",
    },
  ],

  creator: "Fansixs",

  openGraph: {
    title: "Fansixs | AI-medarbetare för svenska företag",
    description:
      "Automatisera kundservice, bokningar och offertförfrågningar med AI.",
    url: "https://fansixs.se",
    siteName: "Fansixs",
    locale: "sv_SE",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Fansixs",
    description:
      "AI-medarbetare för svenska företag som arbetar dygnet runt.",
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="sv">
      <body>{children}</body>

      {measurementId ? <GoogleAnalytics gaId={measurementId} /> : null}
    </html>
  );
}