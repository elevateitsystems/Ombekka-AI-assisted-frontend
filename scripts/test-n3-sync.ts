/**
 * Probe: does n3 v2 call parse callback synchronously in Bun?
 */
import { Parser as N3Parser } from "n3";

const turtle = `@prefix schema: <https://schema.org/> .

_:book1 a schema:Book ;
    schema:name "ChatGPT For Dummies" ;
    schema:datePublished "2025" ;
    schema:bookEdition "2nd Edition" ;
    schema:author _:author1 ;
    schema:publisher _:pub1 .

_:author1 a schema:Person ;
    schema:name "P. Baker" .

_:pub1 a schema:Organization ;
    schema:name "John Wiley & Sons, Inc." .`;

const quads: unknown[] = [];
let done = false;

const parser = new N3Parser({ format: "Turtle" });

console.log("Before parse()");
parser.parse(turtle, (err, quad) => {
  if (err) {
    console.error("Parse error:", err);
    return;
  }
  if (quad) {
    quads.push(quad);
    console.log("  quad collected:", quad.subject.value, quad.predicate.value.split("/").pop(), quad.object.value);
  } else {
    done = true;
    console.log("  [end-of-parse callback]");
  }
});
console.log("After parse()");
console.log("done =", done, "| quads.length =", quads.length);
