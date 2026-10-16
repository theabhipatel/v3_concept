import { ImageResponse } from "next/og";
import { profile } from "@/lib/content";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

// Social images are rendered outside the browser, so CSS variables are not available here.
// These values mirror the dark theme in styles/tokens.css.
const og = {
  background: "#1a1612",
  foreground: "#f8f3ec",
  muted: "#bfb2a4",
  brand: "#fb8b3c",
  brand2: "#e8650f",
  abi: "#fbbf24",
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
          background: `radial-gradient(circle at 88% 18%, ${og.abi}40, transparent 42%), ${og.background}`,
          color: og.foreground,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: og.muted }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: og.brand2 }} />
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
