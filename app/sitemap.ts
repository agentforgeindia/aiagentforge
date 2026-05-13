import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.aiagentforge.in",
      lastModified: new Date(),
    },

    {
      url: "https://www.aiagentforge.in/textileprints-to-mockup",
      lastModified: new Date(),
    },

    {
      url: "https://www.aiagentforge.in/gallery",
      lastModified: new Date(),
    },

    {
      url: "https://www.aiagentforge.in/pricing",
      lastModified: new Date(),
    },
  ];
}