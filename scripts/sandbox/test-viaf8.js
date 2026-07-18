const url = 'https://viaf.org/viaf/search?query=local.corporateNames+all+"Nature"&maximumRecords=3';
fetch(url, { headers: { "User-Agent": "Mnemic-CitationVerifier/1.0 (https://github.com/ombekka; mailto:mnemic@verify.local)", "Accept": "application/json" } })
  .then(r => r.json())
  .then(j => {
    const records = j.searchRetrieveResponse?.records?.record || [];
    for (const r of records) {
      const data = r.recordData?.VIAFCluster || r.recordData?.['ns2:VIAFCluster'] || r.recordData?.['ns4:VIAFCluster'] || r.recordData;
      console.log(Object.keys(data));
      console.log("viafID:", data.viafID || data['ns2:viafID']);
    }
  })
  .catch(console.error);
