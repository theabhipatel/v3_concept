// Phase 1 placeholder. Replaced by the pipeline scroll story in Phase 4.
import { ThemeToggle } from "@/components/theme-toggle";
import { profile } from "@/lib/content";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-12 px-4 py-16 sm:px-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="font-mono text-sm text-brand-text">&gt; ask ABI anything about {profile.brand}</p>
          <h1 className="text-5xl font-bold sm:text-7xl">{profile.name}</h1>
          <p className="bg-(image:--gradient-brand) bg-clip-text text-2xl font-semibold text-transparent">
            {profile.title}
          </p>
          <p className="max-w-xl text-muted-foreground">{profile.bio}</p>
        </div>
        <ThemeToggle />
      </header>
    </main>
  );
}
