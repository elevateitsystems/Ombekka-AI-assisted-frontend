import { getOrcidAccessToken } from "./orcid-token";

export async function verifyORCID(orcidId: string) {
  try {
    const token = await getOrcidAccessToken();
    const url = `https://pub.orcid.org/v3.0/${orcidId}/person`;
    console.log(`[API CALL] verifyORCID: ${url}`);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
    console.log(`[API RESPONSE] verifyORCID: HTTP ${res.status}`);

    if (res.status === 404) {
      return { valid: false, source: "ORCID", issues: ["ORCID ID not found"] };
    }
    if (!res.ok) {
      return { valid: false, source: "ORCID", issues: [`ORCID API error: ${res.status}`] };
    }

    const data = await res.json();
    const name = `${data.name?.["given-names"]?.value ?? ""} ${data.name?.["family-name"]?.value ?? ""}`.trim();

    return {
      valid: true,
      source: "ORCID",
      data: { name, orcidId },
      integrityScore: 100,
      issues: [],
    };
  } catch {
    return { valid: false, source: "ORCID", issues: ["ORCID lookup failed or timed out"] };
  }
}