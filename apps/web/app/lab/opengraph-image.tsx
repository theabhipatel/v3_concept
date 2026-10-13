import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Live AI demos";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ label: "AI Lab", title: "Live AI demos", subtitle: "RAG inspector, prompt-injection guard, job match." });
}
