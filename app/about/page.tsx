import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Compass, Network, ShieldCheck } from "lucide-react";

const pillars = [
  {
    title: "Reference Traceability",
    description:
      "The platform evaluates whether the cited work can be found using a resolvable identifier or a recognised registry-backed record.",
    icon: Compass,
  },
  {
    title: "Authority Checks",
    description:
      "Books, articles, authors, and institutions are assessed through their canonical identifiers, including ISBN, DOI, VIAF, ORCID, and ROR.",
    icon: ShieldCheck,
  },
  {
    title: "Evidence Reporting",
    description:
      "The output is structured and colour-coded so a reviewer can immediately see what is verified, partial, or unverified.",
    icon: Network,
  },
];

const workflow = [
  "Paste references from a paper, article, or website into the verification workspace.",
  "The platform reviews whether the references are resolvable, linked to canonical authorities, and structurally credible.",
  "A report is generated that highlights verified, partially verified, and unverified references.",
];

export default function AboutPage() {
  return (
    <div className="flex-1 bg-white font-sans antialiased">
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
            Methodology Overview
          </h1>
          <p className="mt-2 text-purple-200 max-w-2xl text-sm sm:text-base">
            A practical framework for checking whether references can be trusted.
          </p>
        </div>
      </section>

      {/* Intro Text Section */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-gray-900">
        <h2 className="relative inline-block text-2xl font-bold tracking-tight mb-6 pb-2 text-gray-900">
          Source Forensics Overview
          <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-purple-500"></span>
        </h2>
        <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-gray-600">
          Veritas is designed as a tactical document-forensics tool. It does not attempt to judge whether a claim is true; instead, it helps establish whether the supporting references and identifiers are discoverable, authoritative, and internally consistent.
        </p>
      </section>

      {/* Pillars Section (Light Gray Background) */}
      <section className="bg-gray-50 border-y border-gray-100 py-16 text-gray-900">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card key={pillar.title} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <CardHeader className="p-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-700">
                      <Icon className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <CardTitle className="mt-4 text-base font-bold text-gray-900">{pillar.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-3">
                    <p className="text-xs sm:text-sm leading-relaxed text-gray-500">{pillar.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-gray-900">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="space-y-4">
            <h2 className="relative inline-block text-2xl font-bold tracking-tight pb-2 text-gray-900">
              The MVP version focuses on the most verifiable evidence.
              <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-purple-500"></span>
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              The short-term goal is to prioritise references that can be checked through public registries and direct web responses. This keeps the workflow practical and useful for real review work.
            </p>
          </div>

          <Card className="rounded-2xl border-gray-100 bg-white shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 px-6 py-5">
              <CardTitle className="flex items-center gap-3 text-base font-bold text-gray-900">
                <BookOpen className="h-5 w-5 text-purple-600 stroke-[2.5]" />
                Review Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-4 text-xs sm:text-sm leading-relaxed text-gray-500">
                {workflow.map((item, index) => (
                  <li key={item} className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
