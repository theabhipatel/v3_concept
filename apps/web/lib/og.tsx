import { ImageResponse } from "next/og";
import { profile } from "@/lib/content";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

// Social images are rendered outside the browser, so CSS variables are not available here.
// These values mirror the dark theme in styles/tokens.css.
const og = {
  background: "#0b0c17",
  foreground: "#f1f1f8",
  muted: "#a9abc4",
  brand: "#7b6cff",
  brand2: "#3fd8e8",
  abi: "#6af0c0",
};

/** One branded social card per page (title + stage label). */
export function renderOg({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: `radial-gradient(circle at 85% 20%, ${og.brand}55, transparent 45%), radial-gradient(circle at 10% 100%, ${og.brand2}33, transparent 40%), ${og.background}`,
          color: og.foreground,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: og.muted }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: `linear-gradient(120deg, ${og.brand}, ${og.brand2})` }} />
          {profile.brand}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: og.abi }}>{label}</div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, maxWidth: 1000 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 30, color: og.muted, maxWidth: 980 }}>{subtitle}</div>}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: og.muted }}>
          {profile.name} - {profile.title} - www.theabhipatel.com
        </div>
      </div>
    ),
    ogSize,
  );
}
