// @app/components/home/recentVerifiedReferences.tsx

import { Reference } from "@/lib/types";

interface RecentVerifiedReferencesProps {
  references?: Reference[];
  maxDisplay?: number;
}

// Default mock data from database (clean - no styling properties)
const defaultReferences: Reference[] = [
  {
    id: 1,
    title: "Research Database",
    url: "research-db.org",
    type: "Website",
    description: "Comprehensive research database with peer-reviewed articles",
    verifiedAt: "2026-07-01",
  },
  {
    id: 2,
    title: "Academic Insights",
    url: "blog.academic.io",
    type: "Blog",
    description: "Latest academic research and insights",
    verifiedAt: "2026-06-30",
  },
  {
    id: 3,
    title: "Science Review",
    url: "journal.science.org",
    type: "Journal",
    description: "Peer-reviewed scientific journal",
    verifiedAt: "2026-06-29",
  },
  {
    id: 4,
    title: "Research News",
    url: "news.research.com",
    type: "News",
    description: "Latest research news and discoveries",
    verifiedAt: "2026-06-28",
  },
  {
    id: 5,
    title: "Documentation Hub",
    url: "docs.tech.org",
    type: "Documentation",
    description: "Technical documentation and guides",
    verifiedAt: "2026-06-27",
  },
  {
    id: 6,
    title: "Article Archive",
    url: "archive.articles.com",
    type: "Article",
    description: "Historical article archive and references",
    verifiedAt: "2026-06-26",
  },
];

// Color palettes for random generation
const colorPalettes = [
  {
    badge: "bg-blue-100 text-blue-700",
    bg: "bg-blue-50",
    gradient: "from-blue-50 to-white",
    accent: "blue",
  },
  {
    badge: "bg-indigo-100 text-indigo-700",
    bg: "bg-indigo-50",
    gradient: "from-indigo-100 to-white",
    accent: "indigo",
  },
  {
    badge: "bg-green-100 text-green-700",
    bg: "bg-green-50",
    gradient: "from-green-50 to-white",
    accent: "green",
  },
  {
    badge: "bg-orange-100 text-orange-700",
    bg: "bg-orange-50",
    gradient: "from-orange-50 via-white to-amber-50",
    accent: "orange",
  },
  {
    badge: "bg-purple-100 text-purple-700",
    bg: "bg-purple-50",
    gradient: "from-purple-50 to-white",
    accent: "purple",
  },
  {
    badge: "bg-rose-100 text-rose-700",
    bg: "bg-rose-50",
    gradient: "from-rose-50 via-white to-pink-50",
    accent: "rose",
  },
  {
    badge: "bg-amber-100 text-amber-700",
    bg: "bg-amber-50",
    gradient: "from-amber-50 to-white",
    accent: "amber",
  },
  {
    badge: "bg-cyan-100 text-cyan-700",
    bg: "bg-cyan-50",
    gradient: "from-cyan-50 to-white",
    accent: "cyan",
  },
  {
    badge: "bg-emerald-100 text-emerald-700",
    bg: "bg-emerald-50",
    gradient: "from-emerald-50 to-white",
    accent: "emerald",
  },
  {
    badge: "bg-fuchsia-100 text-fuchsia-700",
    bg: "bg-fuchsia-50",
    gradient: "from-fuchsia-50 via-white to-pink-50",
    accent: "fuchsia",
  },
];

// Generate random color palette
const getRandomColor = (seed: string | number) => {
  // Use the id as a seed for consistent colors per item
  const index =
    typeof seed === "string"
      ? seed.length % colorPalettes.length
      : seed % colorPalettes.length;
  return colorPalettes[index];
};

// Generate random background patterns
const getRandomBackground = () => {
  const patterns = [
    "bg-white",
    "bg-gradient-to-br from-gray-50 to-white",
    "bg-gradient-to-tr from-white to-gray-50",
    "bg-gradient-to-b from-white to-gray-100",
    "bg-gray-50",
  ];
  return patterns[Math.floor(Math.random() * patterns.length)];
};

