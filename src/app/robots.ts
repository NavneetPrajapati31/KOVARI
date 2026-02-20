import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kovari.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: ["/api/", "/dashboard/", "/profile/edit/", "/settings/", "/admin/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
