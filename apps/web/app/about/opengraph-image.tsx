import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "About Abhishek Patel";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ label: "About", title: "About Abhishek Patel", subtitle: "4+ years building AI products and scalable web apps." });
}
