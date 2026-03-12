import { createHash } from "crypto";

/**
 * Hash an API key with SHA-256 and a prefix for identification.
 * Used for storing and comparing API keys securely.
 */
export function hashApiKey(rawKey: string): string {
  return "sha256:" + createHash("sha256").update(rawKey).digest("hex");
}
