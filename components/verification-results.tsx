"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { VerificationResult, VerificationSummary } from "@/lib/types";

// ─── Type badge colour map ─────────────────────────────────────────────────
const TYPE_COLOURS: Record<string, string> = {
  isbn: "bg-blue-50 text-blue-700 border-blue-200",
  doi: "bg-indigo-50 text-indigo-700 border-indigo-200",
  orcid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ror: "bg-cyan-50 text-cyan-700 border-cyan-200",
  url: "bg-slate-50 text-slate-700 border-slate-200",
  unknown: "bg-gray-50 text-gray-500 border-gray-200",
};

// ─── Integrity score bar ────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const colour =
    score >= 80
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-amber-400"
      : score > 0
      ? "bg-red-400"
      : "bg-gray-300";

  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colour}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums text-gray-700 w-8 text-right">
        {score}
      </span>
    </div>
  );
}

// ─── Dismissible error banner ──────────────────────────────────────────────
interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 hover:bg-red-100 transition-colors"
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Single result row ─────────────────────────────────────────────────────
function ResultRow({ result }: { result: VerificationResult }) {
  const [expanded, setExpanded] = useState(false);
  const hasIssues = result.issues.length > 0;
  const hasError = Boolean(result.error);

  const inputString = result.input || "Unknown Input";
  const inputDisplay =
    inputString.length > 60
      ? inputString.slice(0, 58) + "…"
      : inputString;

  const isUrl =
    result.detectedType === "url" &&
    result.input.startsWith("http");

  return (
    <div className="rounded-xl border border-gray-100 bg-white transition-all hover:border-gray-200 hover:shadow-sm">
      {/* Main row */}
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
        {/* Status icon */}
        <div className="shrink-0">
          {result.valid ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : hasError ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
        </div>

        {/* Input + detected type */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="font-mono text-xs text-gray-700 truncate max-w-[300px]"
              title={result.input}
            >
              {inputDisplay}
            </span>
            {isUrl && (
              <a
                href={result.input}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-500 hover:text-purple-700 transition-colors"
                aria-label="Open URL"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase shadow-none ${
                TYPE_COLOURS[result.detectedType] ?? TYPE_COLOURS.unknown
              }`}
            >
              {result.detectedType}
            </Badge>
            <span className="text-[11px] text-gray-400">{result.source}</span>
          </div>
        </div>

        {/* Valid/invalid badge */}
        <Badge
          className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase shadow-none ${
            result.valid
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {result.valid ? "Valid" : "Invalid"}
        </Badge>

        {/* Integrity score */}
        <div className="shrink-0">
          <ScoreBar score={result.integrityScore} />
        </div>

        {/* Expand toggle (only when there are issues or error detail) */}
        {(hasIssues || hasError) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label={expanded ? "Collapse issues" : "Expand issues"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Expanded issues / error panel */}
      {expanded && (hasIssues || hasError) && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
          {hasError && (
            <p className="mb-2 text-xs font-semibold text-red-600">
              ⚠ {result.error}
            </p>
          )}
          {hasIssues && (
            <ul className="space-y-1">
              {result.issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="mt-0.5 text-amber-500">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          )}
          {/* Show extracted data fields inline if available */}
          {result.valid && result.data && (
            <div className="mt-3 space-y-1">
              {Object.entries(result.data)
                .filter(
                  ([k, v]) =>
                    v !== null &&
                    v !== "" &&
                    !Array.isArray(v) &&
                    typeof v !== "boolean" &&
                    !["foundInOpenLibrary", "foundInGoogleBooks", "redirected", "crossDomainRedirect"].includes(k)
                )
                .slice(0, 6)
                .map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="font-semibold text-gray-500 capitalize min-w-[90px]">
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-gray-700 truncate max-w-[300px]">
                      {String(v)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Summary stats strip ───────────────────────────────────────────────────
function SummaryStrip({ summary }: { summary: VerificationSummary }) {
  const items = [
    {
      label: "Avg. Score",
      value: `${summary.averageScore}`,
      unit: "/100",
      tone: "text-[#7c3aed] bg-purple-50 border-purple-100",
    },
    {
      label: "Valid",
      value: String(summary.verified),
      tone: "text-emerald-700 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Invalid",
      value: String(summary.failed),
      tone: "text-red-700 bg-red-50 border-red-100",
    },
    {
      label: "Total",
      value: String(summary.total),
      tone: "text-gray-700 bg-gray-50 border-gray-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border p-4 text-center shadow-sm ${item.tone}`}
        >
          <div className="text-3xl font-black">
            {item.value}
            {item.unit && (
              <span className="text-base font-semibold opacity-60">
                {item.unit}
              </span>
            )}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Public component ──────────────────────────────────────────────────────

interface VerificationResultsProps {
  results: VerificationResult[];
  summary: VerificationSummary;
  /** Shown as an additional context line in the card header */
  subtitle?: string;
}

export function VerificationResults({
  results,
  summary,
  subtitle,
}: VerificationResultsProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-50 px-8 py-6">
          <CardTitle className="text-lg font-bold text-gray-900">
            Verification Summary
          </CardTitle>
          {subtitle && (
            <CardDescription className="text-xs text-gray-500 mt-1">
              {subtitle}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-8">
          <SummaryStrip summary={summary} />
        </CardContent>
      </Card>

      {/* Results table */}
      <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-50 px-8 py-6">
          <CardTitle className="text-lg font-bold text-gray-900">
            Reference Review
          </CardTitle>
          <CardDescription className="text-xs text-gray-500 mt-1">
            Click the chevron on any row to expand issues and extracted metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {results.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No references were found or extracted.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Table header */}
              <div className="hidden md:flex items-center gap-4 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span className="w-5 shrink-0" />
                <span className="flex-1">Input / Type</span>
                <span className="w-16 text-center">Status</span>
                <span className="w-24 text-right">Score</span>
                <span className="w-5 shrink-0" />
              </div>
              {results.map((result, i) => (
                <ResultRow key={`${result.input}-${i}`} result={result} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
