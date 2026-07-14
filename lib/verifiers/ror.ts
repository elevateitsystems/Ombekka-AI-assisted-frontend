import type { VerificationResult } from "@/lib/types";

const ROR_API = "https://api.ror.org/organizations";

interface RorApiResponse {
  id?: string;
  names?: Array<{ value: string; types?: string[] }>;
  locations?: Array<{ geonames_details?: { country_name?: string; country_code?: string } }>;
  links?: Array<{ type?: string; value?: string }> | string[];
  types?: string[];
  established?: number | null;
}

export async function verifyROR(rorId: string): Promise<VerificationResult> {
  // rorId may arrive as a full URL or bare 9-char ID
  const bareId = rorId.replace(/^https?:\/\/ror\.org\//i, "");

  try {
    const url = `${ROR_API}/${bareId}`;
    console.log(`[API CALL] verifyROR: ${url}`);
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    console.log(`[API RESPONSE] verifyROR: HTTP ${res.status}`);

    if (res.status === 404) {
      return {
        input: rorId,
        detectedType: "ror",
        valid: false,
        source: "ROR",
        data: null,
        integrityScore: 0,
        issues: ["ROR ID not found"],
      };
    }

    if (!res.ok) {
      console.error(`[verifyROR] ROR API returned ${res.status} for: ${rorId}`);
      return {
        input: rorId,
        detectedType: "ror",
        valid: false,
        source: "ROR",
        data: null,
        integrityScore: 0,
        issues: [`ROR API error: HTTP ${res.status}`],
      };
    }

    const json = (await res.json()) as RorApiResponse;
    const issues: string[] = [];

    // Extract name from v2 names array (prefer ror_display) or fallback
    const rorDisplay = json.names?.find(n => n.types?.includes("ror_display"))?.value;
    const label = json.names?.find(n => n.types?.includes("label"))?.value;
    const fallbackName = json.names?.[0]?.value;
    const name = rorDisplay || label || fallbackName || null;

    // Extract country from v2 locations array
    const countryName = json.locations?.[0]?.geonames_details?.country_name ?? null;
    const countryCode = json.locations?.[0]?.geonames_details?.country_code ?? null;

    // Extract aliases and acronyms
    const aliases = json.names?.filter(n => n.types?.includes("alias")).map(n => n.value) ?? [];
    const acronyms = json.names?.filter(n => n.types?.includes("acronym")).map(n => n.value) ?? [];
    
    // Links might be objects in v2
    const links = (json.links ?? []).map(l => typeof l === 'string' ? l : l.value).filter(Boolean) as string[];

    if (!name) issues.push("Organization name not present in ROR record");
    if (!countryName) issues.push("Country information missing from ROR record");

    return {
      input: rorId,
      detectedType: "ror",
      valid: true,
      source: "ROR",
      data: {
        name,
        country: countryName,
        countryCode,
        links,
        types: json.types ?? [],
        established: json.established ?? null,
        aliases,
        acronyms,
        rorUrl: json.id ?? `https://ror.org/${bareId}`,
      },
      integrityScore: issues.length === 0 ? 100 : 75,
      issues,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[verifyROR] Fetch failed for ROR ID: ${rorId}`, err);
    return {
      input: rorId,
      detectedType: "ror",
      valid: false,
      source: "ROR",
      data: null,
      integrityScore: 0,
      issues: [],
      error: `ROR lookup failed: ${message}`,
    };
  }
}
