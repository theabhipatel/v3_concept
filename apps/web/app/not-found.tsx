import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[80dvh] max-w-xl flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="font-medium text-xs text-brand-text">Page not found</p>
      <h1 className="text-4xl font-semibold sm:text-5xl">This page isn&apos;t in my knowledge base.</h1>
      <p className="text-muted-foreground">It may have moved. Head home, or open the orb menu and ask ABI where to find it.</p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </section>
  );
}
