import * as cheerio from "cheerio";

const DOI_TEXT_RE = /\b10\.\d{4,9}\/[^\s"'<>]+/gi;
const ISBN_TEXT_RE = /\b(?:97[89][- ]?(?:\d[- ]?){9}\d|\d{9}[\dX])\b/g;
const ORCID_TEXT_RE = /\b\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b/g;

async function run() {
  const pageUrl = "https://en.wikipedia.org/wiki/CRISPR";
  const res = await fetch(pageUrl);
  const html = await res.text();

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
  const sourcePath = new URL(pageUrl).pathname;

  function isWikiChrome(href: string) {
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

  $scope.find("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    try {
      const resolved = new URL(href, pageUrl);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return;
      if (resolved.pathname.match(/\.(png|jpe?g|gif|svg|css|js|woff2?|ico|pdf|zip)(\?|$)/i)) return;
      if (resolved.hostname === pageHost) return;
      
      if (isWikiChrome(resolved.href)) return;
      
      candidates.add(resolved.href.replace(/#.*$/, "").replace(/\/$/, ""));
    } catch {
      if (/^10\.\d{4,9}\//.test(href)) candidates.add(href);
    }
  });

  const text = $scope.text();
  for (const m of text.matchAll(DOI_TEXT_RE)) candidates.add(m[0].replace(/[.,;)]+$/, ""));
  for (const m of text.matchAll(ISBN_TEXT_RE)) candidates.add(m[0].replace(/[- ]/g, ""));
  for (const m of text.matchAll(ORCID_TEXT_RE)) candidates.add(m[0]);

  const result = [...candidates].slice(0, 40);
  console.log("Total extracted:", candidates.size);
  console.log("Returned:", result.length);
  console.log("Sample:", result.slice(0, 10));
}

run();
