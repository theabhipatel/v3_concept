"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { AbiPanel } from "./abi-panel";
import { registerBridge } from "./actions";
import "./runtime";

/** Mounted once ABI is activated: connects the agent to the router/theme and shows the panel. */
export default function AbiRoot() {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();

  useEffect(() => {
    registerBridge({ navigate: (path) => router.push(path), setTheme });
  }, [router, setTheme]);

  // The /abi page is the full-screen workspace, so the side panel steps aside there.
  return pathname === "/abi" ? null : <AbiPanel />;
}
