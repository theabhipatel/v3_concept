"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const NeuralCore = dynamic(() => import("./neural-core"), { ssr: false });

/**
 * Loads the 3D core only after the page has fully loaded and the main thread is idle,
 * so it never competes with first paint (LCP) or input (TBT).
 */
export function CoreLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      timer = setTimeout(() => {
        if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(() => setReady(true), { timeout: 3000 });
        else setReady(true);
      }, 600);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      clearTimeout(timer);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
    };
  }, []);

  return ready ? <NeuralCore /> : null;
}
