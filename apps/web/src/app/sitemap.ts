import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.kovari.in";

  // Public routes important for SEO
  const routes = [
    "",
    "/about",
    "/user-safety",
    "/community-guidelines",
    "/privacy",
    "/terms",
    "/data-deletion",
    "/sign-in",
    "/sign-up",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return [...routes];
}

