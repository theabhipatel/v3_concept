"use client";

import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { abi } from "@/components/abi/abi-store";

/** On the 404 page: hand the broken address to ABI and let it find the right page. */
export function AskWhereItWent() {
  const path = usePathname();
  return (
    <button
      type="button"
      onClick={() => abi.ask(`I tried to open "${path}" on this website but it does not exist. What was I probably looking for? Take me there.`)}
      className="send group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full px-5 text-sm font-semibold"
    >
      <Sparkles className="relative size-4" aria-hidden />
      <span className="relative">Ask ABI to find it</span>
    </button>
  );
}
