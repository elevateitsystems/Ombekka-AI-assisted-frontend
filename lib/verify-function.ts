import { NextRequest, NextResponse } from 'next/server';
import { parseReferences } from '@/lib/parse-references';
import type { GraphEdge, GraphNode, Status, VerifyResult } from '@/lib/verify-types';

// Copy all the helper functions here (fetchWithTimeout, checkUrl, checkDoi, etc.)
// Or import them from a shared utils file

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "SourceForensicsBot/1.0 (+citation-verifier)",
        accept: "application/json, text/html;q=0.9, */*;q=0.5",
        ...(init.headers ?? {}),
      },
      redirect: "follow",
    });
  } finally {
    clearTimeout(t);
  }
}

async function checkUrl(url: string): Promise<{ status: Status; message?: string; detail?: Record<string, unknown> }> {
  try {
    const res = await fetchWithTimeout(url, { method: "GET" });
    if (res.ok || (res.status >= 300 && res.status < 400)) {
      return { status: "partial", message: `HTTP ${res.status}`, detail: { httpStatus: res.status, finalUrl: res.url } };
    }
    return { status: "unverified", message: `HTTP ${res.status}`, detail: { httpStatus: res.status } };
  } catch (e) {
    return { status: "unverified", message: e instanceof Error ? e.message : "Fetch failed" };
  }
}

async function checkDoi(doi: string) {
  try {
    const res = await fetchWithTimeout(`https://doi.org/api/handles/${encodeURIComponent(doi)}`);
    if (!res.ok) return { status: "unverified" as Status, message: `Handle API ${res.status}` };
    const json = (await res.json()) as { responseCode?: number; values?: unknown[] };
    if (json.responseCode === 1) {
      return { status: "partial" as Status, message: "Resolved via DOI handle system", detail: json as Record<string, unknown> };
    }
    return { status: "unverified" as Status, message: `DOI not registered (code ${json.responseCode})` };
  } catch (e) {
    return { status: "unverified" as Status, message: e instanceof Error ? e.message : "DOI lookup failed" };
  }
}

