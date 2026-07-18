/**
 * Standalone test for Steps 2 & 3.
 * Run with: bun run scripts/test-graph-steps.ts
 *
 * Requires ANTHROPIC_API_KEY in .env.local (loaded by dotenv below).
 */

import { config } from "dotenv";
// Load .env.local so ANTHROPIC_API_KEY is available
config({ path: ".env.local" });

import { extractTriples } from "../lib/ai/extract-triples";
import { parseTriplesToEntities } from "../lib/graph/parse-triples";

const TEST_CITATION =
  'Baker, P. (2025). ChatGPT For Dummies (2nd Edition). John Wiley & Sons, Inc.';

async function main() {
  console.log("=".repeat(60));
  console.log("STEP 2 — extractTriples");
  console.log("=".repeat(60));
  console.log("Citation:", TEST_CITATION);
  console.log("");

  let turtle: string;
  try {
    turtle = await extractTriples(TEST_CITATION);
  } catch (err) {
    console.error("FAILED:", err);
    process.exit(1);
  }

  console.log("\n--- RAW TURTLE OUTPUT ---\n");
  console.log(turtle);

  console.log("\n" + "=".repeat(60));
  console.log("STEP 3 — parseTriplesToEntities");
  console.log("=".repeat(60));

  let entities;
  try {
    entities = await parseTriplesToEntities(turtle);
  } catch (err) {
    console.error("FAILED:", err);
    process.exit(1);
  }

  console.log("\n--- PARSED ENTITIES ---\n");
  console.log(JSON.stringify(entities, null, 2));
}

main();
