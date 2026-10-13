import type { MetadataRoute } from "next";
import { profile, projects, seo } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = Object.values(seo.pages).map((p) => ({
    url: `${profile.site}${p.path === "/" ? "" : p.path}`,
    changeFrequency: "monthly" as const,
    priority: p.path === "/" ? 1 : 0.8,
  }));
  const projectPages = projects.map((p) => ({
    url: `${profile.site}/projects/${p.slug}`,
    changeFrequency: "yearly" as const,
    priority: p.featured ? 0.7 : 0.5,
  }));
  return [...pages, ...projectPages];
}
