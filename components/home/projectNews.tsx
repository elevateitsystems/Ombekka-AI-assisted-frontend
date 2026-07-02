import React from "react";

export default function ProjectNews() {
  return (
    <section className="py-20 text-gray-900 border-t border-gray-100">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12">
          <h2 className="relative inline-block text-2xl font-bold tracking-tight text-gray-900 pb-2">
            Project News
            <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-purple-500"></span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3">
                API Domain Consolidation
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                Switch to api2.ismetadata.com for faster registry lookups and
                unified endpoint handling. All other domains will be disabled
                soon.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3">
                New Ingestion Resolver Endpoint
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                Recently updated ISBN and DOI ingestion rules to improve
                resolver accuracy and registry match validation.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3">
                Change your API key anytime
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                Manage access securely from your dashboard and rotate
                credentials without downtime or support requests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
