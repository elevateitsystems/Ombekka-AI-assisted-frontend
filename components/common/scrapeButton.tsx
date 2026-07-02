'use client';

import { useScrapeUrl } from "@/hooks/use-scrapeUrl";


export function ScrapeButton({ url }: { url: string }) {
  const { mutate, isPending, data, error } = useScrapeUrl();

  const handleScrape = () => {
    mutate({ url });
  };

  if (error) {
    return <div className="text-destructive">Error: {error.message}</div>;
  }

  return (
    <div>
      <button 
        onClick={handleScrape} 
        disabled={isPending}
        className="px-4 py-2 bg-accent text-accent-foreground rounded-md"
      >
        {isPending ? 'Scraping...' : 'Scrape URL'}
      </button>
      
      {data && (
        <div className="mt-4">
          <p>Extracted {data.extractedCount} items</p>
          <pre className="mt-2 p-4 bg-muted rounded-md max-h-60 overflow-auto">
            {data.text}
          </pre>
        </div>
      )}
    </div>
  );
}