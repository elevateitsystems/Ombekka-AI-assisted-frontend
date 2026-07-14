import { NextRequest, NextResponse } from "next/server";
import { verifyIdentifier } from "@/lib/verifier-pipeline";
import { buildSummary } from "@/lib/summarize-results";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.references)) {
      return NextResponse.json(
        { error: "No references provided" },
        { status: 400 }
      );
    }

    // Trim and filter empty strings
    const references: string[] = (body.references as unknown[])
      .filter((r): r is string => typeof r === "string")
      .map((r) => r.trim())
      .filter(Boolean);

    if (references.length === 0) {
      return NextResponse.json(
        { error: "No references provided" },
        { status: 400 }
      );
    }

    // Run all verifications in parallel
    const settled = await Promise.allSettled(
      references.map((ref) => verifyIdentifier(ref))
    );

    const results = settled.map((s, i) => {
      if (s.status === "fulfilled") return s.value;
      // Should never happen because verifyIdentifier never throws, but be safe
      console.error(
        `[POST /api/verify/text] Promise rejected for index ${i}:`,
        s.reason
      );
      return {
        input: references[i],
        detectedType: "unknown" as const,
        valid: false,
        source: "None",
        data: null,
        integrityScore: 0,
        issues: [],
        error: "Unexpected pipeline failure",
      };
    });

    return NextResponse.json({
      results,
      summary: buildSummary(results),
    });
  } catch (err) {
    console.error("[POST /api/verify/text] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
