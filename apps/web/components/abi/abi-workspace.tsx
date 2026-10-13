"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { abi } from "./abi-store";

const AbiChat = dynamic(() => import("./abi-chat").then((m) => m.AbiChat), {
  ssr: false,
  loading: () => <p className="p-6 font-mono text-sm text-subtle-foreground">Waking ABI up...</p>,
});

/** The /abi page: full-screen chat on the same conversation as the side panel. */
export function AbiWorkspace() {
  useEffect(() => {
    abi.activate();
    abi.close();
  }, []);
  return <AbiChat layout="page" />;
}
