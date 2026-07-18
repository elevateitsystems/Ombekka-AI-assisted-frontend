/**
 * lib/graph/resolve-entities.ts
 *
 * For each parsed GraphEntity, attempt to find and verify a real identifier
 * via the existing verifiers + VIAF fallback. All entities are run in parallel
 * via Promise.allSettled. Unresolved entities are still returned — a missing
 * identifier is meaningful forensic signal, never dropped.
 */

import type { GraphEntity } from "./parse-triples";
import { getCached, setCached, cacheKey } from "@/lib/cache";
import { verifyISBN } from "@/lib/verifiers/isbn";
import { verifyDOI } from "@/lib/verifiers/doi";
import { verifyORCID } from "@/lib/verifiers/orcid";
import { verifyROR } from "@/lib/verifiers/ror";
import { verifyViafPerson, verifyViafOrganization } from "@/lib/verifiers/viaf";
import type { VerificationResult } from "@/lib/types";
import { nameSimilarityScore } from "@/lib/utils";

// ─── Public output type ────────────────────────────────────────────────────────

export interface AlternateCandidate {
  source: string;
  value: string;
  confidence: number;
}

export interface ResolvedGraphNode {
  nodeId: string;
  type: "Book" | "Person" | "Organization" | "ScholarlyArticle";
  name: string;
  resolvedIdentifier: { type: string; value: string } | null;
  alternateCandidates: AlternateCandidate[];
  /**
   * true only when resolvedIdentifier passed full verification through
   * one of the real verifier APIs (ISBN, ORCID, ROR), not just a search hit.
   */
  verified: boolean;
  data: Record<string, unknown> | null;
}

// ─── Normalise name for cache key ─────────────────────────────────────────────

function normaliseName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

// ─── Book resolution ─────────────────────────────────────────────────────────

