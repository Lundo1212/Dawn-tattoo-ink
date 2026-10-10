import type { MetadataRoute } from "next";

const siteUrl = process.env.APP_URL || "https://dawn-tattoo-ink.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}