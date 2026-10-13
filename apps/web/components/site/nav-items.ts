import { Bot, FlaskConical, FolderGit2, Home, Mail, Sparkles, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/skills", label: "Skills", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/about", label: "About", icon: UserRound },
  { href: "/contact", label: "Contact", icon: Mail },
  { href: "/lab", label: "AI Lab", icon: FlaskConical },
  { href: "/abi", label: "Talk to ABI", icon: Bot },
];
