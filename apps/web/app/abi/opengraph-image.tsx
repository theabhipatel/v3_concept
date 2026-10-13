import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Talk to Abhishek's AI agent";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ label: "ABI (Abhi's Brain Interface)", title: "Talk to Abhishek's AI agent", subtitle: "Grounded answers, live tools, voice." });
}
