import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kovari.vercel.app";

  // You can fetch dynamic routes here (e.g., public groups, blog posts)
  // For now, these are the static routes important for SEO
  const routes = [
    "",
    "/about",
    "/terms",
    "/privacy",
    "/landing",
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
