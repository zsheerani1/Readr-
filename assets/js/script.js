document.addEventListener('DOMContentLoaded', () => {
  
  /* ---------- Constants ---------- */
  const STORAGE_KEY = 'readr.books';
  const GOALS_KEY = 'readr.goals';
  const THEME_KEY = 'readr.theme';
  const BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
  const BOOKS_API_KEY = 'AIzaSyCnsWA1WhR52zFkoR26Yeja_FxsCmun4vQ';
  const SEARCH_DEBOUNCE = 350;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
    const STATUS_LABELS = {
    'want-to-read': 'Want to Read',
    'reading': 'Reading',
    'finished': 'Finished'
  };

  /* ---------- State ---------- */
  let books = loadBooks();
  let goals = loadGoals();
  let currentFilter = 'all';
  let searchTerm = '';
  let draftRating = 0;
  let draftCover = '';
  let goalScope = 'monthly';
  let lastFocused = null;
  let searchTimer = null;
  let searchRequestId = 0;

  /* ---------- Persistence ---------- */
  function loadBooks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Could not read books from storage:', err);
      return [];
    }
  }

  function saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (err) {
      console.error('Could not save books:', err);
    }
  }

  /* ---------- Book actions ---------- */
  function addBook(book) {
    if (books.some(b => b.id === book.id)) return;
    books.push(book);
    saveBooks();
    render();
  }

  function removeBook(id) {
    books = books.filter(b => b.id !== id);
    saveBooks();
    render();
  }

  function setStatus(id, status) {
    const book = books.find(b => b.id === id);
    if (!book) return;
    book.status = status;
    saveBooks();
    render();
  }
});
  
  /* ---------- DOM References ---------- */
  const $ = (id) => document.getElementById(id);

  const addBookBtn = $('add-book-btn');
  const addModal = $('add-book-modal');
  const modalClose = $('modal-close');
  const modalCancel = $('modal-cancel');

  const bookForm = $('book-form');
  const titleInput = $('book-title');
  const authorInput = $('book-author');
  const pagesInput = $('book-pages');
  const statusSelect = $('book-status');

  const titleError = $('title-error');
  const authorError = $('author-error');
  const pagesError = $('pages-error');

  const apiSearch = $('api-search');
  const apiResults = $('api-results');
  const apiStatus = $('api-status');

  const selectedBook = $('selected-book');
  const selectedCover = $('selected-cover');
  const selectedTitle = $('selected-title');
  const selectedAuthor = $('selected-author');
  const clearSelection = $('clear-selection');

  const starRating = $('star-rating');

  const bookList = $('book-list');
  const emptyStateMessage = $('empty-state-message');
  const libraryCount = $('library-count');
  const searchInput = $('search-input');
  const searchForm = document.querySelector('.search-form');

  const carouselTrack = $('carousel-track');
  const carouselEmpty = $('carousel-empty');
  const carouselPrev = $('carousel-prev');
  const carouselNext = $('carousel-next');

  const monthlyCount = $('monthly-count');
  const monthlyGoalEl = $('monthly-goal');
  const monthlyFill = $('monthly-progress-fill');
  const monthlyRemaining = $('monthly-remaining');
  const monthName = $('month-name');

  const yearlyCount = $('yearly-count');
  const yearlyGoalEl = $('yearly-goal');
  const yearlyFill = $('yearly-progress-fill');
  const yearlyRemaining = $('yearly-remaining');
  const yearName = $('year-name');

  const readingCount = $('reading-count');
  const wantCount = $('want-count');
  const avgRating = $('avg-rating');

  const goalModal = $('goal-modal');
  const goalForm = $('goal-form');
  const goalInput = $('goal-input');
  const goalError = $('goal-error');
  const goalModalTitle = $('goal-modal-title');
  const editMonthlyGoal = $('edit-monthly-goal');
  const editYearlyGoal = $('edit-yearly-goal');
  const goalCancel = $('goal-cancel');
  const goalModalClose = $('goal-modal-close');

  const themeToggle = $('theme-toggle');
  const greeting = $('greeting');
  const toast = $('toast');

  /* --------- Persistence -------- */
  function loadBooks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch {
      showToast('Could not save — storage is unavailable.');
    }
  }

  function loadGoals() {
    try {
      const raw = localStorage.getItem(GOALS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        monthly: Number(parsed.monthly) > 0 ? Number(parsed.monthly) : 4,
        yearly: Number(parsed.yearly) > 0 ? Number(parsed.yearly) : 30
      };
    } catch {
      return { monthly: 4, yearly: 30 };
    }
  }

  function saveGoals() {
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    } catch {
      showToast('Could not save your goal.');
    }
  }

  /* ---------- Utilities ------- */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function formatStatus(status) {
    return STATUS_LABELS[status] || status;
  }


  function secureUrl(url) {
    return url ? url.replace(/^http:\/\//i, 'https://') : '';
  }

  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => { toast.hidden = true; }, 250);
    }, 2600);
  }

  /* ---------- Modal Handling ---------- */
  function openModal(overlay, focusTarget) {
    if (!overlay) return;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
      if (focusTarget) focusTarget.focus();
    });
  }

  function closeModal(overlay) {
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    setTimeout(() => { overlay.hidden = true; }, 180);
    if (lastFocused) lastFocused.focus();
  }

  function trapFocus(event, overlay) {
    if (event.key !== 'Tab') return;
    const focusables = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const visible = Array.from(focusables).filter(el => el.offsetParent !== null);
    if (!visible.length) return;

    const first = visible[0];
    const last = visible[visible.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('keydown', (event) => {
    const openOverlay = document.querySelector('.modal-overlay:not([hidden])');
    if (!openOverlay) return;
    if (event.key === 'Escape') closeModal(openOverlay);
    trapFocus(event, openOverlay);
  });

  [addModal, goalModal].forEach(overlay => {
    if (!overlay) return;
    overlay.addEventListener('mousedown', (event) => {
      if (event.target === overlay) closeModal(overlay);
    });
  });

  /* ---------- Add Book Modal ---------- */
  function resetAddForm() {
    bookForm.reset();
    draftRating = 0;
    draftCover = '';
    renderStars(0);
    selectedBook.hidden = true;
    selectedCover.src = '';
    selectedCover.alt = '';
    apiResults.innerHTML = '';
    apiStatus.textContent = '';
    apiSearch.value = '';
    titleError.textContent = '';
    authorError.textContent = '';
    pagesError.textContent = '';
  }

  function openAddModal() {
    resetAddForm();
    openModal(addModal, apiSearch);
  }

  if (addBookBtn) addBookBtn.addEventListener('click', openAddModal);
  if (modalClose) modalClose.addEventListener('click', () => closeModal(addModal));
  if (modalCancel) modalCancel.addEventListener('click', () => closeModal(addModal));

  /* ---------- Google Books Search ---------- */
  function renderApiResults(items) {
    apiResults.innerHTML = '';

    if (!items.length) {
      apiStatus.textContent = 'No matches found. You can still fill in the details manually.';
      return;
    }

    apiStatus.textContent = '';

    items.slice(0, 6).forEach(item => {
      const info = item.volumeInfo || {};
      const cover = secureUrl(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '');
      const author = (info.authors && info.authors.join(', ')) || 'Unknown author';
      const year = info.publishedDate ? info.publishedDate.slice(0, 4) : '';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'api-result';
      button.setAttribute('role', 'option');
      button.innerHTML = `
        ${cover
          ? `<img src="${escapeHTML(cover)}" alt="" class="api-result-cover" loading="lazy">`
          : `<span class="api-result-cover api-result-cover--empty" aria-hidden="true"></span>`}
        <span class="api-result-text">
          <span class="api-result-title">${escapeHTML(info.title || 'Untitled')}</span>
          <span class="api-result-meta">${escapeHTML(author)}${year ? ` · ${escapeHTML(year)}` : ''}</span>
        </span>
      `;

      button.addEventListener('click', () => selectVolume(info, cover));

      apiResults.appendChild(button);
    });
  }

  function selectVolume(info, cover) {
    titleInput.value = info.title || '';
    authorInput.value = (info.authors && info.authors.join(', ')) || '';
    pagesInput.value = info.pageCount || '';
    draftCover = cover;

    selectedTitle.textContent = info.title || 'Untitled';
    selectedAuthor.textContent = (info.authors && info.authors.join(', ')) || 'Unknown author';
    selectedCover.src = cover || '';
    selectedCover.alt = cover ? `Cover of ${info.title || 'this book'}` : '';
    selectedCover.hidden = !cover;
    selectedBook.hidden = false;

    apiResults.innerHTML = '';
    apiSearch.value = '';
    apiStatus.textContent = '';

    titleError.textContent = '';
    authorError.textContent = '';
    pagesError.textContent = '';

    statusSelect.focus();
  }

  async function searchGoogleBooks(query) {
    const requestId = ++searchRequestId;
    apiStatus.textContent = 'Searching…';
    apiResults.innerHTML = '';

    const url = `${BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=6&printType=books&key=${BOOKS_API_KEY}`;

    // The Books API returns intermittent 503s, so retry a couple of times
    // with backoff before telling the user the search is unavailable.
    for (let attempt = 0; attempt < 3; attempt++) {
      // A newer keystroke has superseded this search.
      if (requestId !== searchRequestId) return;

      try {
        const response = await fetch(url);

        if (response.status >= 500 && attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
          continue;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (requestId !== searchRequestId) return;

        renderApiResults(data.items || []);
        return;
      } catch {
        if (attempt === 2) {
          if (requestId !== searchRequestId) return;
          apiStatus.textContent = 'Search unavailable right now — enter the details manually below.';
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }

  if (apiSearch) {
    apiSearch.addEventListener('input', () => {
      const query = apiSearch.value.trim();
      clearTimeout(searchTimer);

      if (query.length < 2) {
        searchRequestId++;
        apiResults.innerHTML = '';
        apiStatus.textContent = '';
        return;
      }

      searchTimer = setTimeout(() => searchGoogleBooks(query), SEARCH_DEBOUNCE);
    });

    apiSearch.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') event.preventDefault();
    });
  }

  if (clearSelection) {
    clearSelection.addEventListener('click', () => {
      draftCover = '';
      selectedBook.hidden = true;
      selectedCover.src = '';
      titleInput.value = '';
      authorInput.value = '';
      pagesInput.value = '';
      apiSearch.focus();
    });
  }

  /* ---------- Star Rating ---------- */
  function starSvg() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z"/>
    </svg>`;
  }

  function renderStars(rating) {
    if (!starRating) return;
    starRating.innerHTML = '';

    for (let value = 1; value <= 5; value++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `star${value <= rating ? ' is-filled' : ''}`;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(value === rating));
      button.setAttribute('aria-label', `${value} star${value === 1 ? '' : 's'}`);
      button.innerHTML = starSvg();

      button.addEventListener('click', () => {
        // Clicking the current rating clears it.
        draftRating = draftRating === value ? 0 : value;
        renderStars(draftRating);
      });

      starRating.appendChild(button);
    }
  }

  /* ---------- Validation ---------- */
  function validateForm() {
    let isValid = true;

    titleError.textContent = '';
    authorError.textContent = '';
    pagesError.textContent = '';

    if (titleInput.value.trim() === '') {
      titleError.textContent = 'Title is required.';
      isValid = false;
    }

    if (authorInput.value.trim() === '') {
      authorError.textContent = 'Author is required.';
      isValid = false;
    }

    const pagesValue = Number(pagesInput.value);
    if (!pagesInput.value || Number.isNaN(pagesValue) || pagesValue <= 0) {
      pagesError.textContent = 'Enter a valid number of pages.';
      isValid = false;
    }

    return isValid;
  }

  /* ---------- Add Book ---------- */
  function addBook(event) {
    event.preventDefault();
    if (!validateForm()) return;

    const status = statusSelect.value || 'want-to-read';
    const totalPages = Number(pagesInput.value);

    const newBook = {
      id: generateId(),
      title: titleInput.value.trim(),
      author: authorInput.value.trim(),
      totalPages,
      currentPage: status === 'finished' ? totalPages : 0,
      status,
      rating: draftRating,
      cover: draftCover,
      dateAdded: new Date().toISOString(),
      dateFinished: status === 'finished' ? new Date().toISOString() : null
    };

    books.unshift(newBook);
    saveBooks();
    closeModal(addModal);
    renderAll();
    showToast(`“${newBook.title}” added to your library.`);
  }

  /* ---------- Book Mutations ---------- */
  function deleteBook(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;
    books = books.filter(b => b.id !== id);
    saveBooks();
    renderAll();
    showToast(`“${book.title}” removed.`);
  }

  function setStatus(id, status) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    book.status = status;

    if (status === 'finished') {
      book.currentPage = book.totalPages;
      // Preserve the original finish date if it was already marked finished.
      book.dateFinished = book.dateFinished || new Date().toISOString();
    } else {
      book.dateFinished = null;
      if (status === 'want-to-read' || book.currentPage >= book.totalPages) {
        book.currentPage = 0;
      }
    }

    saveBooks();
    renderAll();
  }

  function setRating(id, rating) {
    const book = books.find(b => b.id === id);
    if (!book) return;
    book.rating = book.rating === rating ? 0 : rating;
    saveBooks();
    renderAll();
  }

  function updateProgress(id, newPage) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    const page = Number(newPage);
    if (Number.isNaN(page) || page < 0) return;

    book.currentPage = Math.min(page, book.totalPages);

    if (book.currentPage >= book.totalPages && book.totalPages > 0) {
      book.status = 'finished';
      book.dateFinished = book.dateFinished || new Date().toISOString();
    } else if (book.currentPage > 0) {
      book.status = 'reading';
      book.dateFinished = null;
    }

    saveBooks();
    renderAll();
  }

  /* ---------- Filtering & Searching ---------- */
  function getFilteredBooks() {
    const term = searchTerm.toLowerCase();
    return books.filter(book => {
      const matchesFilter = currentFilter === 'all' || book.status === currentFilter;
      const matchesSearch = !term ||
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }

  /* ---------- Render Book List ---------- */
  function renderBooks() {
    const filtered = getFilteredBooks();
    bookList.innerHTML = '';

    libraryCount.textContent = `${books.length} book${books.length === 1 ? '' : 's'}`;

    if (!filtered.length) {
      emptyStateMessage.hidden = false;
      emptyStateMessage.textContent = books.length
        ? 'No books match this filter.'
        : 'No books yet. Add your first book to get started.';
      return;
    }

    emptyStateMessage.hidden = true;

    filtered.forEach(book => {
      const percent = book.totalPages > 0
        ? Math.round((book.currentPage / book.totalPages) * 100)
        : 0;

      const li = document.createElement('li');
      li.className = 'book-card';
      li.innerHTML = `
        <div class="book-cover-wrap">
          ${book.cover
            ? `<img src="${escapeHTML(book.cover)}" alt="Cover of ${escapeHTML(book.title)}" class="book-cover" loading="lazy">`
            : `<span class="book-cover book-cover--empty" aria-hidden="true">${escapeHTML(book.title.charAt(0))}</span>`}
        </div>

        <div class="book-info">
          <h3>${escapeHTML(book.title)}</h3>
          <p class="book-meta">${escapeHTML(book.author)} · ${book.totalPages} pages</p>
          <div class="book-stars" role="group" aria-label="Rating for ${escapeHTML(book.title)}"></div>
          <div class="progress-bar" role="progressbar" aria-label="Reading progress" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar-fill" style="width:${percent}%"></div>
          </div>
          <p class="book-progress-text">${book.currentPage} / ${book.totalPages} pages · ${percent}%</p>
        </div>

        <div class="book-controls">
          <span class="book-status" data-status="${escapeHTML(book.status)}">${escapeHTML(formatStatus(book.status))}</span>

          <label class="sr-only" for="status-${book.id}">Status for ${escapeHTML(book.title)}</label>
          <select class="status-select" id="status-${book.id}" data-id="${book.id}">
            <option value="want-to-read"${book.status === 'want-to-read' ? ' selected' : ''}>Want to Read</option>
            <option value="reading"${book.status === 'reading' ? ' selected' : ''}>Reading</option>
            <option value="finished"${book.status === 'finished' ? ' selected' : ''}>Finished</option>
          </select>

          <label class="sr-only" for="page-${book.id}">Current page for ${escapeHTML(book.title)}</label>
          <input type="number" class="page-input" id="page-${book.id}" data-id="${book.id}"
                 value="${book.currentPage}" min="0" max="${book.totalPages}">

          <button type="button" class="btn-delete" data-id="${book.id}" aria-label="Delete ${escapeHTML(book.title)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      `;

      bookList.appendChild(li);

      // Per-card stars are interactive, so build them as real buttons.
      const starsHost = li.querySelector('.book-stars');
      for (let value = 1; value <= 5; value++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `star star--sm${value <= (book.rating || 0) ? ' is-filled' : ''}`;
        btn.setAttribute('aria-label', `Rate ${book.title} ${value} star${value === 1 ? '' : 's'}`);
        btn.innerHTML = starSvg();
        btn.addEventListener('click', () => setRating(book.id, value));
        starsHost.appendChild(btn);
      }
    });

    bookList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteBook(btn.dataset.id));
    });

    bookList.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', () => setStatus(select.dataset.id, select.value));
    });

    bookList.querySelectorAll('.page-input').forEach(input => {
      input.addEventListener('change', () => updateProgress(input.dataset.id, input.value));
    });
  }

  /* ---------- Render Carousel ---------- */
  function renderCarousel() {
    carouselTrack.innerHTML = '';

    if (!books.length) {
      carouselEmpty.hidden = false;
      carouselTrack.hidden = true;
      return;
    }

    carouselEmpty.hidden = true;
    carouselTrack.hidden = false;

    // Reading first, then want-to-read, then finished.
    const order = { 'reading': 0, 'want-to-read': 1, 'finished': 2 };
    const sorted = [...books].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));

    sorted.forEach(book => {
      const percent = book.totalPages > 0
        ? Math.round((book.currentPage / book.totalPages) * 100)
        : 0;

      const li = document.createElement('li');
      li.className = 'carousel-item';
      li.innerHTML = `
        <div class="carousel-cover-wrap">
          ${book.cover
            ? `<img src="${escapeHTML(book.cover)}" alt="Cover of ${escapeHTML(book.title)}" class="carousel-cover" loading="lazy">`
            : `<span class="carousel-cover carousel-cover--empty">${escapeHTML(book.title.charAt(0))}</span>`}
          <span class="carousel-badge" data-status="${escapeHTML(book.status)}">${escapeHTML(formatStatus(book.status))}</span>
        </div>
        <p class="carousel-title">${escapeHTML(book.title)}</p>
        <p class="carousel-author">${escapeHTML(book.author)}</p>
        <div class="progress-bar" role="progressbar" aria-label="Progress for ${escapeHTML(book.title)}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar-fill" style="width:${percent}%"></div>
        </div>
      `;
      carouselTrack.appendChild(li);
    });
  }

  function scrollCarousel(direction) {
    const item = carouselTrack.querySelector('.carousel-item');
    const step = item ? item.offsetWidth + 20 : 200;
    carouselTrack.scrollBy({ left: step * direction * 2, behavior: 'smooth' });
  }

  if (carouselPrev) carouselPrev.addEventListener('click', () => scrollCarousel(-1));
  if (carouselNext) carouselNext.addEventListener('click', () => scrollCarousel(1));

  if (carouselTrack) {
    carouselTrack.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); scrollCarousel(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); scrollCarousel(-1); }
    });
  }

  /* ---------- Render Dashboard ---------- */
  function renderStats() {
    const now = new Date();
    const finished = books.filter(b => b.status === 'finished' && b.dateFinished);

    const finishedThisMonth = finished.filter(b => {
      const date = new Date(b.dateFinished);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const finishedThisYear = finished.filter(b =>
      new Date(b.dateFinished).getFullYear() === now.getFullYear()
    );

    monthName.textContent = MONTHS[now.getMonth()];
    yearName.textContent = now.getFullYear();

    updateGoalCard(finishedThisMonth.length, goals.monthly,
      monthlyCount, monthlyGoalEl, monthlyFill, monthlyRemaining);

    updateGoalCard(finishedThisYear.length, goals.yearly,
      yearlyCount, yearlyGoalEl, yearlyFill, yearlyRemaining);

    readingCount.textContent = books.filter(b => b.status === 'reading').length;
    wantCount.textContent = books.filter(b => b.status === 'want-to-read').length;

    const rated = books.filter(b => b.rating > 0);
    avgRating.textContent = rated.length
      ? (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(1)
      : '—';
  }

  function updateGoalCard(count, goal, countEl, goalEl, fillEl, remainingEl) {
    countEl.textContent = count;
    goalEl.textContent = goal;

    const percent = goal > 0 ? Math.min(Math.round((count / goal) * 100), 100) : 0;
    fillEl.style.width = `${percent}%`;
    fillEl.closest('.progress-bar').setAttribute('aria-valuenow', percent);

    const left = goal - count;
    remainingEl.textContent = left > 0
      ? `${left} to go — ${percent}% of your goal.`
      : (count === goal ? 'Goal reached. Right on target.' : `Goal reached — ${count - goal} ahead.`);
  }

  /* ---------- Goal Modal ---------- */
  function openGoalModal(scope) {
    goalScope = scope;
    goalModalTitle.textContent = scope === 'monthly' ? 'Monthly goal' : 'Yearly goal';
    goalInput.value = goals[scope];
    goalError.textContent = '';
    openModal(goalModal, goalInput);
  }

  if (editMonthlyGoal) editMonthlyGoal.addEventListener('click', () => openGoalModal('monthly'));
  if (editYearlyGoal) editYearlyGoal.addEventListener('click', () => openGoalModal('yearly'));
  if (goalCancel) goalCancel.addEventListener('click', () => closeModal(goalModal));
  if (goalModalClose) goalModalClose.addEventListener('click', () => closeModal(goalModal));

  if (goalForm) {
    goalForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = Number(goalInput.value);

      if (!goalInput.value || Number.isNaN(value) || value < 1) {
        goalError.textContent = 'Enter a number of 1 or more.';
        return;
      }

      goals[goalScope] = Math.floor(value);
      saveGoals();
      closeModal(goalModal);
      renderStats();
      showToast(`${goalScope === 'monthly' ? 'Monthly' : 'Yearly'} goal set to ${goals[goalScope]}.`);
    });
  }

  /* ------- Search ------ */
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchTerm = searchInput.value.trim();
      renderBooks();
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      searchTerm = searchInput.value.trim();
      renderBooks();
    });
  }

  /* ---------- Filter Pills ---------- */
  function setupFilterPills() {
    const pills = document.querySelectorAll('.pill-tab');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => {
          p.classList.remove('is-active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('is-active');
        pill.setAttribute('aria-selected', 'true');
        currentFilter = pill.dataset.filter || 'all';
        renderBooks();
      });
    });
  }

  /* ---------- Theme ---------- */
  function applyTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    }
  }

  function setupThemeToggle() {
    let stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }

    let isDark = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;

    applyTheme(isDark);

    if (!themeToggle) return;
    themeToggle.addEventListener('click', () => {
      isDark = !isDark;
      applyTheme(isDark);
      try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch { /* ignore */ }
    });
  }

  /* ---------- Greeting ---------- */
  function setGreeting() {
    if (!greeting) return;
    const hour = new Date().getHours();
    if (hour < 12) greeting.textContent = 'Good morning';
    else if (hour < 18) greeting.textContent = 'Good afternoon';
    else greeting.textContent = 'Good evening';
  }

  /* ---------- Render All ---------- */
  function renderAll() {
    renderBooks();
    renderCarousel();
    renderStats();
  }

  /* ---------- Event Listeners ---------- */
  if (bookForm) bookForm.addEventListener('submit', addBook);

  /* ---------- Init ---------- */
  setupFilterPills();
  setupThemeToggle();
  setGreeting();
  renderStars(0);
  renderAll();

});
