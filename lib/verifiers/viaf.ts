/**
 * lib/verifiers/viaf.ts
 *
 * VIAF (Virtual International Authority File) search verifier.
 * Returns top-3 candidate matches — does NOT auto-pick one.
 * Follows the same error-handling pattern as all other verifiers:
 * 5 s timeout, never throws unhandled, returns structured failure.
 */

const VIAF_SEARCH = "https://viaf.org/viaf/AutoSuggest";
const USER_AGENT = "Mnemic-CitationVerifier/1.0 (https://github.com/ombekka; mailto:mnemic@verify.local)";
const TOP_N = 3;

// ─── Response types ──────────────────────────────────────────────────────────

export interface ViafCandidate {
  viafId: string;
  name: string;
  /** 0–1 relevance signal from the VIAF score field, normalised to 0–100 */
  confidence: number;
}

export interface ViafResult {
  ok: boolean;
  candidates: ViafCandidate[];
  /** Present only on network/API failure */
  error?: string;
}

// ─── Internal VIAF AutoSuggest JSON shape ──────────────────────────────────────

interface ViafAutoSuggestRecord {
  term?: string;
  displayForm?: string;
  nametype?: string;
  viafid?: string;
  score?: string;
}

interface ViafAutoSuggestResponse {
  result?: ViafAutoSuggestRecord[];
}

// ─── Shared fetch helper ─────────────────────────────────────────────────────

async function searchViaf(
  query: string,
  label: string,
  nametype: "personal" | "corporate"
): Promise<ViafResult> {
  const url = `${VIAF_SEARCH}?query=${encodeURIComponent(query)}`;
  console.log(`[VIAF ${label}] GET ${url}`);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    console.log(`[VIAF ${label}] HTTP ${res.status}`);

    if (!res.ok) {
      return {
        ok: false,
        candidates: [],
        error: `VIAF API error: HTTP ${res.status}`,
      };
    }

    const json = (await res.json()) as ViafAutoSuggestResponse;
    console.log(`[VIAF ${label}] Raw response length:`, json.result?.length ?? 0);

    const records = json.result ?? [];

    const candidates: ViafCandidate[] = records
      .filter((r) => r.nametype === nametype && r.viafid)
      .map((r) => {
        const name = r.displayForm ?? r.term ?? "(unknown)";
        // AutoSuggest score is a raw string integer, often in the thousands.
        // We'll normalize it relative to a theoretical max of 10000, capped at 100.
        const rawScore = parseInt(r.score ?? "0", 10) || 0;
        const confidence = Math.max(10, Math.min(100, Math.round((rawScore / 10000) * 100)));

        return {
          viafId: r.viafid as string,
          name,
          confidence,
        } satisfies ViafCandidate;
      })
      .slice(0, TOP_N);

    return { ok: true, candidates };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[VIAF ${label}] fetch failed:`, err);
    return {
      ok: false,
      candidates: [],
      error: `VIAF lookup failed: ${msg}`,
    };
  }
}

// ─── Public exports ───────────────────────────────────────────────────────────

/**
 * Search VIAF for a personal name.
 * Returns top-3 candidates with viafId, name, confidence (0–100).
 */
export async function verifyViafPerson(name: string): Promise<ViafResult> {
  return searchViaf(name, "Person", "personal");
}

/**
 * Search VIAF for a corporate/organization name.
 * Returns top-3 candidates with viafId, name, confidence (0–100).
 */
export async function verifyViafOrganization(name: string): Promise<ViafResult> {
  return searchViaf(name, "Organization", "corporate");
}
