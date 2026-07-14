import type { DetectedType } from "@/lib/types";

// ─── Regex patterns ────────────────────────────────────────────────────────

/** DOI: must start with the 10. registrant prefix */
const DOI_RE = /^10\.\d{4,9}\/.+/;

/** ORCID: 4 groups of 4 digits separated by hyphens, last char may be X */
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

/** ROR full URL or bare 9-character alphanum ID (starts with 0) */
const ROR_URL_RE = /^https:\/\/ror\.org\/([0-9a-z]{9})$/;
const ROR_BARE_RE = /^0[0-9a-z]{8}$/;

/**
 * Validate an ISBN-10 checksum.
 * Input must already be stripped of hyphens/spaces (10 chars).
 */
function validIsbn10(digits: string): boolean {
  if (!/^\d{9}[\dX]$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  const last = digits[9] === "X" ? 10 : parseInt(digits[9], 10);
  sum += last;
  return sum % 11 === 0;
}

/**
 * Validate an ISBN-13 checksum.
 * Input must already be stripped of hyphens/spaces (13 chars).
 */
function validIsbn13(digits: string): boolean {
  if (!/^\d{13}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(digits[12], 10);
}

/** Strip hyphens and spaces from an ISBN candidate string */
function stripIsbn(s: string): string {
  return s.replace(/[- ]/g, "");
}

/**
 * Format-only ISBN check (no checksum).
 * Returns true if the stripped string is 10 digits (last may be X) or 13 digits.
 * Used for *detection* so that hyphenated or checksum-invalid ISBNs still route
 * to verifyISBN, which can flag the checksum issue rather than silently returning
 * detectedType = "unknown".
 */
function isbnFormatValid(normalized: string): boolean {
  if (normalized.length === 10) return /^\d{9}[\dX]$/i.test(normalized);
  if (normalized.length === 13) return /^\d{13}$/.test(normalized);
  return false;
}

/**
 * Exported checksum validator — call this from verifyISBN to flag bad check digits
 * as an issue without blocking detection.
 * Input must already be stripped of hyphens/spaces.
 */
export function validateIsbnChecksum(normalized: string): boolean {
  if (normalized.length === 10) return validIsbn10(normalized);
  if (normalized.length === 13) return validIsbn13(normalized);
  return false;
}

/** Return true if the input is a well-formed http(s) URL */
function isUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Classify `input` into one of the known identifier types.
 *
 * Detection priority (first match wins):
 *   1. ORCID  — exact format check
 *   2. DOI    — starts with 10.xxxx/
 *   3. ROR    — ror.org URL or bare 9-char ID
 *   4. ISBN   — 10 or 13 digits (after stripping hyphens/spaces); format-only,
 *               no checksum — checksum is validated by verifyISBN and reported
 *               as an issue rather than silently falling through to "unknown"
 *   5. URL    — any http(s) URL not already matched above
 *   6. unknown
 */
export function detectIdentifierType(input: string): DetectedType {
  const trimmed = input.trim();

  // ORCID — check before URL because a bare ORCID has no protocol
  if (ORCID_RE.test(trimmed)) return "orcid";

  // DOI — check before URL because a DOI URL would also pass the URL check
  if (DOI_RE.test(trimmed)) return "doi";
  // DOI embedded in a URL (e.g. https://doi.org/10.xxxx/...)
  const doiInUrl = trimmed.match(/\b(10\.\d{4,9}\/.+)/);
  if (doiInUrl) return "doi";

  // ROR
  if (ROR_URL_RE.test(trimmed) || ROR_BARE_RE.test(trimmed)) return "ror";

  // ISBN — strip hyphens/spaces first, then run format-only check.
  // Checksum validation is intentionally deferred to verifyISBN so that
  // mis-printed or hyphenated ISBNs with bad check digits still route to
  // the verifier (which can attempt the lookup and flag the checksum issue)
  // rather than silently returning "unknown".
  const isbnNormalized = stripIsbn(trimmed);
  if (isbnFormatValid(isbnNormalized)) return "isbn";

  // URL — anything with a valid http/https scheme that wasn't caught above
  if (isUrl(trimmed)) return "url";

  return "unknown";
}

/** Normalise an identifier to a canonical form for cache keying */
export function normalizeInput(type: DetectedType, input: string): string {
  const t = input.trim();
  switch (type) {
    case "isbn":
      return t.replace(/[- ]/g, "");
    case "doi": {
      // Extract the raw DOI from a doi.org URL if present
      const m = t.match(/\b(10\.\d{4,9}\/.+)/);
      return m ? m[1].replace(/[.,;]+$/, "") : t;
    }
    case "ror": {
      const m = t.match(ROR_URL_RE);
      return m ? m[1] : t;
    }
    case "url":
      return t.replace(/\/$/, ""); // strip trailing slash
    default:
      return t;
  }
}
