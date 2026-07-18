"use client";

/**
 * components/citation-graph-results.tsx
 *
 * Renders the output of POST /api/verify/graph:
 * - Loading skeleton with multi-phase status messages
 * - Per-entity node cards (type badge, name, resolved ID or N candidates)
 * - Expandable alternates panel per node
 * - Collapsible "View raw Turtle" section
 */

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  User,
  Building2,
  Code2,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { CitationGraphResponse } from "@/hooks/use-citation-graph";
import type { ResolvedGraphNode } from "@/lib/graph/resolve-entities";

// ─── Loading phase messages ────────────────────────────────────────────────

const LOADING_PHASES = [
  "Parsing citation structure…",
  "Extracting entities with AI…",
  "Resolving author identifiers…",
  "Resolving publisher identifiers…",
  "Verifying records…",
];

export function CitationGraphLoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-purple-400" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-800">
          Analysing citation…
        </p>
        <GraphLoadingPhases />
      </div>
    </div>
  );
}

function GraphLoadingPhases() {
  const [phase, setPhase] = useState(0);

  // Advance phase every ~1.8 s
  useState(() => {
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % LOADING_PHASES.length);
    }, 1800);
    return () => clearInterval(id);
  });

  return (
    <p className="text-xs text-gray-500 h-4 transition-all">
      {LOADING_PHASES[phase]}
    </p>
  );
}

// ─── Type icon + colour ────────────────────────────────────────────────────

const TYPE_META: Record<
  "Book" | "Person" | "Organization" | "ScholarlyArticle",
  { icon: React.ReactNode; badge: string; label: string }
> = {
  Book: {
    icon: <BookOpen className="h-4 w-4" />,
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    label: "Book",
  },
  ScholarlyArticle: {
    icon: <FileText className="h-4 w-4" />,
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    label: "Article",
  },
  Person: {
    icon: <User className="h-4 w-4" />,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Person",
  },
  Organization: {
    icon: <Building2 className="h-4 w-4" />,
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    label: "Organization",
  },
};

const ID_COLOUR: Record<string, string> = {
  isbn: "bg-blue-50 text-blue-700 border-blue-200",
  doi: "bg-indigo-50 text-indigo-700 border-indigo-200",
  orcid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ror: "bg-cyan-50 text-cyan-700 border-cyan-200",
  viaf: "bg-orange-50 text-orange-700 border-orange-200",
};

// ─── Single entity node card ───────────────────────────────────────────────

function NodeCard({ node }: { node: ResolvedGraphNode }) {
  const [showAlts, setShowAlts] = useState(false);
  const meta = TYPE_META[node.type];
  const hasAlts = node.alternateCandidates.length > 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm hover:border-gray-200 hover:shadow-md transition-all">
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        {/* Type icon */}
        <div className={`mt-0.5 rounded-lg p-2 ${meta.badge} border`}>
          {meta.icon}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm truncate max-w-xs">
              {node.name}
            </span>
            <Badge
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase shadow-none ${meta.badge}`}
            >
              {meta.label}
            </Badge>
            {node.verified ? (
              <Badge className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase shadow-none bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                Verified
              </Badge>
            ) : (
              <Badge className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase shadow-none bg-gray-50 text-gray-500 border-gray-200">
                <XCircle className="h-3 w-3 mr-1 inline" />
                Unverified
              </Badge>
            )}
          </div>

          {/* Resolved identifier */}
          {node.resolvedIdentifier ? (
            <div className="mt-1.5 flex items-center gap-2">
              <Badge
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase shadow-none ${
                  ID_COLOUR[node.resolvedIdentifier.type] ?? ID_COLOUR.isbn
                }`}
              >
                {node.resolvedIdentifier.type}
              </Badge>
              <span className="font-mono text-xs text-gray-600 truncate max-w-[280px]">
                {node.resolvedIdentifier.value}
              </span>
            </div>
          ) : hasAlts ? (
            <button
              onClick={() => setShowAlts((v) => !v)}
              className="mt-1.5 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold transition-colors"
            >
              {node.alternateCandidates.length} candidate
              {node.alternateCandidates.length !== 1 ? "s" : ""} found
              {showAlts ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          ) : (
            <p className="mt-1.5 text-xs text-gray-400 italic">
              No identifier found
            </p>
          )}
        </div>
      </div>

      {/* Alternates panel */}
      {showAlts && hasAlts && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            Candidates — select the correct one manually
          </p>
          {node.alternateCandidates.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2"
            >
              <Badge
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase shadow-none ${
                  ID_COLOUR[c.source.toLowerCase()] ??
                  "bg-gray-50 text-gray-500 border-gray-200"
                }`}
              >
                {c.source}
              </Badge>
              <span className="font-mono text-xs text-gray-700 flex-1 truncate">
                {c.value}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-400 transition-all"
                    style={{ width: `${c.confidence}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-500 w-7 text-right tabular-nums">
                  {c.confidence}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verified data preview */}
      {node.verified && node.data && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1">
          {Object.entries(node.data)
            .filter(
              ([k, v]) =>
                v !== null &&
                v !== "" &&
                !Array.isArray(v) &&
                typeof v !== "boolean" &&
                !["foundInOpenLibrary", "foundInGoogleBooks"].includes(k)
            )
            .slice(0, 4)
            .map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {k.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className="text-xs text-gray-700 truncate">
                  {String(v)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Raw Turtle collapsible ────────────────────────────────────────────────

function RawTurtlePanel({ turtle }: { turtle: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
      >
        <span className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-purple-500" />
          View raw Turtle (RDF)
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && (
        <pre className="p-4 bg-gray-900 text-emerald-300 text-xs overflow-x-auto leading-relaxed font-mono">
          {turtle}
        </pre>
      )}
    </div>
  );
}

// ─── Main exported component ───────────────────────────────────────────────

interface CitationGraphResultsProps {
  data: CitationGraphResponse;
}

export function CitationGraphResults({ data }: CitationGraphResultsProps) {
  const { nodes, rawTurtle, processingTimeMs } = data;

  const verified = nodes.filter((n) => n.verified).length;
  const withCandidates = nodes.filter(
    (n) => !n.verified && n.alternateCandidates.length > 0
  ).length;
  const unresolved = nodes.filter(
    (n) => !n.verified && n.alternateCandidates.length === 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Entities",
            value: nodes.length,
            tone: "text-gray-700 bg-gray-50 border-gray-100",
          },
          {
            label: "Verified",
            value: verified,
            tone: "text-emerald-700 bg-emerald-50 border-emerald-100",
          },
          {
            label: "Candidates",
            value: withCandidates,
            tone: "text-amber-700 bg-amber-50 border-amber-100",
          },
          {
            label: "Unresolved",
            value: unresolved,
            tone: "text-red-700 bg-red-50 border-red-100",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-4 text-center shadow-sm ${item.tone}`}
          >
            <div className="text-3xl font-black">{item.value}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Node cards */}
      <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-50 px-8 py-6">
          <CardTitle className="text-lg font-bold text-gray-900">
            Citation Entities
          </CardTitle>
          <CardDescription className="text-xs text-gray-500 mt-1">
            AI-extracted entities and their resolved identifiers. Candidates
            require manual selection.{" "}
            <span className="text-gray-400">
              Processed in {processingTimeMs} ms
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {nodes.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No entities could be extracted from the citation.
            </p>
          ) : (
            nodes.map((node) => <NodeCard key={node.nodeId} node={node} />)
          )}
        </CardContent>
      </Card>

      {/* Raw Turtle */}
      <RawTurtlePanel turtle={rawTurtle} />
    </div>
  );
}
