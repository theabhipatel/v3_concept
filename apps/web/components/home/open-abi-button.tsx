"use client";

import { Sparkles } from "lucide-react";
import { abi } from "@/components/abi/abi-store";
import { Button } from "@/components/ui/button";

export function OpenAbiButton({ prompt, children }: { prompt?: string; children: React.ReactNode }) {
  return (
    <Button variant="abi" size="lg" onClick={() => (prompt ? abi.ask(prompt) : abi.open())}>
      <Sparkles aria-hidden />
      {children}
    </Button>
  );
}
