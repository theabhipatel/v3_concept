import {
  Award,
  BookOpen,
  Brain,
  Code2,
  Coffee,
  Globe,
  Mail,
  Music,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

type IconProps = React.SVGProps<SVGSVGElement>;

// Brand marks (lucide no longer ships brand logos).
export function GithubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41Z" />
    </svg>
  );
}

export function LeetCodeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.48 0a1.37 1.37 0 0 0-.96.44L7.12 6.22l-2.9 3.11a5.28 5.28 0 0 0-1.17 2.04 5.6 5.6 0 0 0 .08 3.46 5.48 5.48 0 0 0 1.3 2.05l4.33 4.34a5.4 5.4 0 0 0 7.56.03l2.59-2.51a1.38 1.38 0 1 0-1.92-1.98l-2.6 2.52a2.65 2.65 0 0 1-3.7-.02L6.38 15a2.7 2.7 0 0 1-.03-3.78l2.9-3.11 5.24-5.77A1.38 1.38 0 0 0 13.48 0Zm-2.39 12.29a1.38 1.38 0 1 0 0 2.75h9.92a1.38 1.38 0 0 0 0-2.75Z" />
    </svg>
  );
}

const brandIcons: Record<string, (p: IconProps) => React.JSX.Element> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  x: XIcon,
  leetcode: LeetCodeIcon,
};

const lucideIcons: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  award: Award,
  users: Users,
  target: Target,
  code: Code2,
  "book-open": BookOpen,
  music: Music,
  globe: Globe,
  "trending-up": TrendingUp,
  coffee: Coffee,
  brain: Brain,
  zap: Zap,
  mail: Mail,
};

/** Renders an icon by the name used in content/*.json. */
export function NamedIcon({ name, className }: { name: string; className?: string }) {
  const Brand = brandIcons[name];
  if (Brand) return <Brand className={className} />;
  const Lucide = lucideIcons[name] ?? Sparkles;
  return <Lucide className={className} aria-hidden />;
}
