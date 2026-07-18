const url = 'https://viaf.org/viaf/search?query=local.corporateNames+all+"Nature"&maximumRecords=3';
fetch(url, { headers: { "User-Agent": "Mnemic-CitationVerifier/1.0", "Accept": "application/json" } })
  .then(r => r.json())
  .then(j => {
    const records = j.searchRetrieveResponse?.records?.record || [];
    for (const r of records) {
      const clusterKey = Object.keys(r.recordData).find(k => k.endsWith('VIAFCluster'));
      const cluster = r.recordData[clusterKey];
      
      const idKey = Object.keys(cluster).find(k => k.endsWith('viafID'));
      const headingsKey = Object.keys(cluster).find(k => k.endsWith('mainHeadings'));
      
      let viafID = idKey ? cluster[idKey] : null;
      let name = "(unknown)";
      
      if (headingsKey && cluster[headingsKey]?.data) {
        const headings = Array.isArray(cluster[headingsKey].data) ? cluster[headingsKey].data : [cluster[headingsKey].data];
        name = headings[0]?.text ?? "(unknown)";
      }
      
      console.log({ viafID, name, type: typeof viafID });
    }
  })
  .catch(console.error);
