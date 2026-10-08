// DASHBOARD PAGE LOGIC
document.addEventListener('DOMContentLoaded', () => {
  let currentPage = 1;
  let currentType = 'all';
  let currentCategory = 'all';
  let currentStatus = 'active';
  let searchQuery = '';
  let searchTimer;

  const grid = document.getElementById('items-grid');
  const paginationEl = document.getElementById('pagination');
  const totalEl = document.getElementById('total-count');

  // Build category filter options
  const catFilter = document.getElementById('filter-category');
  if (catFilter) {
    CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = `${getCategoryIcon(cat)} ${cat}`;
      catFilter.appendChild(opt);
    });
  }

  // Type tabs
  document.querySelectorAll('.type-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.type-tab').forEach(t => t.className = 'type-tab');
      tab.className = `type-tab active-${tab.dataset.type}`;
      currentType = tab.dataset.type;
      currentPage = 1;
      loadItems();
    });
  });

  // Filters
  document.getElementById('filter-category')?.addEventListener('change', e => {
    currentCategory = e.target.value; currentPage = 1; loadItems();
  });
  document.getElementById('filter-status')?.addEventListener('change', e => {
    currentStatus = e.target.value; currentPage = 1; loadItems();
  });

  // Search
  document.getElementById('search-input')?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      currentPage = 1;
      loadItems();
    }, 400);
  });

  // Clear filters
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    searchQuery = ''; currentType = 'all'; currentCategory = 'all'; currentStatus = 'active'; currentPage = 1;
    document.getElementById('search-input').value = '';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-status').value = 'active';
    document.querySelectorAll('.type-tab').forEach(t => t.className = 'type-tab');
    document.querySelector('[data-type="all"]').className = 'type-tab active-all';
    loadItems();
  });

  async function loadItems() {
    showSkeleton();
    try {
      const params = new URLSearchParams({
        type: currentType, category: currentCategory,
        status: currentStatus, page: currentPage, limit: 12
      });
      if (searchQuery) params.set('search', searchQuery);

      const data = await api(`/items?${params}`);
      renderItems(data.items);
      renderPagination(data.page, data.pages);
      if (totalEl) totalEl.textContent = `${data.total} item${data.total !== 1 ? 's' : ''} found`;
    } catch (err) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">😕</div><h3>Error loading items</h3><p>${err.message}</p></div>`;
    }
  }

  function showSkeleton() {
    grid.innerHTML = Array(6).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton" style="height:200px;border-radius:0"></div>
        <div style="padding:1.25rem;display:flex;flex-direction:column;gap:10px">
          <div class="skeleton" style="height:18px;width:60%"></div>
          <div class="skeleton" style="height:22px;width:85%"></div>
          <div class="skeleton" style="height:14px;width:100%"></div>
          <div class="skeleton" style="height:14px;width:70%"></div>
        </div>
      </div>
    `).join('');
  }

  function renderItems(items) {
    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No items found</h3>
          <p>Try changing your filters or search query.</p>
          <button class="btn btn-primary" onclick="document.getElementById('clear-filters').click()">Clear Filters</button>
        </div>
      `;
      return;
    }
    grid.innerHTML = items.map(buildItemCard).join('');
  }

  function renderPagination(page, pages) {
    if (!paginationEl || pages <= 1) { if (paginationEl) paginationEl.innerHTML = ''; return; }
    let html = '';
    if (page > 1) html += `<button class="page-btn" onclick="goToPage(${page-1})">←</button>`;
    for (let i = Math.max(1, page-2); i <= Math.min(pages, page+2); i++) {
      html += `<button class="page-btn ${i===page?'active':''}" onclick="goToPage(${i})">${i}</button>`;
    }
    if (page < pages) html += `<button class="page-btn" onclick="goToPage(${page+1})">→</button>`;
    paginationEl.innerHTML = html;
  }

  window.goToPage = (p) => { currentPage = p; loadItems(); window.scrollTo({top:0,behavior:'smooth'}); };

  loadItems();
});
