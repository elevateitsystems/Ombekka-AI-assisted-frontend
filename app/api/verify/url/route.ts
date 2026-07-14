import { NextRequest, NextResponse } from "next/server";
import { verifyIdentifier } from "@/lib/verifier-pipeline";
import { buildSummary } from "@/lib/summarize-results";
import type { VerificationResult } from "@/lib/types";
import * as cheerio from "cheerio";

const TIMEOUT_MS = 5000;

// ─── Reference extraction regexes ─────────────────────────────────────────
/**
 * DOI pattern: matches bare DOIs in page text (e.g. 10.1234/example)
 * Stops at whitespace or common prose punctuation.
 */
const DOI_TEXT_RE = /\b10\.\d{4,9}\/[^\s"'<>]+/gi;

/**
 * ISBN-13 pattern: the most common form found in bibliographies.
 * Also catches ISBN-10 via the generic \d{9}[\dX] form.
 */
const ISBN_TEXT_RE = /\b(?:97[89][- ]?(?:\d[- ]?){9}\d|\d{9}[\dX])\b/g;

/**
 * ORCID pattern in text: 0000-000X-XXXX-XXXX
 */
const ORCID_TEXT_RE = /\b\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b/g;

// ─── HTML helpers ──────────────────────────────────────────────────────────

function isWikiChrome(href: string, pageHost: string, sourceLang?: string, sourcePath?: string): boolean {
  try {
    const u = new URL(href);
    if (u.hostname.match(/^[a-z]{2,3}\.wikipedia\.org$/)) {
      const lang = u.hostname.split(".")[0];
      if (lang !== sourceLang && u.pathname === sourcePath) return true;
    }
    if (u.hostname === "wikidata.org" || u.hostname === "www.wikidata.org") {
      if (u.pathname.includes("Special:EntityPage") || u.pathname.match(/\/wiki\/Q\d+/)) return true;
    }
    if (u.hostname === "donate.wikimedia.org" || u.hostname === "upload.wikimedia.org") return true;
    if (u.hostname === "commons.wikimedia.org" && u.pathname.includes("Category:")) return true;
  } catch {}
  return false;
}

/**
 * Extract candidate references from page HTML using Cheerio
 * Scopes to references / main article and excludes nav chrome.
 */
function extractCandidates(html: string, pageUrl: string): string[] {
  const candidates = new Set<string>();
  let pageHost = "";
  try { pageHost = new URL(pageUrl).hostname; } catch {}

  const $ = cheerio.load(html);

  // 1. Identify primary content area
  let $scope = $("body");
  if ($("ol.references, .reflist").length > 0) {
    $scope = $("ol.references, .reflist");
  } else if ($("article").length > 0) {
    $scope = $("article");
  } else if ($("main").length > 0) {
    $scope = $("main");
  }

  // Remove nav chrome from the chosen content area
  $scope.find("nav, footer, aside").remove();
  $scope.find("[id*='sidebar'], [class*='sidebar'], [id*='navigation'], [class*='navigation'], [id*='menu'], [class*='menu'], [class*='lang'], [class*='interlanguage']").remove();

  const sourceLang = pageHost.match(/^([a-z]{2,3})\.wikipedia\.org/)?.[1];
  const sourcePath = (() => { try { return new URL(pageUrl).pathname; } catch { return ""; } })();

  // 1. href values from anchor tags
  $scope.find("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    try {
      const resolved = new URL(href, pageUrl);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return;
      if (resolved.pathname.match(/\.(png|jpe?g|gif|svg|css|js|woff2?|ico|pdf|zip)(\?|$)/i)) return;
      if (resolved.hostname === pageHost) return;
      
      if (isWikiChrome(resolved.href, pageHost, sourceLang, sourcePath)) return;
      
      candidates.add(resolved.href.replace(/#.*$/, "").replace(/\/$/, ""));
    } catch {
      if (/^10\.\d{4,9}\//.test(href)) candidates.add(href);
    }
  });

  // 2. Scan visible text for DOIs, ISBNs, ORCIDs
  const text = $scope.text();
  for (const m of text.matchAll(DOI_TEXT_RE)) {
    candidates.add(m[0].replace(/[.,;)]+$/, ""));
  }
  for (const m of text.matchAll(ISBN_TEXT_RE)) {
    candidates.add(m[0].replace(/[- ]/g, ""));
  }
  for (const m of text.matchAll(ORCID_TEXT_RE)) {
    candidates.add(m[0]);
  }

  // Cap at 40 candidates to avoid runaway verification costs
  return [...candidates].slice(0, 40);
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── Parse and validate body ────────────────────────────────────────────
  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  if (!rawUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Validate that it's a proper URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Must be an http or https URL");
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid URL — must be a valid http(s) address" },
      { status: 400 }
    );
  }

  const pageUrl = parsedUrl.href;

  // ── Fetch the target page ──────────────────────────────────────────────
  let html: string;
  let pageStatus: number;

  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent":
          "MnemicBot/1.0 (+https://mnemic.verify; document-forensics)",
        accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
      redirect: "follow",
    });

    pageStatus = res.status;

    if (!res.ok) {
      console.error(`[POST /api/verify/url] Page fetch returned ${res.status} for: ${pageUrl}`);
      return NextResponse.json(
        { error: `Could not reach the provided URL (HTTP ${res.status})` },
        { status: 502 }
      );
    }

    html = await res.text();
  } catch (err) {
    console.error(`[POST /api/verify/url] Page fetch failed for: ${pageUrl}`, err);
    return NextResponse.json(
      { error: "Could not reach the provided URL" },
      { status: 502 }
    );
  }

  // ── Extract and dedupe candidate references ────────────────────────────
  const candidates = extractCandidates(html, pageUrl);

  // ── Also verify the page URL itself ───────────────────────────────────
  // (We already know it's reachable, but this gives it an integrity score)
  const allTargets = [pageUrl, ...candidates.filter((c) => c !== pageUrl)];

  // ── Run all verifications in parallel ─────────────────────────────────
  const settled = await Promise.allSettled(
    allTargets.map((ref) => verifyIdentifier(ref))
  );

  const results: VerificationResult[] = settled.map((s, i) => {
    if (s.status === "fulfilled") return s.value;
    console.error(
      `[POST /api/verify/url] Promise rejected for candidate index ${i}:`,
      s.reason
    );
    return {
      input: allTargets[i],
      detectedType: "unknown" as const,
      valid: false,
      source: "None",
      data: null,
      integrityScore: 0,
      issues: [],
      error: "Unexpected pipeline failure",
    };
  });

  return NextResponse.json({
    pageUrl,
    pageStatus,
    extractedCount: candidates.length,
    results,
    summary: buildSummary(results),
  });
}
