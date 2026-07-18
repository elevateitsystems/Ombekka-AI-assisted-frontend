import { NextRequest, NextResponse } from "next/server";
import { extractTriples } from "@/lib/ai/extract-triples";
import { parseTriplesToEntities } from "@/lib/graph/parse-triples";
import { resolveEntities } from "@/lib/graph/resolve-entities";

/**
 * POST /api/verify/graph
 *
 * Citation-graph pipeline: AI extraction → Turtle parsing → entity resolution.
 *
 * `maxDuration` raises the Vercel serverless timeout from the default 10 s
 * to 60 s for App Router route handlers (valid for Next.js 13+, including 16).
 * Docs: https://vercel.com/docs/functions/configuring-functions/duration
 */
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const start = Date.now();

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { citation?: string };
  try {
    body = (await req.json()) as { citation?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const citation = body.citation?.trim() ?? "";
  if (!citation) {
    return NextResponse.json({ error: "No citation provided" }, { status: 400 });
  }

  // ── Step 2: AI → Turtle ──────────────────────────────────────────────────
  let rawTurtle: string;
  try {
    rawTurtle = await extractTriples(citation);
  } catch (err) {
    console.error("[graph/route] Step 2 (extractTriples) failed:", err);
    return NextResponse.json(
      { error: "Could not parse citation structure" },
      { status: 502 }
    );
  }

  // ── Step 3: Turtle → entities ────────────────────────────────────────────
  let entities: Awaited<ReturnType<typeof parseTriplesToEntities>>;
  try {
    entities = await parseTriplesToEntities(rawTurtle);
  } catch (err) {
    console.error("[graph/route] Step 3 (parseTriplesToEntities) failed:", err);
    return NextResponse.json(
      { error: "Could not parse citation structure" },
      { status: 502 }
    );
  }

  // ── Step 5: Resolve entities (individual failures stay unresolved, never fatal) ──
  const nodes = await resolveEntities(entities);

  // ── Build edges from entity relations ────────────────────────────────────
  const edges = entities.flatMap((e) =>
    e.relations.map((r) => ({
      source: e.nodeId,
      target: r.targetNodeId,
      relation: r.relation,
    }))
  );

  return NextResponse.json({
    nodes,
    edges,
    rawTurtle,
    processingTimeMs: Date.now() - start,
  });
}
