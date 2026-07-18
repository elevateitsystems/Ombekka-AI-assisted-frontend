const url = 'https://viaf.org/viaf/search?query=local.corporateNames+all+"Nature"&maximumRecords=3&httpAccept=application/json';
fetch(url, { headers: { "User-Agent": "Mnemic-CitationVerifier/1.0 (https://github.com/ombekka; mailto:mnemic@verify.local)", "Accept": "application/json" } })
  .then(r => {
    console.log("Status:", r.status);
    console.log("Redirected:", r.redirected);
    console.log("Final URL:", r.url);
    return r.json();
  })
  .then(j => console.log("Root keys:", Object.keys(j)))
  .catch(console.error);
