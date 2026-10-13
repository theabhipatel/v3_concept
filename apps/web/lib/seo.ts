import type { Metadata } from "next";
import { profile, seo, type PageKey } from "@/lib/content";

/** Title, description, canonical and social cards for a static page from content/seo.json. */
export function pageMetadata(key: PageKey): Metadata {
  const page = seo.pages[key];
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: key === "about" ? "profile" : "website",
      siteName: seo.siteName,
      url: `${profile.site}${page.path === "/" ? "" : page.path}`,
      title: page.title,
      description: page.description,
    },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

export function jsonLd(data: object | object[]) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
