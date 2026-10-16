// Who the visitor is. Each role gets a pre-built page order, so switching costs no AI tokens.
export const ROLES = [
  { id: "everyone", label: "Just looking", plural: "everyone" },
  { id: "recruiter", label: "Recruiter", plural: "recruiters" },
  { id: "founder", label: "Founder or client", plural: "founders and clients" },
  { id: "developer", label: "Developer", plural: "developers" },
] as const;

export type Role = (typeof ROLES)[number]["id"];
export const ROLE_IDS: readonly Role[] = ROLES.map((r) => r.id);
export const ROLE_PARAM = "for";

/** Starter questions for the ask box, tuned to the role. */
export const SUGGESTIONS: Record<Role, string[]> = {
  everyone: ["Show me his AI projects", "What does he do at IBR Infotech?", "Compare his top projects"],
  recruiter: ["Summarize his experience in 30 seconds", "What is his strongest skill?", "Is he open to full-time roles?"],
  founder: ["Can he build an AI chatbot for my business?", "Show me his client work", "How do we start a project?"],
  developer: ["How does your retrieval work?", "Show me real code from Secure Vault", "Which projects use LangGraph?"],
};
