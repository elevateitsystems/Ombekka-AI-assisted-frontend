/**
 * hooks/use-citation-graph.ts
 *
 * TanStack Query mutation for POST /api/verify/graph.
 * Returns the full CitationGraphResponse or throws on non-2xx.
 */

import { useMutation } from "@tanstack/react-query";
import type { ResolvedGraphNode } from "@/lib/graph/resolve-entities";

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface CitationGraphResponse {
  nodes: ResolvedGraphNode[];
  edges: GraphEdge[];
  rawTurtle: string;
  processingTimeMs: number;
}

export function useCitationGraph() {
  return useMutation({
    mutationFn: async (citation: string): Promise<CitationGraphResponse> => {
      const response = await fetch("/api/verify/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citation }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          (payload as { error?: string }).error ?? "Citation graph analysis failed"
        );
      }

      return response.json() as Promise<CitationGraphResponse>;
    },
  });
}
