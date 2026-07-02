'use client';

import { useVerifyReferences } from "@/hooks/use-verify-references";


export function VerifyButton({ text }: { text: string }) {
  const { mutate, isPending, data, error } = useVerifyReferences();

  const handleVerify = () => {
    mutate({ text });
  };

  if (error) {
    return <div className="text-destructive">Error: {error.message}</div>;
  }

  return (
    <div>
      <button 
        onClick={handleVerify} 
        disabled={isPending}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        {isPending ? 'Verifying...' : 'Verify References'}
      </button>
      
      {data && (
        <div className="mt-4">
          <h3>Summary</h3>
          <p>Trust Score: {data.summary.trustScore}%</p>
          <p>Verified: {data.summary.verified}</p>
          <p>Partial: {data.summary.partial}</p>
          <p>Unverified: {data.summary.unverified}</p>
        </div>
      )}
    </div>
  );
}