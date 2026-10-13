import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Let's build something together";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ label: "Contact", title: "Let's build something together", subtitle: "Hire a Full Stack AI Engineer." });
}
