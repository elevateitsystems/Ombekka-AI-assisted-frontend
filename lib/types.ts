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