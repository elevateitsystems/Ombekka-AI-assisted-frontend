import type { VerificationResult } from "@/lib/types";

const CROSSREF_MAILTO = "mnemic@verify.local";
const CROSSREF_BASE = "https://api.crossref.org/works";
const DATACITE_BASE = "https://api.datacite.org/dois";

// ─── Helpers ───────────────────────────────────────────────────────────────

function extractCrossRefData(work: Record<string, unknown>) {
  const titleArr = work["title"] as string[] | undefined;
  const title = titleArr?.[0] ?? null;

  const authorArr = (
    work["author"] as Array<{ given?: string; family?: string }> | undefined
  )?.map((a) => [a.given, a.family].filter(Boolean).join(" ")) ?? [];

  const publisher = (work["publisher"] as string | undefined) ?? null;

  const dateParts = (
    work["published-print"] as
      | { "date-parts"?: number[][] }
      | undefined
  )?.["date-parts"]?.[0];
  const publishedDate = dateParts
    ? dateParts.filter(Boolean).join("-")
    : ((work["created"] as { "date-time"?: string } | undefined)?.[
        "date-time"
      ] ?? null);

  return { title, authors: authorArr, publisher, publishedDate };
}

function extractDataCiteData(attrs: Record<string, unknown>) {
  const titles = (attrs["titles"] as Array<{ title: string }> | undefined) ?? [];
  const title = titles[0]?.title ?? null;
  const creators = (
    attrs["creators"] as Array<{ name?: string }> | undefined
  )?.map((c) => c.name ?? "") ?? [];
  const publisher = (attrs["publisher"] as string | undefined) ?? null;
  const publishedDate = (attrs["publicationYear"] as string | undefined) ?? null;
  return { title, authors: creators, publisher, publishedDate };
}

// ─── Main verifier ─────────────────────────────────────────────────────────

export async function verifyDOI(doi: string): Promise<VerificationResult> {
  const base: Omit<VerificationResult, "valid" | "integrityScore" | "data" | "source" | "issues"> = {
    input: doi,
    detectedType: "doi",
  };

  // ── CrossRef ──────────────────────────────────────────────────────────────
  try {
    const crossRefUrl = `${CROSSREF_BASE}/${encodeURIComponent(doi)}?mailto=${CROSSREF_MAILTO}`;
    console.log(`[API CALL] verifyDOI (CrossRef): ${crossRefUrl}`);
    const crossRefRes = await fetch(
      crossRefUrl,
      { signal: AbortSignal.timeout(5000) }
    );
    console.log(`[API RESPONSE] verifyDOI (CrossRef): HTTP ${crossRefRes.status}`);

    if (crossRefRes.ok) {
      const json = (await crossRefRes.json()) as {
        message?: Record<string, unknown>;
      };
      const work = json.message ?? {};
      const extracted = extractCrossRefData(work);
      const issues: string[] = [];
      if (!extracted.title) issues.push("Title not available in CrossRef record");
      if (extracted.authors.length === 0) issues.push("No authors listed in CrossRef record");

      return {
        ...base,
        valid: true,
        source: "CrossRef",
        data: extracted as unknown as Record<string, unknown>,
        integrityScore: issues.length === 0 ? 100 : 75,
        issues,
      };
    }

    if (crossRefRes.status !== 404) {
      // Non-404 failure — still try DataCite before giving up
      console.error(`[verifyDOI] CrossRef returned ${crossRefRes.status} for DOI: ${doi}`);
    }
  } catch (err) {
    // Timeout or network error on CrossRef — fall through to DataCite
    console.error(`[verifyDOI] CrossRef fetch failed for DOI: ${doi}`, err);
  }

  // ── DataCite fallback ────────────────────────────────────────────────────
  try {
    const dcUrl = `${DATACITE_BASE}/${encodeURIComponent(doi)}`;
    console.log(`[API CALL] verifyDOI (DataCite): ${dcUrl}`);
    const dcRes = await fetch(
      dcUrl,
      { signal: AbortSignal.timeout(5000) }
    );
    console.log(`[API RESPONSE] verifyDOI (DataCite): HTTP ${dcRes.status}`);

    if (dcRes.ok) {
      const json = (await dcRes.json()) as {
        data?: { attributes?: Record<string, unknown> };
      };
      const attrs = json.data?.attributes ?? {};
      const extracted = extractDataCiteData(attrs);
      const issues: string[] = ["Only found via DataCite (CrossRef lookup failed or returned 404)"];
      if (!extracted.title) issues.push("Title not available in DataCite record");

      return {
        ...base,
        valid: true,
        source: "DataCite",
        data: extracted as unknown as Record<string, unknown>,
        integrityScore: 65,
        issues,
      };
    }

    if (dcRes.status === 404) {
      return {
        ...base,
        valid: false,
        source: "CrossRef + DataCite",
        data: null,
        integrityScore: 0,
        issues: ["DOI not found in CrossRef or DataCite"],
      };
    }

    return {
      ...base,
      valid: false,
      source: "CrossRef + DataCite",
      data: null,
      integrityScore: 0,
      issues: [`DataCite returned HTTP ${dcRes.status}`],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[verifyDOI] DataCite fetch failed for DOI: ${doi}`, err);
    return {
      ...base,
      valid: false,
      source: "CrossRef + DataCite",
      data: null,
      integrityScore: 0,
      issues: [],
      error: `Both CrossRef and DataCite lookups failed: ${message}`,
    };
  }
}
