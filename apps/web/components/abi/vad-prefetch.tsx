"use client";

import { useEffect } from "react";
import { VAD_PREFETCH } from "./vad-assets";

/**
 * Warms the browser cache with the voice detection files (about 16 MB, cached for a year) a few
 * seconds after the page loads, so live conversation starts instantly. Skipped on data saver,
 * slow connections and browsers without a microphone API.
 */
export function VadPrefetch() {
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || /(^|-)2g$|^3g$/.test(conn?.effectiveType ?? "") || !navigator.mediaDevices?.getUserMedia) return;
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      for (const url of VAD_PREFETCH) void fetch(url, { priority: "low" } as RequestInit).catch(() => undefined);
      void import("@ricky0123/vad-web").catch(() => undefined); // the detector's code chunk
    };
    const timer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) window.requestIdleCallback(warm, { timeout: 5000 });
      else warm();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);
  return null;
}
