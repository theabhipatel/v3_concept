import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Users' OpenAI keys are sealed with AES-256-GCM before they touch the database. The key comes
// from ABI_KEY_SECRET (server env only), so a database leak alone reveals nothing usable.
function secretKey() {
  const secret = process.env.ABI_KEY_SECRET;
  if (!secret || secret.length < 32) throw new Error("ABI_KEY_SECRET is missing or too short");
  return createHash("sha256").update(secret).digest();
}

/** "v1.<iv>.<tag>.<ciphertext>", all base64url. The user id is bound in as extra data. */
export function seal(plain: string, userId: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  cipher.setAAD(Buffer.from(userId));
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

export function open(sealed: string, userId: string) {
  const [v, iv, tag, data] = sealed.split(".");
  if (v !== "v1") throw new Error("Unknown key format");
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(userId));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}
