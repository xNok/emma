(function () {
  const searchContainer = document.querySelector('.search-container');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (!searchInput || !searchResults) {
    return;
  }

  let index;
  let pages = [];
  const indexUrl = searchContainer?.getAttribute('data-index-url') || 'index.json';

  fetch(indexUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load search index: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      pages = data;
      index = new FlexSearch.Document({
        document: {
          id: 'uri',
          index: ['title', 'content'],
        },
      });
      pages.forEach(page => index.add(page));
    })
    .catch(err => {
      console.warn('Search index could not be loaded:', err);
    });

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    searchResults.innerHTML = '';

    if (!index || !query) {
      searchResults.style.display = 'none';
      return;
    }

    const results = index.search(query, { enrich: true, limit: 10 });
    const seenUris = new Set();
    let hasResults = false;

    if (results.length > 0) {
      results.forEach(section => {
        section.result.forEach(result => {
          if (!seenUris.has(result.doc.uri)) {
            seenUris.add(result.doc.uri);
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = result.doc.uri;
            a.textContent = result.doc.title;
            li.appendChild(a);
            searchResults.appendChild(li);
            hasResults = true;
          }
        });
      });
    }

    searchResults.style.display = hasResults ? 'block' : 'none';
  });

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchContainer?.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });
})();