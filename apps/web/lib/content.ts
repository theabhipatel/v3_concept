// Typed access to the shared data in v3/content. This is the only place the web app reads it.
import profileJson from "@content/profile.json";
import projectsJson from "@content/projects.json";
import skillsJson from "@content/skills.json";
import experienceJson from "@content/experience.json";
import contactJson from "@content/contact.json";
import seoJson from "@content/seo.json";

export type ProjectCategory = "AI" | "Full Stack" | "DevOps" | "Frontend" | "React Native";
export type ProjectType = "personal" | "client";

export interface Project {
  slug: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  categories: ProjectCategory[];
  type: ProjectType;
  github: string;
  demo: string;
  featured: boolean;
}

export type SkillCategory =
  | "AI"
  | "Frontend"
  | "Backend"
  | "Languages"
  | "Database"
  | "DevOps"
  | "Cloud"
  | "Tools"
  | "Testing";
export type SkillLevel = "Expert" | "Advanced" | "Intermediate" | "Learning";

export interface Skill {
  slug: string;
  name: string;
  icon: string;
  category: SkillCategory;
  level: SkillLevel;
  experience: string;
}

export interface Experience {
  slug: string;
  company: string;
  role: string;
  start: string;
  end: string | null;
  period: string;
  location: string;
  current: boolean;
  description: string;
  highlights: string[];
  technologies: string[];
}

export type PageKey = keyof typeof seoJson.pages;

export const profile = profileJson;
export const projects = projectsJson as Project[];
export const skillCategories = skillsJson.categories as { id: SkillCategory; label: string }[];
export const skills = skillsJson.skills as Skill[];
export const experience = experienceJson as Experience[];
export const contact = contactJson;
export const seo = seoJson;

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getSkillsByCategory(category: SkillCategory): Skill[] {
  return skills.filter((s) => s.category === category);
}
