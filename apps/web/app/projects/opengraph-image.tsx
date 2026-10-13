import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "20+ AI, full stack and DevOps projects";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ label: "Projects", title: "20+ AI, full stack and DevOps projects", subtitle: "" });
}
