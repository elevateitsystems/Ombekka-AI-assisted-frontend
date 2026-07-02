import { NextRequest, NextResponse } from 'next/server';

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 12000): Promise<Response> {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (typeof url !== "string") {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "URL must start with http(s)://" }, { status: 400 });
    }

    const res = await fetchWithTimeout(url, {}, 12000);
    if (!res.ok) {
      throw new Error(`Failed to fetch page: HTTP ${res.status}`);
    }
    const html = await res.text();

    const urls = new Set<string>();
    const dois = new Set<string>();
    const isbns = new Set<string>();

    for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
      const href = m[1];
      if (/^https?:\/\//i.test(href)) urls.add(href.split("#")[0]);
    }
    for (const m of html.matchAll(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi)) {
      dois.add(m[0].replace(/[.,;)]+$/, ""));
    }
    for (const m of html.matchAll(/\b97[89][- ]?(?:\d[- ]?){9}\d\b/g)) {
      isbns.add(m[0].replace(/[- ]/g, ""));
    }

    const lines: string[] = [];
    for (const i of isbns) lines.push(i);
    for (const d of dois) lines.push(d);
    let urlCount = 0;
    for (const u of urls) {
      if (urlCount++ >= 30) break;
      if (/\.(png|jpe?g|gif|svg|css|js|woff2?|ico)(\?|$)/i.test(u)) continue;
      lines.push(u);
    }

    return NextResponse.json({
      text: lines.join("\n"),
      sourceUrl: url,
      extractedCount: lines.length,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraping failed' },
      { status: 500 }
    );
  }
}