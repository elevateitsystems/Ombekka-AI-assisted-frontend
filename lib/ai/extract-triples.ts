/**
 * lib/ai/extract-triples.ts
 *
 * Call Claude to parse a raw citation string into valid Turtle (RDF) syntax,
 * using schema.org vocabulary. The output is validated with n3.Parser; on a
 * parse failure we retry once with an explicit correction instruction.
 *
 * IMPORTANT: Claude is instructed NEVER to invent identifiers. Only values
 * literally present in the input text are extracted; everything else stays as
 * blank nodes so the downstream resolver can do real API lookups.
 */

import Anthropic from "@anthropic-ai/sdk";
import { Parser as N3Parser } from "n3";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const CLAUDE_TIMEOUT_MS = 15_000;

// ─── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a citation-parsing assistant that converts academic/book citations into valid Turtle (RDF) syntax.

STRICT OUTPUT RULES:
1. Output ONLY valid Turtle syntax — no markdown fences (\`\`\`), no explanations, no prose, no comments.
2. Use schema.org vocabulary throughout:
   - Classes: schema:Book, schema:ScholarlyArticle, schema:Person, schema:Organization
   - Properties: schema:name, schema:author, schema:publisher, schema:datePublished, schema:isbn, schema:bookEdition, schema:identifier
3. Declare the schema prefix: @prefix schema: <https://schema.org/> .
4. Use blank nodes (_:book1, _:article1, _:author1, _:pub1, etc.) for all entities WITHOUT a known ID.
5. If an ISBN, DOI, ORCID, or ROR identifier is LITERALLY PRESENT in the citation text, include it verbatim as the blank-node's schema:isbn / schema:identifier value.
6. CRITICAL — NEVER invent, guess, hallucinate, or fabricate any identifier (ISBN, DOI, ORCID, ROR). If no identifier is present in the input text, do NOT include one. Missing identifiers stay as blank nodes only.
7. Always link authors and publishers to the work with schema:author and schema:publisher.
8. CRITICAL: Distinguish between schema:Book and schema:ScholarlyArticle based on context clues.
   - Use schema:ScholarlyArticle for journal papers (look for journal names, "et al.", volume/issue numbers, DOIs, or a journal serving as the publisher).
   - Use schema:Book for published books (look for ISBNs, editions, or traditional book publishers).

EXAMPLE 1 (Book) — "Smith, J. (2020). Introduction to AI. MIT Press."
@prefix schema: <https://schema.org/> .

_:book1 a schema:Book ;
    schema:name "Introduction to AI" ;
    schema:datePublished "2020" ;
    schema:author _:author1 ;
    schema:publisher _:pub1 .

_:author1 a schema:Person ;
    schema:name "J. Smith" .

_:pub1 a schema:Organization ;
    schema:name "MIT Press" .

EXAMPLE 2 (ScholarlyArticle) — "Doe, A. et al. (2023). Quantum computing advances. Nature 102, 34-40."
@prefix schema: <https://schema.org/> .

_:article1 a schema:ScholarlyArticle ;
    schema:name "Quantum computing advances" ;
    schema:datePublished "2023" ;
    schema:author _:author1 ;
    schema:publisher _:pub1 .

_:author1 a schema:Person ;
    schema:name "A. Doe" .

_:pub1 a schema:Organization ;
    schema:name "Nature" .`;

// ─── n3 parse validation ─────────────────────────────────────────────────────

function validateTurtle(turtle: string): Promise<boolean> {
  return new Promise((resolve) => {
    const parser = new N3Parser({ format: "Turtle" });
    try {
      parser.parse(turtle, (err: Error | null, quad: unknown) => {
        if (err) {
          console.warn("[extractTriples] Turtle parse error:", err.message);
          resolve(false);
          return;
        }
        // null quad = end-of-parse with no errors → valid
        if (quad === null) {
          resolve(true);
        }
        // non-null quad = still parsing, wait for null
      });
    } catch (e) {
      console.warn("[extractTriples] Turtle parse threw:", e);
      resolve(false);
    }
  });
}

// ─── Claude call ─────────────────────────────────────────────────────────────

async function callClaude(userMessage: string): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);

  try {
    const msg = await client.messages.create(
      {
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      },
      { signal: controller.signal }
    );

    const block = msg.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("Claude returned no text content block");
    }
    return block.text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Public export ────────────────────────────────────────────────────────────

/**
 * Convert a raw citation string into validated Turtle.
 * Retries once on Turtle parse failure with a correction prompt.
 * Throws if the retry also fails or if Claude times out.
 */
export async function extractTriples(citation: string): Promise<string> {
  console.log(`[extractTriples] Calling Claude for citation: "${citation}"`);

  // First attempt
  let turtle = await callClaude(
    `Convert the following citation into Turtle RDF. Remember: output ONLY valid Turtle, nothing else.\n\nCitation: ${citation}`
  );

  console.log("[extractTriples] Raw Claude output (attempt 1):\n", turtle);

  const firstValid = await validateTurtle(turtle);
  if (firstValid) {
    console.log("[extractTriples] Turtle valid on first attempt ✓");
    return turtle;
  }

  // Retry with correction prompt
  console.warn("[extractTriples] Turtle invalid — retrying with correction prompt");
  const correctionPrompt = `The following Turtle RDF has syntax errors. Fix ONLY the syntax — do not add or invent any new identifiers. Output ONLY the corrected Turtle, nothing else.\n\nBroken Turtle:\n${turtle}`;

  turtle = await callClaude(correctionPrompt);
  console.log("[extractTriples] Raw Claude output (attempt 2 / correction):\n", turtle);

  const secondValid = await validateTurtle(turtle);
  if (secondValid) {
    console.log("[extractTriples] Turtle valid after correction ✓");
    return turtle;
  }

  throw new Error(
    "Claude produced invalid Turtle after one retry. Raw output:\n" + turtle
  );
}
