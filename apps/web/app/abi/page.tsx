import { AbiPresence } from "@/components/abi/abi-presence";
import { AbiWorkspace } from "@/components/abi/abi-workspace";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("abi");

// Talk to ABI: a studio for long conversations. ABI's presence on the left reacts to what it is
// doing (listening, thinking, speaking); the chat on the right is the same conversation as the
// side panel, so nothing is lost when visitors move between them.

export default function AbiPage() {
  return (
    <div className="relative overflow-hidden">
      <div data-motion suppressHydrationWarning className="hero__wash pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-20 pt-24 sm:px-8 lg:min-h-dvh lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12 lg:pt-24">
        <section aria-labelledby="abi-title" data-intro className="lg:sticky lg:top-24">
          <AbiPresence />
        </section>
        <section
          aria-label="Conversation with ABI"
          data-intro="scale"
          style={{ "--d": 2 } as React.CSSProperties}
          className="studio flex h-[78dvh] min-h-[32rem] flex-col overflow-hidden rounded-[2rem] border bg-card/85 shadow-lg backdrop-blur lg:h-[calc(100dvh-8rem)]"
        >
          <header className="flex items-center gap-3 border-b px-5 py-3.5">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            <p className="text-sm font-semibold">Conversation</p>
            <p className="ml-auto hidden text-xs text-subtle-foreground sm:block">Same chat as the side panel. Answers cite their sources.</p>
          </header>
          <div className="min-h-0 flex-1">
            <AbiWorkspace />
          </div>
        </section>
      </div>
    </div>
  );
}
