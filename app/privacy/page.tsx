import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-2 text-purple-200 max-w-2xl text-sm sm:text-base">
            Privacy and data handling principles on Veritas.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="mx-auto max-w-4xl px-6 py-12 text-gray-900">
        <p className="text-sm sm:text-base leading-relaxed text-gray-600 mb-8">
          Veritas is built with a simple principle in mind: users should retain control over the material they submit for verification.
        </p>

        <div className="space-y-6">
          <Card className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-base font-bold text-gray-900">What is Submitted</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xs sm:text-sm leading-relaxed text-gray-500">
                The verification workspace may receive text that contains references, citations, URLs, ISBNs, or DOI values. This content is used to perform the verification workflow and produce a report.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-base font-bold text-gray-900">How it is Used</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xs sm:text-sm leading-relaxed text-gray-500">
                The submitted content is processed to inspect source identifiers and generate a summary. It may be stored temporarily as part of the application’s operational workflow, depending on the deployment environment.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-base font-bold text-gray-900">User Expectations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xs sm:text-sm leading-relaxed text-gray-500">
                Users should avoid submitting sensitive or confidential documents unless they are comfortable with the platform processing the entered text. The service is intended for reference verification, not for the long-term storage of private material.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
