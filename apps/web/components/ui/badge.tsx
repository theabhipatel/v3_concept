import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "brand-2" | "abi";

const tones: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  brand: "border-brand/30 bg-brand/10 text-brand-text",
  "brand-2": "border-brand-2/30 bg-brand-2/10 text-brand-2-text",
  abi: "border-abi/30 bg-abi-soft text-abi-text",
};

export function Badge({ tone = "neutral", className, ...props }: React.ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}
