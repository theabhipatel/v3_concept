import type { Metadata } from "next";
import { AdminView } from "@/components/admin/admin-view";

export const metadata: Metadata = {
  title: "Admin",
  description: "User management for ABI accounts.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <section className="relative px-4 pb-24 pt-28 sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <AdminView />
      </div>
    </section>
  );
}
