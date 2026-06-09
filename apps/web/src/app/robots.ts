import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/sign-in",
          "/sign-up",
          "/onboarding/",
          "/settings/",
          "/admin/",
          "/_next/",
        ],
      },
    ],
    sitemap: "https://kovari.in/sitemap.xml",
    host: "https://kovari.in",
  };
}