async function checkIsbn(isbn: string) {
  const key = process.env.ISBNDB_API_KEY;
  if (!key) {
    try {
      const res = await fetchWithTimeout(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      if (!res.ok) return { status: "unverified" as Status, message: `Open Library ${res.status}` };
      const json = (await res.json()) as Record<string, unknown>;
      const key1 = `ISBN:${isbn}`;
      const record = json[key1] as Record<string, unknown> | undefined;
      if (record) {
        return {
          status: "partial" as Status,
          message: "Found in Open Library (ISBNdb key not configured)",
          detail: record,
        };
      }
      return { status: "unverified" as Status, message: "Not found in Open Library" };
    } catch (e) {
      return { status: "unverified" as Status, message: e instanceof Error ? e.message : "ISBN lookup failed" };
    }
  }
  try {
    const res = await fetchWithTimeout(`https://api2.isbndb.com/book/${encodeURIComponent(isbn)}`, {
      headers: { Authorization: key },
    });
    if (res.status === 404) return { status: "unverified" as Status, message: "Not found in ISBNdb" };
    if (!res.ok) return { status: "unverified" as Status, message: `ISBNdb ${res.status}` };
    const json = (await res.json()) as Record<string, unknown>;
    return { status: "partial" as Status, message: "Found in ISBNdb", detail: json };
  } catch (e) {
    return { status: "unverified" as Status, message: e instanceof Error ? e.message : "ISBNdb request failed" };
  }
}

async function checkViaf(id: string) {
  try {
    const res = await fetchWithTimeout(`https://viaf.org/viaf/${id}/viaf.json`);
    if (!res.ok) return { status: "unverified" as Status, message: `VIAF ${res.status}` };
    const json = (await res.json()) as Record<string, unknown>;
    return { status: "partial" as Status, message: "VIAF record found", detail: json };
  } catch (e) {
    return { status: "unverified" as Status, message: e instanceof Error ? e.message : "VIAF lookup failed" };
  }
}

async function checkOrcid(id: string) {
  try {
    const res = await fetchWithTimeout(`https://pub.orcid.org/v3.0/${id}/person`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return { status: "unverified" as Status, message: `ORCID ${res.status}` };
    const json = (await res.json()) as Record<string, unknown>;
    return { status: "partial" as Status, message: "ORCID record found", detail: json };
  } catch (e) {
    return { status: "unverified" as Status, message: e instanceof Error ? e.message : "ORCID lookup failed" };
  }
}

async function checkIsni(id: string) {
  return checkUrl(`https://isni.org/isni/${id}`);
}

async function checkRor(id: string) {
  try {
    const res = await fetchWithTimeout(`https://api.ror.org/organizations/${id}`);
    if (!res.ok) return { status: "unverified" as Status, message: `ROR ${res.status}` };
    const json = (await res.json()) as Record<string, unknown>;
    return { status: "partial" as Status, message: "ROR record found", detail: json };
  } catch (e) {
    return { status: "unverified" as Status, message: e instanceof Error ? e.message : "ROR lookup failed" };
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

interface PendingNode {
  id: string;
  node: GraphNode;
  check: () => Promise<{ status: Status; message?: string; detail?: Record<string, unknown> }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    if (text.length > 20000) {
      return NextResponse.json({ error: "Input too long (20k char max)" }, { status: 400 });
    }

    const items = parseReferences(text).slice(0, 50);

    const nodeMap = new Map<string, PendingNode>();
    const edges: GraphEdge[] = [];

    function ensureNode(
      kind: GraphNode["kind"],
      identifierType: GraphNode["identifierType"],
      identifier: string,
      label?: string,
    ): string {
      const key = `${identifierType}:${identifier}`;
      const existing = nodeMap.get(key);
      if (existing) return existing.id;
      const node: GraphNode = {
        id: key,
        kind,
        identifierType,
        identifier,
        label: label ?? `${identifierType} ${identifier}`,
        status: "pending",
      };
      const check = () => {
        switch (identifierType) {
          case "URL":
            return checkUrl(identifier);
          case "DOI":
            return checkDoi(identifier);
          case "ISBN":
            return checkIsbn(identifier);
          case "VIAF":
            return checkViaf(identifier);
          case "ORCID":
            return checkOrcid(identifier);
          case "ISNI":
            return checkIsni(identifier);
          case "ROR":
            return checkRor(identifier);
        }
      };
      nodeMap.set(key, { id: key, node, check });
      return key;
    }

    for (const item of items) {
      const primaryId = ensureNode(item.kind, item.identifierType, item.identifier, item.label);
      for (const a of item.authors ?? []) {
        const [t, ...rest] = a.split(":");
        const iType = t as GraphNode["identifierType"];
        const iVal = rest.join(":");
        const authorId = ensureNode("author", iType, iVal);
        edges.push({
          id: `${primaryId}->${authorId}`,
          source: primaryId,
          target: authorId,
          relation: "authoredBy",
          status: "pending",
        });
      }
      for (const inst of item.institutions ?? []) {
        const [t, ...rest] = inst.split(":");
        const iType = t as GraphNode["identifierType"];
        const iVal = rest.join(":");
        const instId = ensureNode("institution", iType, iVal);
        edges.push({
          id: `${primaryId}->${instId}`,
          source: primaryId,
          target: instId,
          relation: "publishedBy",
          status: "pending",
        });
      }
    }

    const pending = Array.from(nodeMap.values());
    await mapLimit(pending, 8, async (p) => {
      const r = await p.check();
      p.node.status = r.status;
      p.node.message = r.message;
      p.node.detail = r.detail ? JSON.stringify(r.detail).slice(0, 4000) : undefined;
    });

    const nodes = pending.map((p) => p.node);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const refIds = new Set(nodes.filter((n) => n.kind === "book" || n.kind === "doi" || n.kind === "url").map((n) => n.id));

    for (const refId of refIds) {
      const ref = byId.get(refId)!;
      if (ref.status !== "partial") continue;
      const outgoing = edges.filter((e) => e.source === refId);
      const authorDeps = outgoing.filter((e) => e.relation === "authoredBy");
      const instDeps = outgoing.filter((e) => e.relation === "publishedBy");
      if (authorDeps.length === 0 || instDeps.length === 0) continue;
      const authorsOk = authorDeps.every((e) => {
        const t = byId.get(e.target);
        return t && (t.status === "partial" || t.status === "verified");
      });
      const instsOk = instDeps.every((e) => {
        const t = byId.get(e.target);
        return t && (t.status === "partial" || t.status === "verified");
      });
      if (authorsOk && instsOk) ref.status = "verified";
    }

    for (const e of edges) {
      const s = byId.get(e.source)?.status ?? "pending";
      const t = byId.get(e.target)?.status ?? "pending";
      const rank: Record<Status, number> = {
        verified: 3,
        partial: 2,
        pending: 1,
        "not-configured": 1,
        unverified: 0,
      };
      e.status = rank[s] <= rank[t] ? s : t;
    }

    const total = nodes.length;
    const verified = nodes.filter((n) => n.status === "verified").length;
    const partial = nodes.filter((n) => n.status === "partial").length;
    const unverified = nodes.filter((n) => n.status === "unverified").length;
    const notConfigured = nodes.filter((n) => n.status === "not-configured").length;
    const trustScore =
      total === 0
        ? 0
        : Math.round(((verified * 1 + partial * 0.5) / total) * 100);
    const allGreen = total > 0 && verified === total;

    return NextResponse.json({
      nodes,
      edges,
      summary: { total, verified, partial, unverified, notConfigured, trustScore, allGreen },
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}