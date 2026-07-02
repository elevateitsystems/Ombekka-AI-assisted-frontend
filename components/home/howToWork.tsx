
export default function HowToWork() {
  return (
    <section className="py-20 text-gray-900">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            How Verification Works
          </h2>
          <p className="mt-3 text-gray-600 text-sm max-w-2xl mx-auto">
            A simple three-step process to validate your sources and citations
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xl mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Submit Reference
            </h3>
            <p className="text-gray-600 text-sm">
              Enter an ISBN, DOI, URL, ORCID, ROR or any research identifier
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Cross-Reference
            </h3>
            <p className="text-gray-600 text-sm">
              We check against authoritative registries and databases
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-xl mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Get Results
            </h3>
            <p className="text-gray-600 text-sm">
              Receive a detailed verification report with source integrity
              scores
            </p>
          </div>
        </div>

        {/* Bottom Info Box */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border border-blue-100">
          <p className="text-gray-700 text-sm leading-relaxed text-center">
            Veritas connects to multiple authoritative data sources including
            ISBN registries, DOI systems, research identifiers (ORCID, ROR), and
            institutional databases. Our forensic analysis checks for structural
            validity, discoverable metadata, and legitimate authority links.
          </p>
        </div>
      </div>
    </section>
  );
}
