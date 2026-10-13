"use client";

import dynamic from "next/dynamic";
import { useAbi } from "./abi-store";

// All AI code (chat, generative UI, voice, agent cursor) loads on the first interaction.
const AbiRoot = dynamic(() => import("./abi-root"), { ssr: false });

export function AbiLoader() {
  const activated = useAbi((s) => s.activated);
  return activated ? <AbiRoot /> : null;
}
