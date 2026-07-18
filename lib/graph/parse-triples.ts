/**
 * lib/graph/parse-triples.ts
 *
 * Parse a Turtle RDF string (produced by extractTriples) into a typed
 * GraphEntity array. Wraps n3.Parser in a Promise because under Bun the
 * parser callback fires asynchronously (microtask queue), not synchronously.
 */

import { Parser as N3Parser } from "n3";
import type { Quad } from "n3";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ExtractedIdentifier {
  type: "isbn" | "doi" | "orcid" | "ror";
  value: string;
}

export interface GraphEntity {
  nodeId: string;
  type: "Book" | "Person" | "Organization" | "ScholarlyArticle";
  name: string;
  extractedIdentifier?: ExtractedIdentifier;
  relations: { targetNodeId: string; relation: string }[];
}

// ─── Internal intermediate node shape ────────────────────────────────────────

interface RawNode {
  nodeId: string;
  rdfType: string | null;
  properties: Map<string, string[]>; // predicate IRI → [object literal values]
  relations: { targetNodeId: string; relation: string }[];
}

// ─── Well-known IRIs ──────────────────────────────────────────────────────────

const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const SCHEMA = "https://schema.org/";

const SCHEMA_BOOK = `${SCHEMA}Book`;
const SCHEMA_SCHOLARLY_ARTICLE = `${SCHEMA}ScholarlyArticle`;
const SCHEMA_PERSON = `${SCHEMA}Person`;
const SCHEMA_ORGANIZATION = `${SCHEMA}Organization`;
const SCHEMA_NAME = `${SCHEMA}name`;
const SCHEMA_ISBN = `${SCHEMA}isbn`;
const SCHEMA_IDENTIFIER = `${SCHEMA}identifier`;
const SCHEMA_AUTHOR = `${SCHEMA}author`;
const SCHEMA_PUBLISHER = `${SCHEMA}publisher`;

// Relation predicates that point from one entity node to another entity node
const ENTITY_RELATION_PREDICATES = new Set([
  SCHEMA_AUTHOR,
  SCHEMA_PUBLISHER,
  `${SCHEMA}editor`,
  `${SCHEMA}contributor`,
]);

// ─── Identifier detection regexes ─────────────────────────────────────────────

const ISBN_RE = /^(?:97[89])?\d{9}[\dX]$/i;
const DOI_RE = /^10\.\d{4,}[\/.].+/i;
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i;
const ROR_RE = /^(?:https?:\/\/ror\.org\/)?0[a-zA-Z0-9]{6}\d{2}$/i;

function detectIdentifier(value: string): ExtractedIdentifier | undefined {
  const noHyphens = value.trim().replace(/-/g, "");
  const raw = value.trim();
  if (ISBN_RE.test(noHyphens)) return { type: "isbn", value: noHyphens };
  if (DOI_RE.test(raw)) return { type: "doi", value: raw };
  if (ORCID_RE.test(raw)) return { type: "orcid", value: raw };
  if (ROR_RE.test(raw)) return { type: "ror", value: raw };
  return undefined;
}

// ─── Map rdf:type IRI to our discriminated union ──────────────────────────────

function mapType(iri: string | null): "Book" | "Person" | "Organization" | "ScholarlyArticle" | null {
  if (iri === SCHEMA_BOOK) return "Book";
  if (iri === SCHEMA_SCHOLARLY_ARTICLE) return "ScholarlyArticle";
  if (iri === SCHEMA_PERSON) return "Person";
  if (iri === SCHEMA_ORGANIZATION) return "Organization";
  return null;
}

// ─── Collect all quads from Turtle (Promise-based, Bun-safe) ─────────────────

function collectQuads(turtle: string): Promise<Quad[]> {
  return new Promise((resolve, reject) => {
    const parser = new N3Parser({ format: "Turtle" });
    const quads: Quad[] = [];

    parser.parse(turtle, (err: Error | null, quad: Quad | null) => {
      if (err) {
        reject(new Error(`n3 parse error: ${err.message}`));
        return;
      }
      if (quad !== null) {
        quads.push(quad);
      } else {
        // null quad signals end-of-input
        resolve(quads);
      }
    });
  });
}

// ─── Build RawNode map from quad list ────────────────────────────────────────

function buildNodeMap(quads: Quad[]): Map<string, RawNode> {
  const nodes = new Map<string, RawNode>();

  const getOrCreate = (id: string): RawNode => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        nodeId: id,
        rdfType: null,
        properties: new Map(),
        relations: [],
      });
    }
    return nodes.get(id)!;
  };

  for (const quad of quads) {
    const subjectId = quad.subject.value;
    const predicate = quad.predicate.value;
    const object = quad.object;
    const node = getOrCreate(subjectId);

    if (predicate === RDF_TYPE) {
      node.rdfType = object.value;
      continue;
    }

    if (
      ENTITY_RELATION_PREDICATES.has(predicate) &&
      (object.termType === "BlankNode" || object.termType === "NamedNode")
    ) {
      // This is a link from one entity to another (e.g. schema:author → _:author1)
      const relationName = predicate.replace(SCHEMA, "schema:");
      node.relations.push({ targetNodeId: object.value, relation: relationName });
      // Ensure target node exists in map
      getOrCreate(object.value);
      continue;
    }

    if (object.termType === "Literal") {
      const vals = node.properties.get(predicate) ?? [];
      vals.push(object.value);
      node.properties.set(predicate, vals);
    }
  }

  return nodes;
}

// ─── Public export ────────────────────────────────────────────────────────────

/**
 * Parse a validated Turtle string into a typed GraphEntity[].
 * Returns a Promise because n3 fires callbacks asynchronously under Bun.
 * Nodes whose rdf:type is not Book/Person/Organization are skipped.
 */
export async function parseTriplesToEntities(turtle: string): Promise<GraphEntity[]> {
  const quads = await collectQuads(turtle);
  console.log(`[parseTriplesToEntities] Collected ${quads.length} quads`);

  const rawNodes = buildNodeMap(quads);
  const entities: GraphEntity[] = [];

  for (const raw of rawNodes.values()) {
    const type = mapType(raw.rdfType);
    if (!type) continue; // skip untyped / helper nodes

    const name =
      raw.properties.get(SCHEMA_NAME)?.[0] ??
      raw.properties.get(`${SCHEMA}givenName`)?.[0] ??
      "(unknown)";

    // Check known identifier properties for any extracted ID
    let extractedIdentifier: ExtractedIdentifier | undefined;
    const idCandidates = [
      ...(raw.properties.get(SCHEMA_ISBN) ?? []),
      ...(raw.properties.get(SCHEMA_IDENTIFIER) ?? []),
    ];
    for (const candidate of idCandidates) {
      const id = detectIdentifier(candidate);
      if (id) {
        extractedIdentifier = id;
        break;
      }
    }
    // Also check if the node IRI itself encodes an identifier
    if (!extractedIdentifier) {
      const id = detectIdentifier(raw.nodeId);
      if (id) extractedIdentifier = id;
    }

    entities.push({
      nodeId: raw.nodeId,
      type,
      name,
      ...(extractedIdentifier ? { extractedIdentifier } : {}),
      relations: raw.relations,
    });
  }

  return entities;
}
