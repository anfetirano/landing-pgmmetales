import type { Metadata } from "next";
import { headers } from "next/headers";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Source_Sans_3, Manrope } from "next/font/google";

import AppShell from "@/components/AppShell";
import Providers from "@/components/Providers";
import PwaVersionReset from "@/components/pwa-version-reset";
import { siteDetails } from "@/data/siteDetails";

import "./globals.css";

const manrope = Manrope({ subsets: ["latin"] });
const sourceSans = Source_Sans_3({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: siteDetails.metadata.title,
  description: siteDetails.metadata.description,
  manifest: "/manifest.webmanifest",
  themeColor: "#234c4b",
  icons: {
    icon: [{ url: "/favicon.ico?v=2" }],
    apple: [{ url: "/icons/icon-192.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PMG Metales",
  },
  openGraph: {
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    url: siteDetails.siteUrl,
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 675,
        alt: siteDetails.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    images: ["/images/twitter-image.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const buildVersion =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    "local-build";
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isClerkFreeRoute =
    pathname.startsWith("/presentacion") || pathname.startsWith("/pmr");

  return (
    <html lang="en">
      <body className={`${manrope.className} ${sourceSans.className} antialiased`}>
        <PwaVersionReset buildVersion={buildVersion} />
        {siteDetails.googleAnalyticsId && (
          <GoogleAnalytics gaId={siteDetails.googleAnalyticsId} />
        )}
        {isClerkFreeRoute ? (
          <AppShell>{children}</AppShell>
        ) : (
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        )}
      </body>
    </html>
  );
}
