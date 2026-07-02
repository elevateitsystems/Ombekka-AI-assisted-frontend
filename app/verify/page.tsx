'use client';

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  FileText,
  Globe,
} from "lucide-react";
import { useVerifyReferences } from "@/hooks/use-verify-references";
import { useScrapeUrl } from "@/hooks/use-scrapeUrl";

export default function VerifyPage() {
  const [activeTab, setActiveTab] = useState<"text" | "url">("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  const { mutate: verifyReferences, isPending: isVerifying, data, error: verifyError } = useVerifyReferences();
  const { mutate: scrapeUrl, isPending: isScraping, error: scrapeError } = useScrapeUrl();

  const referenceCount = useMemo(() => text.split(/\n+/).filter(Boolean).length, [text]);

  const handleVerifyText = () => {
    if (text.trim()) {
      verifyReferences({ text });
    }
  };

  const handleAnalyzeUrl = () => {
    if (url.trim()) {
      scrapeUrl(
        { url },
        {
          onSuccess: (scrapeData) => {
            if (scrapeData.text.trim()) {
              verifyReferences({ text: scrapeData.text });
            } else {
              // Trigger verification with empty content to display proper empty/unverified state
              verifyReferences({ text: "" });
            }
          },
        }
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-50 text-green-700 border-green-200";
      case "partial":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "unverified":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "partial":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "unverified":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />;
    }
  };

  const isPending = isScraping || isVerifying;
  const error = scrapeError || verifyError;

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
            Inspect references with a structured evidence workflow. Paste references or extract them from a website URL to verify their validity.
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
        </div>

        {/* Tab contents */}
        {activeTab === "text" ? (
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 px-8 py-6">
              <CardTitle className="text-lg font-bold text-gray-900">Reference Input</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1">
                Paste each reference on its own line. Supported values include ISBN-10, ISBN-13, DOI, and URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Textarea
                placeholder="Paste your references here (one per line)...
Example:
978-0-14-313734-6
10.1234/example-doi
https://example.com/some-academic-source"
                className="min-h-56 resize-y rounded-xl border-gray-200 focus-visible:ring-purple-400 bg-gray-50/50 p-4 text-sm text-gray-800 placeholder:text-gray-400"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t border-gray-50 bg-gray-50/30 px-8 py-6 md:flex-row md:items-center md:justify-between">
              <Button
                onClick={handleVerifyText}
                disabled={isPending || !text.trim()}
                className="w-full md:w-auto bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-lg px-6 py-5 shadow-sm transition-colors"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify references
                    <ArrowRight className="ml-2 h-4.5 w-4.5" />
                  </>
                )}
              </Button>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                {referenceCount} {referenceCount === 1 ? "reference" : "references"} prepared
              </span>
            </CardFooter>
          </Card>
        ) : (
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 px-8 py-6">
              <CardTitle className="text-lg font-bold text-gray-900">Website Analysis</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1">
                Enter a webpage link. The system will extract references, check source validity, detect broken links, and compute a credibility score.
              </CardDescription>
            </CardHeader> 
            <CardContent className="p-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-700 block">Webpage URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/article-or-publication"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="rounded-xl border-gray-200 focus-visible:ring-purple-400 p-4 text-sm text-gray-800"
                />
              </div>
            </CardContent>
            <CardFooter className="flex border-t border-gray-50 bg-gray-50/30 px-8 py-6 ">
              <Button
                onClick={handleAnalyzeUrl}
                disabled={isPending || !url.trim()}
                className="w-full md:w-auto bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-lg px-6 py-5 shadow-sm transition-colors"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                    {isScraping ? "Scraping page..." : "Verifying sources..."}
                  </>
                ) : (
                  <>
                    Analyze URL
                    <ArrowRight className="ml-2 h-4.5 w-4.5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-xl border-red-100 bg-red-50 text-red-900">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="font-bold">Error</AlertTitle>
            <AlertDescription className="text-xs text-red-700">{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Verification Summary and Nodes */}
        {data && (
          <div className="space-y-8">
            <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50 px-8 py-6">
                <CardTitle className="text-lg font-bold text-gray-900">Verification Summary</CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-1">
                  Overall evaluation metric of the referenced documents.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    { label: "Trust Score", value: `${data.summary.trustScore}%`, tone: "text-[#7c3aed] bg-purple-50 border-purple-100" },
                    { label: "Verified", value: data.summary.verified, tone: "text-green-700 bg-green-50 border-green-100" },
                    { label: "Partial", value: data.summary.partial, tone: "text-amber-700 bg-amber-50 border-amber-100" },
                    { label: "Unverified", value: data.summary.unverified, tone: "text-red-700 bg-red-50 border-red-100" },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-xl border p-5 text-center ${item.tone} shadow-sm`}>
                      <div className="text-3xl font-black">{item.value}</div>
                      <div className="mt-1 text-xs font-bold opacity-85 uppercase tracking-wide">{item.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50 px-8 py-6">
                <CardTitle className="text-lg font-bold text-gray-900">Reference Review</CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-1">
                  Individual item lookup results.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {data.nodes.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">
                    No references were found or extracted.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.nodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between transition-all hover:border-gray-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5">{getStatusIcon(node.status)}</div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm sm:text-base">{node.label}</p>
                            <p className="text-xs font-mono text-gray-400 mt-0.5">{node.identifier}</p>
                          </div>
                        </div>
                        <Badge className={`rounded-full px-3 py-1 font-bold text-xs uppercase border ${getStatusColor(node.status)} bg-opacity-10 shadow-none`}>
                          {node.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}