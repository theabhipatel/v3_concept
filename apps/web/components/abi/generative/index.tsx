"use client";

import { Compass, Filter, Palette } from "lucide-react";
import type { UiAction } from "../actions";
import {
  BookCard,
  CodeCard,
  CompareTable,
  ContactDraftCard,
  GithubCard,
  JdMatchCard,
  ProjectCards,
  ResumeCard,
  SkillsChart,
  Timeline,
} from "./cards";

function ActionChip({ icon: Icon, children }: { icon: typeof Compass; children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full border border-abi/30 bg-abi-soft px-3 py-1 font-mono text-[11px] text-abi-text">
      <Icon className="size-3.5" aria-hidden />
      {children}
    </p>
  );
}

/** Renders a tool result as a real component (generative UI). */
export function GenerativeUI({ action }: { action: UiAction }) {
  const o = action.output ?? {};
  if (o.error) return <p className="text-xs text-subtle-foreground">({String(o.error)})</p>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = o as any;
  switch (o.ui) {
    case "navigate":
      return <ActionChip icon={Compass}>opened {data.path}{data.section ? `#${data.section}` : ""}</ActionChip>;
    case "filter-projects":
      return <ActionChip icon={Filter}>projects filtered: {data.category}{data.type !== "all" ? `, ${data.type}` : ""}</ActionChip>;
    case "filter-skills":
      return <ActionChip icon={Filter}>skills filtered: {data.category}</ActionChip>;
    case "theme":
      return <ActionChip icon={Palette}>switched to {data.theme} theme</ActionChip>;
    case "projects":
      return <ProjectCards slugs={data.slugs} />;
    case "compare":
      return <CompareTable slugs={data.slugs} />;
    case "skills":
      return <SkillsChart category={data.category} />;
    case "timeline":
      return <Timeline />;
    case "github":
      return <GithubCard data={data} />;
    case "code":
      return <CodeCard data={data} />;
    case "jd-match":
      return <JdMatchCard data={data} />;
    case "resume":
      return <ResumeCard data={data} />;
    case "book":
      return <BookCard data={data} />;
    case "contact":
      return <ContactDraftCard data={data} />;
    default:
      return null;
  }
}
