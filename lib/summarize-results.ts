import type { VerificationResult } from "./types";

/** Build a summary object from a list of results */
export function buildSummary(results: VerificationResult[]) {
  const total = results.length;
  const verified = results.filter((r) => r.valid).length;
  const failed = total - verified;
  const averageScore =
    total === 0
      ? 0
      : Math.round(
          results.reduce((acc, r) => acc + (r.integrityScore || 0), 0) / total
        );
  return { total, verified, failed, averageScore };
}
