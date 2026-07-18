const url = 'https://viaf.org/viaf/search?query=local.corporateNames+all+"Nature"&maximumRecords=3&httpAccept=application/json';
fetch(url, { headers: { "User-Agent": "Mnemic-CitationVerifier/1.0 (https://github.com/ombekka; mailto:mnemic@verify.local)", "Accept": "application/json" } })
  .then(r => r.json())
  .then(j => console.log(JSON.stringify(j, null, 2)))
  .catch(console.error);
