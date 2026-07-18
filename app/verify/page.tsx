"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Loader2,
  FileText,
  Globe,
  Link2,
  Search,
} from "lucide-react";
import { useVerifyText } from "@/hooks/use-verify-text";
import { useAnalyzeUrl } from "@/hooks/use-analyze-url";
import { useCitationGraph } from "@/hooks/use-citation-graph";
import {
  VerificationResults,
  ErrorBanner,
} from "@/components/verification-results";
import {
  CitationGraphResults,
  CitationGraphLoadingState,
} from "@/components/citation-graph-results";
import type { VerifyTextResponse, VerifyUrlResponse } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────

function splitReferences(text: string): string[] {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

type ActiveTab = "text" | "url" | "graph";

// ─── Page ─────────────────────────────────────────────────────────────────

export default function VerifyPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [citation, setCitation] = useState("");
  const [bannerError, setBannerError] = useState<string | null>(null);

  // ── Existing pipeline hooks ─────────────────────────────────────────────

  const {
    mutate: verifyText,
    isPending: isVerifyingText,
    data: textData,
    reset: resetText,
  } = useVerifyText();

  const {
    mutate: analyzeUrl,
    isPending: isAnalyzingUrl,
    data: urlData,
    reset: resetUrl,
  } = useAnalyzeUrl();

  // ── New citation graph hook ─────────────────────────────────────────────

  const {
    mutate: runCitationGraph,
    isPending: isGraphPending,
    data: graphData,
    reset: resetGraph,
  } = useCitationGraph();

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleVerifyText = () => {
    const refs = splitReferences(text);
    if (refs.length === 0) return;
    setBannerError(null);
    resetUrl();
    resetGraph();
    verifyText(refs, {
      onError: (err) =>
        setBannerError(err instanceof Error ? err.message : "Verification failed"),
    });
  };

  const handleAnalyzeUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setBannerError(null);
    resetText();
    resetGraph();
    analyzeUrl(trimmed, {
      onError: (err) =>
        setBannerError(err instanceof Error ? err.message : "URL analysis failed"),
    });
  };

  const handleCitationGraph = () => {
    const trimmed = citation.trim();
    if (!trimmed) return;
    setBannerError(null);
    resetText();
    resetUrl();
    runCitationGraph(trimmed, {
      onError: (err) =>
        setBannerError(err instanceof Error ? err.message : "Citation analysis failed"),
    });
  };

  const referenceCount = splitReferences(text).length;
  const isPending = isVerifyingText || isAnalyzingUrl || isGraphPending;

  // Normalise results to the shared VerifyTextResponse shape
  const results: VerifyTextResponse | null = textData
    ? textData
    : urlData
    ? { results: urlData.results, summary: urlData.summary }
    : null;

  const urlPageMeta: Pick<
    VerifyUrlResponse,
    "pageUrl" | "pageStatus" | "extractedCount"
  > | null = urlData
    ? {
        pageUrl: urlData.pageUrl,
        pageStatus: urlData.pageStatus,
        extractedCount: urlData.extractedCount,
      }
    : null;

  return (
    <div className="flex-1 bg-gray-50 font-sans antialiased">
      {/* Purple Header Banner */}
      <section className="relative overflow-hidden bg-[#581c87] bg-gradient-to-r from-[#6b21a8] to-[#581c87] py-12 text-white">
        {/* Wave pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M -100 120 C 300 30, 600 210, 1200 80 C 1800 -30, 2000 170, 2400 120"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Verification Workspace
          </h1>
          <p className="mt-2 text-purple-200 max-w-2xl text-sm sm:text-base">
            Inspect references with a structured evidence workflow. Paste
            references, extract from a URL, or analyse a loose citation with AI.
          </p>
        </div>
      </section>

      {/* Main Workspace Content */}
      <div className="mx-auto max-w-5xl px-6 py-12 flex flex-col gap-8">

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 gap-6">
          <button
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-2 pb-4 font-bold text-sm transition-all border-b-2 px-1 ${
              activeTab === "text"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <FileText className="h-4 w-4" />
            Text / References
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`flex items-center gap-2 pb-4 font-bold text-sm transition-all border-b-2 px-1 ${
              activeTab === "url"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Globe className="h-4 w-4" />
            Website URL
          </button>
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-2 pb-4 font-bold text-sm transition-all border-b-2 px-1 ${
              activeTab === "graph"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Search className="h-4 w-4" />
            Find &amp; Verify
          </button>
        </div>

        {/* ── Tab: Text / References ─────────────────────────────────────── */}
        {activeTab === "text" && (
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 px-8 py-6">
              <CardTitle className="text-lg font-bold text-gray-900">
                Reference Input
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1">
                Paste each reference on its own line. Supported: ISBN-10/13,
                DOI (10.xxxx/…), ORCID, ROR, and http(s) URLs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Textarea
                id="references-textarea"
                placeholder={`Paste your references here (one per line)...\nExample:\n978-0-14-313734-6\n10.1126/science.abc1234\n0000-0002-1825-0097\nhttps://example.com/some-academic-source`}
                className="min-h-56 resize-y rounded-xl border-gray-200 focus-visible:ring-purple-400 bg-gray-50/50 p-4 text-sm text-gray-800 placeholder:text-gray-400"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t border-gray-50 bg-gray-50/30 px-8 py-6 md:flex-row md:items-center md:justify-between">
              <Button
                id="verify-references-btn"
                onClick={handleVerifyText}
                disabled={isPending || referenceCount === 0}
                className="w-full md:w-auto bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-lg px-6 py-5 shadow-sm transition-colors"
              >
                {isVerifyingText ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    Verify references
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                {referenceCount}{" "}
                {referenceCount === 1 ? "reference" : "references"} prepared
              </span>
            </CardFooter>
          </Card>
        )}

        {/* ── Tab: Website URL ───────────────────────────────────────────── */}
        {activeTab === "url" && (
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 px-8 py-6">
              <CardTitle className="text-lg font-bold text-gray-900">
                Website Analysis
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1">
                Enter a webpage link. The system will extract references, check
                source validity, detect broken links, and compute a credibility
                score.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                <label
                  htmlFor="webpage-url-input"
                  className="text-xs font-bold text-gray-700 block"
                >
                  Webpage URL
                </label>
                <Input
                  id="webpage-url-input"
                  type="url"
                  placeholder="https://example.com/article-or-publication"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="rounded-xl border-gray-200 focus-visible:ring-purple-400 p-4 text-sm text-gray-800"
                />
              </div>
            </CardContent>
            <CardFooter className="flex border-t border-gray-50 bg-gray-50/30 px-8 py-6">
              <Button
                id="analyze-url-btn"
                onClick={handleAnalyzeUrl}
                disabled={isPending || !url.trim()}
                className="w-full md:w-auto bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-lg px-6 py-5 shadow-sm transition-colors"
              >
                {isAnalyzingUrl ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    Analyze URL
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ── Tab: Find & Verify (citation graph) ───────────────────────── */}
        {activeTab === "graph" && (
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 px-8 py-6">
              <CardTitle className="text-lg font-bold text-gray-900">
                Find &amp; Verify a Citation
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1">
                Paste a single loose citation in any format. AI will parse it
                into entities (book, author, publisher) and resolve their
                real-world identifiers (ISBN, ORCID, ROR) via live lookups.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Textarea
                id="citation-graph-textarea"
                placeholder={`Paste a single citation, e.g.:\nBaker, P. (2025). ChatGPT For Dummies (2nd Edition). John Wiley & Sons, Inc.\n\nSmith, J., & Jones, A. (2023). Deep Learning Fundamentals. MIT Press. ISBN: 978-0-262-04641-4`}
                className="min-h-36 resize-y rounded-xl border-gray-200 focus-visible:ring-purple-400 bg-gray-50/50 p-4 text-sm text-gray-800 placeholder:text-gray-400"
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
              />
              <p className="mt-3 text-xs text-gray-400 flex items-start gap-1.5">
                <span className="text-amber-500 font-bold shrink-0">⏱</span>
                This step takes 5–20 seconds — AI parses the citation then
                we run live API lookups in parallel.
              </p>
            </CardContent>
            <CardFooter className="flex border-t border-gray-50 bg-gray-50/30 px-8 py-6">
              <Button
                id="citation-graph-btn"
                onClick={handleCitationGraph}
                disabled={isPending || !citation.trim()}
                className="w-full md:w-auto bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-lg px-6 py-5 shadow-sm transition-colors"
              >
                {isGraphPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analysing…
                  </>
                ) : (
                  <>
                    Find &amp; Verify
                    <Search className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Dismissible error banner */}
        {bannerError && (
          <ErrorBanner
            message={bannerError}
            onDismiss={() => setBannerError(null)}
          />
        )}

        {/* URL page metadata strip */}
        {urlPageMeta && (
          <div className="flex flex-wrap gap-3 items-center rounded-xl border border-gray-100 bg-white px-5 py-3 text-xs text-gray-600 shadow-sm">
            <Link2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span className="font-semibold text-gray-800 truncate max-w-xs">
              {urlPageMeta.pageUrl}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-bold border ${
                urlPageMeta.pageStatus < 400
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              HTTP {urlPageMeta.pageStatus}
            </span>
            <span className="text-gray-400">
              {urlPageMeta.extractedCount} references extracted
            </span>
          </div>
        )}

        {/* Verification Results (text / url tabs) */}
        {results && (
          <VerificationResults
            results={results.results}
            summary={results.summary}
            subtitle={
              urlPageMeta
                ? `Extracted from ${urlPageMeta.pageUrl}`
                : `${results.summary.total} references verified`
            }
          />
        )}

        {/* Citation Graph Results */}
        {isGraphPending && <CitationGraphLoadingState />}
        {graphData && !isGraphPending && (
          <CitationGraphResults data={graphData} />
        )}
      </div>
    </div>
  );
}