import { Bot, Cloud, Code2, Database, FlaskConical, Infinity as Loop, Monitor, Server, Wrench, type LucideIcon } from "lucide-react";
import type { Skill, SkillCategory, SkillLevel } from "@/lib/content";

/** Each skill category keeps one tint (a --tone-* token) and icon everywhere on the site. */
export const CATEGORY_META: Record<SkillCategory, { tone: number; icon: LucideIcon }> = {
  AI: { tone: 2, icon: Bot },
  Frontend: { tone: 1, icon: Monitor },
  Backend: { tone: 3, icon: Server },
  Languages: { tone: 5, icon: Code2 },
  Database: { tone: 4, icon: Database },
  DevOps: { tone: 6, icon: Loop },
  Cloud: { tone: 4, icon: Cloud },
  Tools: { tone: 5, icon: Wrench },
  Testing: { tone: 6, icon: FlaskConical },
};

export const toneOf = (category: SkillCategory) => `var(--tone-${CATEGORY_META[category]?.tone ?? 1})`;

export const LEVEL_ORDER: Record<SkillLevel, number> = { Expert: 0, Advanced: 1, Intermediate: 2, Learning: 3 };

/** Some brand icons are white-only; they are inverted in the light theme. */
export const whiteOnly = (s: Skill) => /\/white$|\/dark\//.test(s.icon);

/** And some are black-only; they are inverted in the dark theme. */
export const blackOnly = (s: Skill) => /\/(github|express|nextjs|vercel|socketio|prisma)-original\.svg$/.test(s.icon);

/** Classes that keep a logo visible in both themes. */
export const logoClass = (s: Skill) => (whiteOnly(s) ? "invert dark:invert-0" : blackOnly(s) ? "dark:invert" : "");