async function resolveBook(entity: GraphEntity): Promise<ResolvedGraphNode> {
  const base = {
    nodeId: entity.nodeId,
    type: "Book" as const,
    name: entity.name,
  };

  // 1. If ISBN already extracted from the Turtle, verify it directly
  if (entity.extractedIdentifier?.type === "isbn") {
    const isbn = entity.extractedIdentifier.value;
    const ck = cacheKey("isbn", isbn);
    const cached = getCached(ck);

    const result: VerificationResult = cached ?? await verifyISBN(isbn);
    if (result.valid && !cached) setCached(ck, result);

    return {
      ...base,
      resolvedIdentifier: { type: "isbn", value: isbn },
      alternateCandidates: [],
      verified: result.valid,
      data: result.data,
    };
  }

  // 2. No ISBN in Turtle — search Open Library + Google Books by title in parallel
  const titleQ = encodeURIComponent(entity.name);
  const [olResult, gbResult] = await Promise.allSettled([
    fetch(
      `https://openlibrary.org/search.json?title=${titleQ}&fields=isbn,title&limit=3`,
      { signal: AbortSignal.timeout(5000) }
    ).then((r) => (r.ok ? r.json() : null)),
    fetch(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${titleQ}&maxResults=3`,
      { signal: AbortSignal.timeout(5000) }
    ).then((r) => (r.ok ? r.json() : null)),
  ]);

  const candidates: AlternateCandidate[] = [];

  if (olResult.status === "fulfilled" && olResult.value) {
    type OlResponse = { docs?: Array<{ isbn?: string[]; title?: string }> };
    const docs = (olResult.value as OlResponse)?.docs ?? [];
    for (const doc of docs.slice(0, 3)) {
      const isbn = doc.isbn?.[0] ?? null;
      const title = doc.title ?? "(unknown)";
      if (isbn) {
        candidates.push({
          source: "Open Library",
          value: isbn,
          confidence: nameSimilarityScore(entity.name, title),
        });
      }
    }
  }

  if (gbResult.status === "fulfilled" && gbResult.value) {
    type GbResponse = {
      items?: Array<{
        volumeInfo?: {
          industryIdentifiers?: Array<{ type: string; identifier: string }>;
          title?: string;
        };
      }>;
    };
    const items = (gbResult.value as GbResponse)?.items ?? [];
    for (const item of items.slice(0, 3)) {
      const ids = item.volumeInfo?.industryIdentifiers ?? [];
      const title = item.volumeInfo?.title ?? "(unknown)";
      const isbn13 = ids.find((x) => x.type === "ISBN_13")?.identifier ?? null;
      const isbn10 = ids.find((x) => x.type === "ISBN_10")?.identifier ?? null;
      const isbn = isbn13 ?? isbn10;
      if (isbn) {
        candidates.push({
          source: "Google Books",
          value: isbn,
          confidence: nameSimilarityScore(entity.name, title),
        });
      }
    }
  }

  // De-duplicate by value, keeping the highest confidence
  const uniqueMap = new Map<string, AlternateCandidate>();
  for (const c of candidates) {
    if (!uniqueMap.has(c.value) || uniqueMap.get(c.value)!.confidence < c.confidence) {
      uniqueMap.set(c.value, c);
    }
  }
  const uniqueCandidates = Array.from(uniqueMap.values()).sort((a, b) => b.confidence - a.confidence);

  if (uniqueCandidates.length > 0 && uniqueCandidates[0].confidence >= 90) {
    const best = uniqueCandidates[0];
    const ck = cacheKey("isbn", best.value);
    const cached = getCached(ck);
    const result: VerificationResult = cached ?? await verifyISBN(best.value);
    if (result.valid && !cached) setCached(ck, result);

    if (result.valid) {
      return {
        ...base,
        resolvedIdentifier: { type: "isbn", value: best.value },
        alternateCandidates: uniqueCandidates.slice(1),
        verified: true,
        data: result.data,
      };
    }
  }

  return {
    ...base,
    resolvedIdentifier: null,
    alternateCandidates: uniqueCandidates,
    verified: false,
    data: null,
  };
}

// ─── Person resolution ────────────────────────────────────────────────────────

async function resolvePerson(entity: GraphEntity): Promise<ResolvedGraphNode> {
  const base = {
    nodeId: entity.nodeId,
    type: "Person" as const,
    name: entity.name,
  };

  // 1. ORCID already extracted from the Turtle
  if (entity.extractedIdentifier?.type === "orcid") {
    const orcidId = entity.extractedIdentifier.value;
    const ck = cacheKey("orcid", orcidId);
    const cached = getCached(ck);
    const result = cached ?? (await verifyORCID(orcidId) as unknown as VerificationResult);
    if (result.valid && !cached) setCached(ck, result);
    return {
      ...base,
      resolvedIdentifier: { type: "orcid", value: orcidId },
      alternateCandidates: [],
      verified: result.valid,
      data: result.data ?? null,
    };
  }

  // 2. Search ORCID public API by name
  const normed = normaliseName(entity.name);
  const ck = `person:${normed}`;
  const cachedNode = getCached(ck);
  if (cachedNode) {
    return {
      ...base,
      resolvedIdentifier: cachedNode.data
        ? { type: "orcid", value: String((cachedNode.data as Record<string, unknown>)?.orcidId ?? "") }
        : null,
      alternateCandidates: [],
      verified: cachedNode.valid,
      data: cachedNode.data,
    };
  }

  const orcidSearchUrl = `https://pub.orcid.org/v3.0/expanded-search?q=${encodeURIComponent(entity.name)}&rows=3`;
  console.log(`[resolveEntities] ORCID search: ${orcidSearchUrl}`);

  let orcidCandidates: AlternateCandidate[] = [];
  try {
    const orcidRes = await fetch(orcidSearchUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (orcidRes.ok) {
      const orcidJson = (await orcidRes.json()) as {
        "expanded-result"?: Array<{
          "orcid-id"?: string;
          "given-names"?: string;
          "family-names"?: string;
          "credit-name"?: string;
        }>;
      };
      
      const results = orcidJson?.["expanded-result"] ?? [];
      
      // flatMap lets us filter and map simultaneously, and TypeScript infers the exact returned type
      orcidCandidates = results.flatMap((r) => {
        const id = r["orcid-id"];
        if (!id) return []; // skip empty

        const givenNames = r["given-names"] ?? "";
        const familyNames = r["family-names"] ?? "";
        const fullName = `${givenNames} ${familyNames}`.trim() || (r["credit-name"] ?? "(unknown)");
        
        return [{
          source: "ORCID",
          value: id,
          confidence: nameSimilarityScore(entity.name, fullName),
        }];
      }).sort((a, b) => b.confidence - a.confidence);
    }
  } catch (err) {
    console.warn("[resolveEntities] ORCID search failed:", err);
  }

  if (orcidCandidates.length > 0) {
    if (orcidCandidates[0].confidence >= 90) {
      const best = orcidCandidates[0];
      const ck = cacheKey("orcid", best.value);
      const cached = getCached(ck);
      const result = cached ?? (await verifyORCID(best.value) as unknown as VerificationResult);
      if (result.valid && !cached) setCached(ck, result);

      if (result.valid) {
        return {
          ...base,
          resolvedIdentifier: { type: "orcid", value: best.value },
          alternateCandidates: orcidCandidates.slice(1),
          verified: true,
          data: result.data ?? null,
        };
      }
    }

    return {
      ...base,
      resolvedIdentifier: null,
      alternateCandidates: orcidCandidates,
      verified: false,
      data: null,
    };
  }

  // 3. VIAF fallback
  const viaf = await verifyViafPerson(entity.name);
  return {
    ...base,
    resolvedIdentifier: null,
    alternateCandidates: viaf.candidates.map((c) => ({
      source: "VIAF",
      value: c.viafId,
      confidence: c.confidence, // VIAF returns a confidence score directly
    })).sort((a, b) => b.confidence - a.confidence),
    verified: false,
    data: null,
  };
}

// ─── Organization resolution ──────────────────────────────────────────────────

async function resolveOrganization(entity: GraphEntity): Promise<ResolvedGraphNode> {
  const base = {
    nodeId: entity.nodeId,
    type: "Organization" as const,
    name: entity.name,
  };

  // 1. ROR already extracted from Turtle
  if (entity.extractedIdentifier?.type === "ror") {
    const rorId = entity.extractedIdentifier.value;
    const ck = cacheKey("ror", rorId);
    const cached = getCached(ck);
    const result: VerificationResult = cached ?? await verifyROR(rorId);
    if (result.valid && !cached) setCached(ck, result);
    return {
      ...base,
      resolvedIdentifier: { type: "ror", value: rorId },
      alternateCandidates: [],
      verified: result.valid,
      data: result.data,
    };
  }

  // 2. Search ROR by organization name
  const rorSearchUrl = `https://api.ror.org/organizations?query=${encodeURIComponent(entity.name)}`;
  console.log(`[resolveEntities] ROR search: ${rorSearchUrl}`);

  let rorCandidates: AlternateCandidate[] = [];
  try {
    const rorRes = await fetch(rorSearchUrl, {
      signal: AbortSignal.timeout(10000),
    });
    if (rorRes.ok) {
      type RorResponse = { 
        items?: Array<{ 
          id?: string; 
          names?: Array<{ types?: string[]; value?: string }>; 
          score?: number 
        }> 
      };
      const rorJson = (await rorRes.json()) as RorResponse;
      const items = rorJson?.items ?? [];
      
      rorCandidates = items.slice(0, 3).flatMap((item) => {
        const id = item.id;
        if (!id) return [];

        let rorName = "";
        if (item.names && Array.isArray(item.names)) {
          const display = item.names.find((n) => n.types?.includes("ror_display"));
          if (display?.value) rorName = display.value;
          else {
            const label = item.names.find((n) => n.types?.includes("label"));
            if (label?.value) rorName = label.value;
            else rorName = item.names[0]?.value ?? "";
          }
        }
        
        return [{
          source: "ROR",
          value: id,
          confidence: nameSimilarityScore(entity.name, rorName),
        }];
      }).sort((a, b) => b.confidence - a.confidence);
    }
  } catch (err) {
    console.warn("[resolveEntities] ROR search failed:", err);
  }

  if (rorCandidates.length > 0) {
    if (rorCandidates[0].confidence >= 90) {
      const best = rorCandidates[0];
      const rorId = best.value;
      const ck = cacheKey("ror", rorId);
      const cached = getCached(ck);
      const result: VerificationResult = cached ?? await verifyROR(rorId);
      if (result.valid && !cached) setCached(ck, result);

      if (result.valid) {
        return {
          ...base,
          resolvedIdentifier: { type: "ror", value: rorId },
          alternateCandidates: rorCandidates.slice(1),
          verified: true,
          data: result.data,
        };
      }
    }

    return {
      ...base,
      resolvedIdentifier: null,
      alternateCandidates: rorCandidates,
      verified: false,
      data: null,
    };
  }

  // 3. VIAF fallback
  const viaf = await verifyViafOrganization(entity.name);
  return {
    ...base,
    resolvedIdentifier: null,
    alternateCandidates: viaf.candidates.map((c) => ({
      source: "VIAF",
      value: c.viafId,
      confidence: c.confidence,
    })).sort((a, b) => b.confidence - a.confidence),
    verified: false,
    data: null,
  };
}

// ─── ScholarlyArticle resolution ─────────────────────────────────────────────

async function resolveScholarlyArticle(entity: GraphEntity, allEntities: GraphEntity[]): Promise<ResolvedGraphNode> {
  const base = {
    nodeId: entity.nodeId,
    type: "ScholarlyArticle" as const,
    name: entity.name,
  };

  // 1. DOI already extracted
  if (entity.extractedIdentifier?.type === "doi") {
    const doi = entity.extractedIdentifier.value;
    const ck = cacheKey("doi", doi);
    const cached = getCached(ck);
    const result: VerificationResult = cached ?? await verifyDOI(doi);
    if (result.valid && !cached) setCached(ck, result);

    return {
      ...base,
      resolvedIdentifier: { type: "doi", value: doi },
      alternateCandidates: [],
      verified: result.valid,
      data: result.data,
    };
  }

  // 2. Search Crossref API with title + author names
  const authorNames = entity.relations
    .filter((r) => r.relation === "schema:author")
    .map((r) => allEntities.find((e) => e.nodeId === r.targetNodeId)?.name ?? "")
    .filter(Boolean)
    .join(" ");

  const queryStr = `${entity.name} ${authorNames}`.trim();
  const crossrefUrl = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(queryStr)}&rows=3`;
  console.log(`[resolveEntities] Crossref search: ${crossrefUrl}`);

  let crossrefCandidates: AlternateCandidate[] = [];
  try {
    const res = await fetch(crossrefUrl, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      type CrossrefResponse = { message?: { items?: Array<{ DOI?: string; title?: string[] }> } };
      const json = (await res.json()) as CrossrefResponse;
      const items = json?.message?.items ?? [];

      crossrefCandidates = items.flatMap((item) => {
        const doi = item.DOI;
        if (!doi) return [];
        const title = item.title?.[0] ?? "(unknown)";
        
        return [{
          source: "Crossref",
          value: doi,
          confidence: nameSimilarityScore(entity.name, title),
        }];
      });
    }
  } catch (err) {
    console.warn("[resolveEntities] Crossref search failed:", err);
  }

  // De-duplicate
  const uniqueMap = new Map<string, AlternateCandidate>();
  for (const c of crossrefCandidates) {
    if (!uniqueMap.has(c.value) || uniqueMap.get(c.value)!.confidence < c.confidence) {
      uniqueMap.set(c.value, c);
    }
  }
  const uniqueCandidates = Array.from(uniqueMap.values()).sort((a, b) => b.confidence - a.confidence);

  if (uniqueCandidates.length > 0 && uniqueCandidates[0].confidence >= 90) {
    const best = uniqueCandidates[0];
    const ck = cacheKey("doi", best.value);
    const cached = getCached(ck);
    const result: VerificationResult = cached ?? await verifyDOI(best.value);
    if (result.valid && !cached) setCached(ck, result);

    if (result.valid) {
      return {
        ...base,
        resolvedIdentifier: { type: "doi", value: best.value },
        alternateCandidates: uniqueCandidates.slice(1),
        verified: true,
        data: result.data,
      };
    }
  }

  return {
    ...base,
    resolvedIdentifier: null,
    alternateCandidates: uniqueCandidates,
    verified: false,
    data: null,
  };
}

// ─── Public export ────────────────────────────────────────────────────────────

/**
 * Resolve all entities in parallel via Promise.allSettled.
 * Failed individual resolutions return an unresolved node — never drop an entity.
 */
export async function resolveEntities(
  entities: GraphEntity[]
): Promise<ResolvedGraphNode[]> {
  const results = await Promise.allSettled(
    entities.map((entity) => {
      switch (entity.type) {
        case "Book":             return resolveBook(entity);
        case "ScholarlyArticle": return resolveScholarlyArticle(entity, entities);
        case "Person":           return resolvePerson(entity);
        case "Organization":     return resolveOrganization(entity);
      }
    })
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    // Rejected — log and return gracefully unresolved
    console.error(
      `[resolveEntities] Entity "${entities[i].name}" (${entities[i].type}) failed:`,
      r.reason
    );
    return {
      nodeId: entities[i].nodeId,
      type: entities[i].type,
      name: entities[i].name,
      resolvedIdentifier: null,
      alternateCandidates: [],
      verified: false,
      data: null,
    };
  });
}
