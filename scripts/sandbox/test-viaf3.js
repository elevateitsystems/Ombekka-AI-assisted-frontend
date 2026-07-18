const url = 'https://viaf.org/viaf/search?query=local.corporateNames+all+"Nature"&maximumRecords=3';
fetch(url, { headers: { "User-Agent": "Mnemic-CitationVerifier/1.0 (https://github.com/ombekka; mailto:mnemic@verify.local)", "Accept": "application/json" } })
  .then(r => r.json())
  .then(j => console.log("Root keys:", Object.keys(j)))
  .catch(console.error);
