const url = 'https://viaf.org/viaf/search?query=local.corporateNames+all+"Nature"&maximumRecords=3';
fetch(url, { headers: { "User-Agent": "Mnemic-CitationVerifier/1.0", "Accept": "application/json" } })
  .then(r => r.json())
  .then(j => {
    const records = j.searchRetrieveResponse?.records?.record || [];
    for (const r of records) {
      const data = r.recordData;
      // const viafID = data?.viafID; // wait, is it data.viafID or data['ns2:viafID']?
      // const mainHeadings = data?.mainHeadings;
      console.log({ viafID: data?.['ns2:viafID']?.['#text'] || data?.['ns2:viafID'] || data?.viafID || data?.VIAFCluster?.viafID || Object.keys(data) });
    }
  })
  .catch(console.error);
