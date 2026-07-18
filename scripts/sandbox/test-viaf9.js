const url = 'https://viaf.org/viaf/search?query=local.corporateNames+all+"Nature"&maximumRecords=3&httpAccept=application/json';
fetch(url, { headers: { "User-Agent": "Mnemic-CitationVerifier/1.0 (https://github.com/ombekka; mailto:mnemic@verify.local)", "Accept": "application/json" } })
  .then(r => r.json())
  .then(json => {
    // VIAF returns objects keyed by random namespaces, e.g. "ns2:VIAFCluster"
    const clusters = Object.values(json).filter(c => typeof c === "object" && c !== null);
    for (const cluster of clusters) {
      // Find keys that end in 'viafID'
      const idKey = Object.keys(cluster).find(k => k.endsWith('viafID'));
      const headingsKey = Object.keys(cluster).find(k => k.endsWith('mainHeadings'));
      
      const viafID = idKey ? cluster[idKey] : null;
      
      let name = "(unknown)";
      if (headingsKey && cluster[headingsKey]?.data) {
        const headings = Array.isArray(cluster[headingsKey].data) ? cluster[headingsKey].data : [cluster[headingsKey].data];
        name = headings[0]?.text ?? "(unknown)";
      }
      console.log({ viafID, name });
    }
  })
  .catch(console.error);
