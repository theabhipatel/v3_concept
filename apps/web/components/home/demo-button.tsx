"use client";

import { MousePointer2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Ghost-cursor demo: ABI briefly drives the page to show what it can do. */
export function DemoButton() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [running, setRunning] = useState(false);

  return (
    <Button
      variant="abi"
      size="lg"
      disabled={running}
      onClick={async () => {
        setRunning(true);
        const actions = await import("@/components/abi/actions");
        actions.registerBridge({ navigate: (p) => router.push(p), setTheme });
        await actions.runDemo();
        setRunning(false);
      }}
    >
      <MousePointer2 aria-hidden />
      {running ? "ABI is driving..." : "Watch ABI operate the site"}
    </Button>
  );
}
