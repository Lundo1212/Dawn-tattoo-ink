import type { MetadataRoute } from "next";

const siteUrl = process.env.APP_URL || "https://dawn-tattoo-ink.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", siteUrl).toString(),
    },
  ];
}