// Generate random preview content based on type
const getPreviewContent = (type: string, color: any) => {
  const previews = {
    Website: {
      elements: (
        <>
          <div className={`h-3 rounded w-2/3 ${color.bg}`}></div>
          <div className="space-y-1.5 mt-2">
            <div className={`h-2 rounded ${color.bg}`}></div>
            <div className={`h-2 rounded w-5/6 ${color.bg}`}></div>
          </div>
          <div className="mt-3 flex gap-1.5">
            <div className={`h-12 ${color.bg} rounded flex-1`}></div>
            <div className={`h-12 ${color.bg} rounded flex-1`}></div>
          </div>
        </>
      ),
    },
    Blog: {
      elements: (
        <>
          <div className={`h-3 rounded w-3/4 ${color.bg}`}></div>
          <div className="space-y-1.5 mt-2">
            <div className={`h-2 rounded ${color.bg}`}></div>
            <div className={`h-2 rounded w-4/5 ${color.bg}`}></div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className={`h-10 ${color.bg} rounded flex-1`}></div>
            <div className={`h-10 ${color.bg} rounded flex-1`}></div>
            <div className={`h-10 ${color.bg} rounded flex-1`}></div>
          </div>
        </>
      ),
    },
    Journal: {
      elements: (
        <>
          <div className={`h-3 rounded w-1/2 ${color.bg}`}></div>
          <div className="space-y-1.5 mt-2">
            <div className={`h-2 rounded ${color.bg}`}></div>
            <div className={`h-2 rounded w-3/4 ${color.bg}`}></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className={`h-8 ${color.bg} rounded`}></div>
            <div className={`h-8 ${color.bg} rounded`}></div>
          </div>
        </>
      ),
    },
    News: {
      elements: (
        <>
          <div className={`h-3 rounded w-2/3 ${color.bg}`}></div>
          <div className="space-y-1.5 mt-2">
            <div className={`h-2 rounded ${color.bg}`}></div>
          </div>
          <div className="mt-3">
            <div
              className={`h-20 ${color.bg} rounded flex items-center justify-center text-[10px] text-${color.accent}-600 font-semibold`}
            >
              Featured Content
            </div>
          </div>
        </>
      ),
    },
    Documentation: {
      elements: (
        <>
          <div className={`h-3 rounded w-1/3 ${color.bg}`}></div>
          <div className="space-y-1.5 mt-2">
            <div className={`h-2 rounded ${color.bg}`}></div>
            <div className={`h-2 rounded w-4/5 ${color.bg}`}></div>
            <div className={`h-2 rounded w-3/4 ${color.bg}`}></div>
          </div>
          <div className="mt-3 flex gap-1.5">
            <div className={`h-8 ${color.bg} rounded flex-1`}></div>
            <div className={`h-8 ${color.bg} rounded flex-1`}></div>
          </div>
        </>
      ),
    },
    Article: {
      elements: (
        <>
          <div className={`h-3 rounded w-3/4 ${color.bg}`}></div>
          <div className="space-y-1.5 mt-2">
            <div className={`h-2 rounded ${color.bg}`}></div>
            <div className={`h-2 rounded w-2/3 ${color.bg}`}></div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <div className={`h-12 ${color.bg} rounded`}></div>
            <div className={`h-12 ${color.bg} rounded`}></div>
            <div className={`h-12 ${color.bg} rounded`}></div>
          </div>
        </>
      ),
    },
  };

  return previews[type as keyof typeof previews] || previews.Website;
};

export default function RecentVerifiedReferences({
  references = defaultReferences,
  maxDisplay = 4,
}: RecentVerifiedReferencesProps) {
  // Limit the number of displayed references
  const displayReferences = references.slice(0, maxDisplay);

  return (
    <section className="bg-gray-50 py-20 text-gray-900">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12">
          <h2 className="relative inline-block text-2xl font-bold tracking-tight text-gray-900 pb-2">
            Recently Verified References
            <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-purple-500"></span>
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Recent sources verified through our platform
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {displayReferences.map((reference) => {
            // Generate random color based on id for consistency
            const color = getRandomColor(reference.id);
            const randomBg = getRandomBackground();
            const previewContent = getPreviewContent(reference.type, color);

            return (
              <div
                key={reference.id}
                className="space-y-3 group cursor-pointer"
              >
                {/* Website Preview Card */}
                <div className="aspect-[4/3] w-full rounded-lg shadow-md overflow-hidden relative border border-gray-200 bg-gray-50 flex flex-col transition-transform hover:scale-105 hover:shadow-lg">
                  {/* Browser Chrome */}
                  <div className="w-full h-8 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center px-3 gap-1.5 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>

                  {/* Preview Content */}
                  <div
                    className={`flex-1 p-4 ${randomBg} overflow-hidden relative`}
                  >
                    {previewContent.elements}
                  </div>
                </div>

                {/* Reference Info */}
                <div className="text-xs">
                  <div
                    className={`inline-block ${color.badge} px-2 py-0.5 rounded text-[10px] font-semibold mb-1`}
                  >
                    {reference.type}
                  </div>
                  <p className="font-bold text-gray-800 line-clamp-1">
                    {reference.title}
                  </p>
                  <p className="text-gray-500 text-[10px] truncate">
                    URL: {reference.url}
                  </p>
                  {reference.verifiedAt && (
                    <p className="text-gray-400 text-[9px] mt-0.5">
                      Verified:{" "}
                      {new Date(reference.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
