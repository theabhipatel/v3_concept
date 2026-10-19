import type { Metadata } from "next";
import { SettingsView } from "@/components/power/settings-view";

export const metadata: Metadata = {
  title: "ABI settings",
  description: "Power mode, your OpenAI key, models and saved conversations.",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <section className="relative px-4 pb-24 pt-28 sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <SettingsView />
      </div>
    </section>
  );
}
