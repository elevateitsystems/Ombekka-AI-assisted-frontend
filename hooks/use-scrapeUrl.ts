import { useMutation } from '@tanstack/react-query';

interface ScrapeResult {
  text: string;
  sourceUrl: string;
  extractedCount: number;
}

export function useScrapeUrl() {
  return useMutation({
    mutationFn: async ({ url }: { url: string }) => {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Scraping failed');
      }

      return response.json() as Promise<ScrapeResult>;
    },
  });
}