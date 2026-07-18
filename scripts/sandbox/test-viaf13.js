const url = 'https://viaf.org/viaf/AutoSuggest?query=Jennifer+A.+Doudna';
fetch(url, { headers: { "User-Agent": "Mnemic-CitationVerifier/1.0", "Accept": "application/json" } })
  .then(r => r.json())
  .then(j => console.log(JSON.stringify(j.result?.slice(0,3), null, 2)))
  .catch(console.error);
