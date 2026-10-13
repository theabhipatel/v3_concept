import { getProject, projects } from "@/lib/content";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Project by Abhishek Patel";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  return renderOg({
    label: p ? p.categories.join(" - ") : "Project",
    title: p?.title ?? "Project",
    subtitle: p ? p.tags.slice(0, 5).join(", ") : undefined,
  });
}
