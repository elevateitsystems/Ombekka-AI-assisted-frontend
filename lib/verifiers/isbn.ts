import type { VerificationResult } from "@/lib/types";
import { validateIsbnChecksum } from "@/lib/detect-identifier";

const OPEN_LIBRARY_BASE = "https://openlibrary.org/api/books";
const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1/volumes";

// ─── Title similarity ──────────────────────────────────────────────────────

/**
 * Normalise a title for comparison: lower-case, collapse whitespace,
 * strip punctuation, drop common stop words.
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simple character-bigram overlap similarity (Sørensen–Dice coefficient).
 * Returns 0–1. Good enough for title cross-check without a dependency.
 */
function bigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const getBigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };

  const aBigrams = getBigrams(a);
  const bBigrams = getBigrams(b);
  let intersection = 0;
  for (const bg of aBigrams) {
    if (bBigrams.has(bg)) intersection++;
  }
  return (2 * intersection) / (aBigrams.size + bBigrams.size);
}

function titlesMatch(t1: string | null, t2: string | null): boolean {
  if (!t1 || !t2) return false;
  const sim = bigramSimilarity(normalizeTitle(t1), normalizeTitle(t2));
  return sim >= 0.6; // 60% bigram overlap threshold
}

// ─── Open Library fetch ────────────────────────────────────────────────────

interface OpenLibRecord {
  title?: string;
  authors?: Array<{ name?: string }>;
  publishers?: Array<{ name?: string }>;
  publish_date?: string;
  number_of_pages?: number;
}

