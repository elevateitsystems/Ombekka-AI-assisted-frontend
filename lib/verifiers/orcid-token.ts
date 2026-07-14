let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getOrcidAccessToken(): Promise<string> {
  // Reuse cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const res = await fetch("https://orcid.org/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: process.env.ORCID_CLIENT_ID!,
      client_secret: process.env.ORCID_CLIENT_SECRET!,
      grant_type: "client_credentials",
      scope: "/read-public",
    }),
  });

  if (!res.ok) {
    throw new Error(`ORCID token request failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000, // typically ~20 years for client-credentials
  };

  return cachedToken.token;
}