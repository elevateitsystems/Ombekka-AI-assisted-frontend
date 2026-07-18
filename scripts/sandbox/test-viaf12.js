const url = 'https://viaf.org/viaf/AutoSuggest?query=Nature';
fetch(url, { headers: { "User-Agent": "Mnemic-CitationVerifier/1.0 (https://github.com/ombekka; mailto:mnemic@verify.local)", "Accept": "application/json" } })
  .then(r => r.json())
  .then(j => console.log(JSON.stringify(j.result?.slice(0,3), null, 2)))
  .catch(console.error);
