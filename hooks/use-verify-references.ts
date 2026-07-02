import { VerifyResult } from '@/lib/types';
import { useMutation } from '@tanstack/react-query';

export function useVerifyReferences() {
  return useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      return response.json() as Promise<VerifyResult>;
    },
  });
}