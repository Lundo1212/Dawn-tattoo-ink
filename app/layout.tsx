import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://dawn-tattoo-ink.vercel.app"),
  title: "Dawn Tattoo Ink | Custom Tattoo Studio in Dallas, TX",
  description:
    "Explore tattoo styles, browse the gallery, and request an appointment at Dawn Tattoo Ink, a custom tattoo studio in Dallas, Texas.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Dawn Tattoo Ink",
    title: "Dawn Tattoo Ink | Custom Tattoo Studio in Dallas, TX",
    description:
      "Explore tattoo styles, browse the gallery, and request an appointment at Dawn Tattoo Ink in Dallas, Texas.",
  },
  twitter: {
    card: "summary",
    title: "Dawn Tattoo Ink | Custom Tattoo Studio in Dallas, TX",
    description:
      "Explore tattoo styles, browse the gallery, and request an appointment at Dawn Tattoo Ink in Dallas, Texas.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Dawn Tattoo Ink",
              url: process.env.APP_URL || "https://dawn-tattoo-ink.vercel.app",
              description:
                "Custom tattoo studio offering tattoo styles, a gallery, and appointment requests in Dallas, Texas.",
              address: {
                "@type": "PostalAddress",
                streetAddress: "2717 Main Street",
                addressLocality: "Dallas",
                addressRegion: "TX",
                postalCode: "75226",
                addressCountry: "US",
              },
              areaServed: {
                "@type": "City",
                name: "Dallas",
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
