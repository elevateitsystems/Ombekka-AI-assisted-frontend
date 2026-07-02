import React from "react";
import { Input } from "../ui/input";
import { Search } from "lucide-react";

export default function SearchbarSection() {
  return (
    <section className="relative overflow-hidden bg-[#581c87] bg-gradient-to-r from-[#6b21a8] to-[#581c87] py-16 text-white text-center">
      {/* Subtle Wave grid overlay */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <path
            d="M -100 150 C 300 50, 600 250, 1200 100 C 1800 -50, 2000 200, 2400 150"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M -100 220 C 400 120, 700 320, 1300 170 C 1900 20, 2100 270, 2500 220"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-4xl px-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl font-sans mb-8">
          Verify the sources behind every citation, identifier and reference.
        </h1>
        <div className="mx-auto max-w-xl">
          <form className="relative flex items-center" action="/verify">
            <Input
              name="search"
              type="text"
              placeholder="Search ISBN, DOI, URL, ORCID, ROR"
              className="w-full rounded-full border-none bg-white py-6 pl-6 pr-14 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-4 p-2 text-purple-700 hover:text-purple-900 transition-colors"
              aria-label="Search"
            >
              <Search className="h-6 w-6 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
