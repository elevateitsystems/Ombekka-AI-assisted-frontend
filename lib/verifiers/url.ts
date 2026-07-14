import type { VerificationResult } from "@/lib/types";

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export async function verifyURL(url: string): Promise<VerificationResult> {
  const issues: string[] = [];
  let finalUrl = url;
  let status = 0;

  const fetchHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  // ── HEAD request first ───────────────────────────────────────────────────
  try {
    console.log(`[API CALL] verifyURL (HEAD): ${url}`);
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: fetchHeaders,
      signal: AbortSignal.timeout(5000),
    });
    console.log(`[API RESPONSE] verifyURL (HEAD): HTTP ${headRes.status}`);

    status = headRes.status;
    finalUrl = headRes.url; // fetch follows redirects and exposes the final URL

    // Some servers reject HEAD with 405 → fall through to GET
    if (headRes.status !== 405 && headRes.status !== 404) {
      return buildUrlResult(url, status, finalUrl, issues);
    }
  } catch {
    // HEAD timed out or failed entirely — try GET
  }

  // ── GET fallback ─────────────────────────────────────────────────────────
  try {
    console.log(`[API CALL] verifyURL (GET): ${url}`);
    const getRes = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: fetchHeaders,
      signal: AbortSignal.timeout(5000),
    });
    console.log(`[API RESPONSE] verifyURL (GET): HTTP ${getRes.status}`);

    status = getRes.status;
    finalUrl = getRes.url;

    return buildUrlResult(url, status, finalUrl, issues);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[verifyURL] Both HEAD and GET failed for: ${url}`, err);
    return {
      input: url,
      detectedType: "url",
      valid: false,
      source: "HTTP",
      data: null,
      integrityScore: 0,
      issues: [],
      error: `URL unreachable: ${message}`,
    };
  }
}

function buildUrlResult(
  originalUrl: string,
  status: number,
  finalUrl: string,
  issues: string[]
): VerificationResult {
  const redirected = finalUrl !== originalUrl && finalUrl !== "";
  const originalHost = extractHostname(originalUrl);
  const finalHost = extractHostname(finalUrl || originalUrl);
  const crossDomain = redirected && originalHost !== finalHost;

  if (crossDomain) {
    issues.push(
      `Redirect to a different domain: ${originalHost} → ${finalHost}`
    );
  } else if (redirected) {
    issues.push(`Redirected to: ${finalUrl}`);
  }

  const isError = status >= 400 || status === 0;

  if (status === 403) {
    issues.push("Publisher returned 403 (access denied to automated requests) — link likely valid but could not be confirmed programmatically. Manually verify.");
  } else if (status === 404 || status === 410) {
    issues.push(`Server returned HTTP ${status} — link appears broken`);
  } else if (isError) {
    issues.push(`Server returned HTTP ${status}`);
  }

  let integrityScore: number;
  // 403 is a special case: publisher blocked us, but the link isn't necessarily dead.
  // We treat it as inconclusive (score 40) and valid (so it's not grouped with broken links)
  if (status === 403) {
    integrityScore = 40;
  } else if (isError) {
    integrityScore = 0;
  } else if (crossDomain) {
    integrityScore = 50; // different-domain redirect is suspicious
  } else if (redirected) {
    integrityScore = 70; // same-domain redirect
  } else {
    integrityScore = 100; // clean 2xx, no redirect
  }

  return {
    input: originalUrl,
    detectedType: "url",
    valid: status === 403 ? true : !isError,
    source: "HTTP",
    data: {
      status,
      finalUrl: finalUrl || originalUrl,
      redirected,
      crossDomainRedirect: crossDomain,
      originalHost,
      finalHost,
    },
    integrityScore,
    issues,
  };
}
