import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="flex-1 bg-gray-50 font-sans antialiased">
      {/* Purple Header Banner */}
      <section className="relative overflow-hidden bg-[#581c87] bg-gradient-to-r from-[#6b21a8] to-[#581c87] py-12 text-white">
        {/* Wave pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M -100 120 C 300 30, 600 210, 1200 80 C 1800 -30, 2000 170, 2400 120"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Terms of Use
          </h1>
          <p className="mt-2 text-purple-200 max-w-2xl text-sm sm:text-base">
            Terms of use and responsible use instructions.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="mx-auto max-w-4xl px-6 py-12 text-gray-900">
        <p className="text-sm sm:text-base leading-relaxed text-gray-600 mb-8">
          Veritas is a verification support tool. It should be used as part of a broader review process, not as a replacement for human judgement.
        </p>

        <div className="space-y-6">
          <Card className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-base font-bold text-gray-900">Intended Use</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xs sm:text-sm leading-relaxed text-gray-500">
                The service is intended to help users review citations, bibliographic references, and source identifiers. It supports careful, evidence-led evaluation of references.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-base font-bold text-gray-900">Limitations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xs sm:text-sm leading-relaxed text-gray-500">
                Verification results are based on the available identifiers, registry responses, and other network-based signals. They should be interpreted as indicators, not absolute proof.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-base font-bold text-gray-900">Responsible Review</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xs sm:text-sm leading-relaxed text-gray-500">
                Users remain responsible for verifying the final conclusions, especially where the stakes involve publication integrity, academic review, or editorial standards.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
