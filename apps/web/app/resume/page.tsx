import type { Metadata } from "next";
import { profile } from "@/lib/content";
import { ResumeView } from "./resume-view";

export const metadata: Metadata = {
  title: `Resume - ${profile.name}`,
  robots: { index: false, follow: false },
};

export default function ResumePage() {
  return <ResumeView />;
}
