/**
 * Central verification pipeline.
 * Accepts a raw string, detects the identifier type, checks the cache,
 * calls the appropriate verifier, and populates the cache on success.
 */
import type { VerificationResult } from "@/lib/types";
import { detectIdentifierType, normalizeInput } from "@/lib/detect-identifier";
import { cacheKey, getCached, setCached } from "@/lib/cache";
import { verifyDOI } from "@/lib/verifiers/doi";
import { verifyROR } from "@/lib/verifiers/ror";
import { verifyISBN } from "@/lib/verifiers/isbn";
import { verifyURL } from "@/lib/verifiers/url";
import { verifyOrcidAdapter } from "@/lib/verifiers/orcid-adapter";

/** Build a sentinel result for identifiers we can't handle */
function unknownResult(input: string): VerificationResult {
  return {
    input,
    detectedType: "unknown",
    valid: false,
    source: "None",
    data: null,
    integrityScore: 0,
    issues: [
      "Could not determine identifier type. Expected: ISBN-10/13, DOI, ORCID, ROR, or a http(s) URL.",
    ],
  };
}

/**
 * Detect, cache-check, verify, and cache-populate for a single identifier string.
 * This function NEVER throws — all errors are caught and returned in `result.error`.
 */
export async function verifyIdentifier(
  input: string
): Promise<VerificationResult> {
  const trimmed = input.trim();
  if (!trimmed) return unknownResult(input);

  const type = detectIdentifierType(trimmed);
  if (type === "unknown") return unknownResult(trimmed);

  // Normalise for cache key (e.g. strip hyphens from ISBN, extract bare ROR ID)
  const normalized = normalizeInput(type, trimmed);
  const key = cacheKey(type, normalized);

  // Cache hit
  const cached = getCached(key);
  if (cached) {
    return { ...cached, input: trimmed };
  }

  // Dispatch to correct verifier
  let result: VerificationResult;

  try {
    switch (type) {
      case "doi":
        result = await verifyDOI(normalized);
        break;
      case "isbn":
        result = await verifyISBN(normalized);
        break;
      case "orcid":
        result = await verifyOrcidAdapter(normalized);
        break;
      case "ror":
        result = await verifyROR(normalized);
        break;
      case "url":
        result = await verifyURL(normalized);
        break;
      default:
        return unknownResult(trimmed);
    }
  } catch (err) {
    // Verifier itself threw unexpectedly (shouldn't happen — each verifier
    // has its own try/catch, but this is the safety net)
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[verifyIdentifier] Unexpected error for ${type}:${normalized}`, err);
    result = {
      input: trimmed,
      detectedType: type,
      valid: false,
      source: typeToSource(type),
      data: null,
      integrityScore: 0,
      issues: [],
      error: `Verification failed unexpectedly: ${message}`,
    };
  }

  // Only cache successful, definitive results (not errors, not "not found")
  if (result.valid && !result.error) {
    setCached(key, result);
  }

  // Always return the user's original (trimmed) input in the result regardless
  // of what normalized form was passed to the verifier for the API call.
  // e.g. "978-0-14-313734-6" should appear in input, not "9780143137346".
  result = { ...result, input: trimmed };

  return result;
}

function typeToSource(type: string): string {
  switch (type) {
    case "doi":    return "CrossRef + DataCite";
    case "isbn":   return "Open Library + Google Books";
    case "orcid":  return "ORCID";
    case "ror":    return "ROR";
    case "url":    return "HTTP";
    default:       return "None";
  }
}

