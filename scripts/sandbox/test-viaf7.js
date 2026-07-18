const url = 'https://viaf.org/viaf/search?query=local.corporateNames+all+"Nature"&maximumRecords=3';
fetch(url, { headers: { "User-Agent": "Mnemic-CitationVerifier/1.0 (https://github.com/ombekka; mailto:mnemic@verify.local)", "Accept": "application/json" } })
  .then(r => r.json())
  .then(j => console.log(JSON.stringify(j.searchRetrieveResponse.records.record[0].recordData, null, 2)))
  .catch(console.error);
