import "server-only";
import { currentUser } from "./auth";
import { jsonError } from "./power";

/** The signed-in admin, or a ready 401/403 response. */
export async function requireAdmin() {
  const user = (await currentUser()) as ({ id: string; role?: string | null } & Record<string, unknown>) | null;
  if (!user) return { error: jsonError(401, "Please sign in.") };
  if (user.role !== "admin") return { error: jsonError(403, "Admins only.") };
  return { admin: user };
}
