import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/dashboard?*userId=*",
        ],
      },
    ],
    sitemap: "https://njimbong.com/sitemap.xml",
    host: "https://njimbong.com",
  };
}
