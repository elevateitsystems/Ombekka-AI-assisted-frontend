import { useMutation } from "@tanstack/react-query";
import type { VerifyUrlResponse } from "@/lib/types";

export function useAnalyzeUrl() {
  return useMutation({
    mutationFn: async (url: string): Promise<VerifyUrlResponse> => {
      const response = await fetch("/api/verify/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          (payload as { error?: string }).error ?? "URL analysis failed"
        );
      }

      return response.json() as Promise<VerifyUrlResponse>;
    },
  });
}
