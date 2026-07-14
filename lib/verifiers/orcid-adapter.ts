/**
 * Thin adapter that wraps the existing verifyORCID() helper so it returns the
 * unified VerificationResult shape. The original lib/verifiers/orcid.ts is
 * NOT modified.
 */
import type { VerificationResult } from "@/lib/types";
import { verifyORCID } from "./orcid";

export async function verifyOrcidAdapter(
  orcidId: string
): Promise<VerificationResult> {
  try {
    const raw = await verifyORCID(orcidId);

    // verifyORCID returns partial shape — it may or may not include all fields
    const valid = raw.valid ?? false;
    const issues: string[] = Array.isArray(raw.issues) ? raw.issues : [];

    // Check if the original threw/returned an error sentinel
    const hadError = !valid && issues.some((i) => i.toLowerCase().includes("failed") || i.toLowerCase().includes("timed out"));

    return {
      input: orcidId,
      detectedType: "orcid",
      valid,
      source: raw.source ?? "ORCID",
      data: raw.data
        ? (raw.data as Record<string, unknown>)
        : null,
      integrityScore: valid ? ((raw as { integrityScore?: number }).integrityScore ?? 100) : 0,
      issues,
      ...(hadError
        ? { error: issues[0] }
        : {}),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[verifyOrcidAdapter] Unexpected error for ORCID: ${orcidId}`, err);
    return {
      input: orcidId,
      detectedType: "orcid",
      valid: false,
      source: "ORCID",
      data: null,
      integrityScore: 0,
      issues: [],
      error: `ORCID lookup threw unexpectedly: ${message}`,
    };
  }
}
