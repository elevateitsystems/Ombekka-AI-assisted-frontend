import { useMutation } from "@tanstack/react-query";
import type { VerifyTextResponse } from "@/lib/types";

export function useVerifyText() {
  return useMutation({
    mutationFn: async (references: string[]): Promise<VerifyTextResponse> => {
      const response = await fetch("/api/verify/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ references }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          (payload as { error?: string }).error ?? "Verification failed"
        );
      }

      return response.json() as Promise<VerifyTextResponse>;
    },
  });
}
