import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Full Stack AI Engineer";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ label: "Ask ABI anything", title: "Full Stack AI Engineer", subtitle: "AI agents, RAG and scalable web apps, shipped with DevOps." });
}
