import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "70+ technologies across AI, full stack and DevOps";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ label: "Skills", title: "70+ technologies across AI, full stack and DevOps", subtitle: "" });
}
