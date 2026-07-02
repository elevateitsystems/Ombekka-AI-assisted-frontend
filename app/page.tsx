import HowToWork from "@/components/home/howToWork";
import ProjectNews from "@/components/home/projectNews";
import RecentVerifiedReferences from "@/components/home/recentVerifiedReferences";
import SearchbarSection from "@/components/home/searchbarSection";

export default function Home() {
  return (
    <div className="flex-1 bg-white font-sans antialiased">
      {/* 1. Purple Banner Section */}
      <SearchbarSection />

      {/* 2. How It Works Section */}
      <HowToWork />

      {/* Recently Verified References - Website Previews */}
      <RecentVerifiedReferences />

      {/* 7. Project News (Light Gray Background) */}
      <ProjectNews />
    </div>
  );
}
