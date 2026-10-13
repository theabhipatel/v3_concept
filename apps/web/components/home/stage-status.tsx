"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Status = "waiting" | "processing" | "done";

/** Each stage visibly "processes" as it scrolls through, then hands data to the next stage. */
export function StageStatus({ id, next }: { id: string; next?: string }) {
  const [status, setStatus] = useState<Status>("waiting");

  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setStatus("processing");
        else if (e.boundingClientRect.top < 0) setStatus("done");
        else setStatus("waiting");
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [id]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] transition-colors duration-(--duration-base)",
        status === "processing" && "border-abi/40 bg-abi-soft text-abi-text",
        status === "done" && "text-muted-foreground",
        status === "waiting" && "text-subtle-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "processing" ? "animate-pulse bg-abi" : status === "done" ? "bg-success" : "bg-border-strong",
        )}
      />
      {status === "processing" ? "processing" : status === "done" ? (next ? `done, handed to ${next}` : "done") : "waiting"}
    </span>
  );
}