async function fetchOpenLibrary(
  isbn: string
): Promise<OpenLibRecord | null> {
  const url = `${OPEN_LIBRARY_BASE}?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  console.log(`[API CALL] fetchOpenLibrary: ${url}`);
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  
  if (!res.ok) {
    console.log(`[API RESPONSE] fetchOpenLibrary: Error ${res.status}`);
    return null;
  }
  const json = (await res.json()) as Record<string, OpenLibRecord>;
  console.log(`[API RESPONSE] fetchOpenLibrary: OK, data length: ${JSON.stringify(json).length} bytes`);
  return json[`ISBN:${isbn}`] ?? null;
}

// ─── Google Books fetch ────────────────────────────────────────────────────

interface GoogleBooksItem {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
  };
}

async function fetchGoogleBooks(isbn: string): Promise<GoogleBooksItem | null> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const url = key
    ? `${GOOGLE_BOOKS_BASE}?q=isbn:${isbn}&key=${key}`
    : `${GOOGLE_BOOKS_BASE}?q=isbn:${isbn}`;

  const safeUrl = key ? `${GOOGLE_BOOKS_BASE}?q=isbn:${isbn}&key=***` : url;
  console.log(`[API CALL] fetchGoogleBooks: ${safeUrl}`);

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    console.log(`[API RESPONSE] fetchGoogleBooks: Error ${res.status}`);
    return null;
  }
  const json = (await res.json()) as {
    totalItems?: number;
    items?: GoogleBooksItem[];
  };
  console.log(`[API RESPONSE] fetchGoogleBooks: OK, totalItems: ${json.totalItems}`);
  return json.items?.[0] ?? null;
}

// ─── Main verifier ─────────────────────────────────────────────────────────

export async function verifyISBN(isbn: string): Promise<VerificationResult> {
  // Normalise: strip hyphens and spaces
  const cleanIsbn = isbn.replace(/[- ]/g, "");

  // Validate checksum — if invalid, do not attempt lookup
  if (!validateIsbnChecksum(cleanIsbn)) {
    return {
      input: isbn,
      detectedType: "isbn",
      valid: false,
      source: "Checksum validation",
      data: null,
      integrityScore: 0,
      issues: ["ISBN check digit is invalid — not a real ISBN, lookup skipped"],
    };
  }

  // The rest of the function proceeds only if the checksum is valid.
  // Seed issues array empty.
  const checksumIssues: string[] = [];

  const [olResult, gbResult] = await Promise.allSettled([
    fetchOpenLibrary(cleanIsbn),
    fetchGoogleBooks(cleanIsbn),
  ]);

  const olRecord =
    olResult.status === "fulfilled" ? olResult.value : null;
  const gbRecord =
    gbResult.status === "fulfilled" ? gbResult.value : null;

  const olError =
    olResult.status === "rejected" ? (olResult.reason as Error)?.message : null;
  const gbError =
    gbResult.status === "rejected" ? (gbResult.reason as Error)?.message : null;

  if (olError) console.error(`[verifyISBN] Open Library failed for ${isbn}:`, olError);
  if (gbError) console.error(`[verifyISBN] Google Books failed for ${isbn}:`, gbError);

  // ── Neither source found the book ─────────────────────────────────────────
  if (!olRecord && !gbRecord) {
    const errorParts: string[] = [];
    if (olError) errorParts.push(`Open Library: ${olError}`);
    if (gbError) errorParts.push(`Google Books: ${gbError}`);

    return {
      input: isbn,
      detectedType: "isbn",
      valid: false,
      source: "Open Library + Google Books",
      data: null,
      integrityScore: 0,
      issues: [...checksumIssues, "ISBN not found in Open Library or Google Books"],
      ...(errorParts.length > 0
        ? { error: errorParts.join("; ") }
        : {}),
    };
  }

  // ── Extract titles for cross-check ────────────────────────────────────────
  const olTitle = olRecord?.title ?? null;
  const gbTitle = gbRecord?.volumeInfo?.title ?? null;
  // Seed issues with any checksum warning — additional issues will be appended below
  const issues: string[] = [...checksumIssues];

  // ── Build merged data payload ──────────────────────────────────────────────
  const data: Record<string, unknown> = {
    title: olTitle ?? gbTitle,
    authors:
      olRecord?.authors?.map((a) => a.name ?? "").filter(Boolean) ??
      gbRecord?.volumeInfo?.authors ??
      [],
    publisher:
      olRecord?.publishers?.[0]?.name ??
      gbRecord?.volumeInfo?.publisher ??
      null,
    publishedDate:
      olRecord?.publish_date ?? gbRecord?.volumeInfo?.publishedDate ?? null,
    pages:
      olRecord?.number_of_pages ??
      gbRecord?.volumeInfo?.pageCount ??
      null,
    foundInOpenLibrary: olRecord !== null,
    foundInGoogleBooks: gbRecord !== null,
  };

  // ── Scoring ──────────────────────────────────────────────────────────────
  let integrityScore: number;

  if (olRecord && gbRecord) {
    // Both sources found the book
    if (olTitle && gbTitle) {
      const match = titlesMatch(olTitle, gbTitle);
      if (!match) {
        issues.push(
          `Title mismatch between sources — Open Library: "${olTitle}" vs Google Books: "${gbTitle}"`
        );
        integrityScore = 40; // found in both but titles diverge
      } else {
        integrityScore = 100; // both found, titles agree
      }
    } else {
      // At least one title missing — can't cross-check
      issues.push("Could not cross-check titles: one source did not return a title");
      integrityScore = 70;
    }
  } else {
    // Only one source found it
    const sourceName = olRecord ? "Open Library" : "Google Books";
    issues.push(`Only found in ${sourceName}; could not cross-check against second source`);
    integrityScore = 65;
  }

  // Cap the score when the checksum is known-bad — a real book may have been found
  // in the database (databases can be lenient) but the identifier itself is suspect
  if (checksumIssues.length > 0) {
    integrityScore = Math.min(integrityScore, 60);
  }

  return {
    input: isbn,
    detectedType: "isbn",
    valid: true,
    source: "Open Library + Google Books",
    data,
    integrityScore,
    issues,
  };
}
