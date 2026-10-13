"use client";

import { Command } from "cmdk";
import { FolderGit2, Mail, Mic, Moon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { abi } from "@/components/abi/abi-store";
import { profile, projects } from "@/lib/content";
import { NAV_ITEMS } from "./nav-items";

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0";
const groupClass =
  "px-2 py-1.5 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-subtle-foreground";

export default function PaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [search, setSearch] = useState("");

  const run = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <Command.Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      label="Command bar"
      filter={(value, query) => {
        // "Ask ABI" stays available but ranks below real matches like "Secure Vault".
        if (value.startsWith("ask-abi")) return 0.01;
        const v = value.toLowerCase();
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (v.includes(query.toLowerCase())) return 1;
        return words.length && words.every((w) => v.includes(w)) ? 0.6 : 0;
      }}
      overlayClassName="fixed inset-0 z-[70] bg-background/60 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[12vh] z-[71] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-lg"
    >
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder='Try "go to projects", "open Secure Vault" or ask ABI anything...'
        className="h-14 w-full border-b bg-transparent px-5 text-base outline-none placeholder:text-subtle-foreground"
      />
      <Command.List className="max-h-[60vh] overflow-y-auto overscroll-contain pb-2">
        <Command.Empty className="px-5 py-6 text-sm text-muted-foreground">
          No match. Press Enter on &quot;Ask ABI&quot; to let ABI answer.
        </Command.Empty>
        <Command.Group heading="Go to" className={groupClass}>
          {NAV_ITEMS.map((item) => (
            <Command.Item
              key={item.href}
              value={`go to ${item.label}`}
              onSelect={() => run(() => router.push(item.href))}
              className={itemClass}
            >
              <item.icon />
              {item.label}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Projects" className={groupClass}>
          {projects.map((p) => (
            <Command.Item
              key={p.slug}
              value={`open ${p.title} ${p.categories.join(" ")}`}
              onSelect={() => run(() => router.push(`/projects/${p.slug}`))}
              className={itemClass}
            >
              <FolderGit2 />
              {p.title}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Actions" className={groupClass}>
          <Command.Item value="talk to abi voice" onSelect={() => run(() => abi.requestListen())} className={itemClass}>
            <Mic />
            Talk to ABI (voice)
          </Command.Item>
          <Command.Item
            value="toggle theme dark light"
            onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
            className={itemClass}
          >
            <Moon />
            Switch to {resolvedTheme === "dark" ? "light" : "dark"} theme
          </Command.Item>
          <Command.Item
            value="copy email contact"
            onSelect={() => run(() => navigator.clipboard?.writeText(profile.email))}
            className={itemClass}
          >
            <Mail />
            Copy email ({profile.email})
          </Command.Item>
        </Command.Group>
        {search.trim().length > 2 && (
          <Command.Group heading="ABI" className={groupClass} forceMount>
            <Command.Item
              value={`ask-abi ${search}`}
              forceMount
              onSelect={() => run(() => abi.ask(search.trim()))}
              className={itemClass}
            >
              <Sparkles className="text-abi-text" />
              Ask ABI: &quot;{search.trim()}&quot;
            </Command.Item>
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
