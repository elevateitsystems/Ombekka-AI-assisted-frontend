export type RefKind =
  | "book"
  | "doi"
  | "url"
  | "author"
  | "institution";

export type Status = "verified" | "partial" | "unverified" | "pending" | "not-configured";

export type IdentifierType = "ISBN" | "DOI" | "URL" | "VIAF" | "ISNI" | "ORCID" | "ROR";

export interface InputItem {
  /** Client-side stable id */
  id: string;
  raw: string;
  kind: RefKind;
  identifierType: IdentifierType;
  identifier: string;
  /** Optional linked children (author/institution IRIs) attached in the input line */
  authors?: string[];
  institutions?: string[];
  /** Optional display label supplied by the user */
  label?: string;
}

export interface GraphNode {
  id: string;
  kind: RefKind;
  identifierType: IdentifierType;
  identifier: string;
  label: string;
  status: Status;
  detail?: string;
  message?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: "refersTo" | "authoredBy" | "publishedBy";
  status: Status;
}

export interface VerifyResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: {
    total: number;
    verified: number;
    partial: number;
    unverified: number;
    notConfigured: number;
    trustScore: number; // 0-100
    allGreen: boolean;
  };
}

export interface Reference {
  id: string | number;
  title: string;
  url: string;
  type: string;
  description?: string;
  verifiedAt?: string;
}

// ─── New unified verification pipeline types ────────────────────────────────

export type DetectedType =
  | "isbn"
  | "doi"
  | "orcid"
  | "ror"
  | "url"
  | "unknown";

export interface VerificationResult {
  /** The original string that was passed in for verification */
  input: string;
  /** What the identifier detector classified this as */
  detectedType: DetectedType;
  /** Whether the identifier resolved to a real record */
  valid: boolean;
  /** Human-readable name of the data source(s) that were queried */
  source: string;
  /** Structured data extracted from the source, or null if not found */
  data: Record<string, unknown> | null;
  /**
   * Integrity score 0–100:
   *   100  found, all cross-checked fields match
   *   60–80 found, partial data or single-source (no cross-check possible)
   *   30–50 found, fields mismatch between sources
   *   0    not discoverable, or detectedType is "unknown"
   */
  integrityScore: number;
  /** Non-null; empty array when everything is fine */
  issues: string[];
  /** Only present when the lookup itself threw/timed-out (distinct from "not found") */
  error?: string;
}

export interface VerificationSummary {
  total: number;
  verified: number;
  failed: number;
  averageScore: number;
}

export interface VerifyTextResponse {
  results: VerificationResult[];
  summary: VerificationSummary;
}

export interface VerifyUrlResponse {
  pageUrl: string;
  pageStatus: number;
  extractedCount: number;
  results: VerificationResult[];
  summary: VerificationSummary;
}