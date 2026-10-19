import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetCard } from "@/components/power/reset-card";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your ABI account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-28 sm:pt-36">
      <div data-motion suppressHydrationWarning className="hero__wash pointer-events-none absolute inset-0" aria-hidden />
      <div data-intro="scale" className="relative mx-auto w-full max-w-md">
        <Suspense>
          <ResetCard />
        </Suspense>
      </div>
    </section>
  );
}
