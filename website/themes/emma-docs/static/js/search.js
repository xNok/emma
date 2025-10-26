(function () {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (!searchInput || !searchResults) {
    return;
  }

  let index;
  let pages;

  fetch('/index.json')
    .then(response => response.json())
    .then(data => {
      pages = data;
      index = new FlexSearch.Document({
        document: {
          id: 'uri',
          index: ['title', 'content'],
        },
      });
      pages.forEach(page => index.add(page));
    });

  searchInput.addEventListener('input', () => {
    const query = searchInput.value;
    const results = index.search(query, { enrich: true });
    searchResults.innerHTML = '';

    if (results.length > 0) {
      results[0].result.forEach(result => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = result.doc.uri;
        a.textContent = result.doc.title;
        li.appendChild(a);
        searchResults.appendChild(li);
      });
    }
  });
})();