import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata } from "next";
import { IBM_Plex_Sans, Fraunces } from "next/font/google";
import Script from "next/script";
import { AgeGate } from "@/components/AgeGate";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MemberCapture } from "@/components/MemberCapture";
import { site } from "@/content/site";
import { AGE_GATE_COOKIE_NAME } from "@/lib/ageGate/storage";
import "./globals.css";

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Research Peptides Australia | The Protocol",
    template: "%s | The Protocol",
  },
  description: site.tagline,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    siteName: site.name,
    locale: "en_AU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${body.variable} ${display.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <ConvexAuthNextjsServerProvider>
          <Script id="age-gate-boot" strategy="beforeInteractive">
            {`try{if(document.cookie.split(";").some(function(c){return c.trim().indexOf("${AGE_GATE_COOKIE_NAME}=1")===0})){document.documentElement.setAttribute("data-age-ok","1")}}catch(e){}`}
          </Script>
          <div className="sticky top-0 z-50">
            <AnnouncementBanner />
            <Header />
          </div>
          <ConvexClientProvider>
            <main className="flex-1">{children}</main>
            <Footer />
            <AgeGate />
            <MemberCapture />
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
