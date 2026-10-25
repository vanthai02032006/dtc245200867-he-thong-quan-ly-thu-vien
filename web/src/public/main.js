let currentUser = null;
let allBooksCache = [];
let selectedHomeCategory = 'ALL';
let pendingTabAfterLogin = null;
let pendingBookIdAfterLogin = null;

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = isError ? '#dc2626' : '#0f172a';
  t.style.display = 'block';
  setTimeout(() => {
    t.style.display = 'none';
  }, 3200);
}

function openAuthModal(type) {
  closeAuthModal();
  document.getElementById('modal-' + type).classList.add('open');
}

function closeAuthModal() {
  document.getElementById('modal-login').classList.remove('open');
  document.getElementById('modal-register').classList.remove('open');
}

function updateAuthUI() {
  const guestArea = document.getElementById('auth-guest-area');
  const userArea = document.getElementById('auth-user-area');
  const label = document.getElementById('current-user-label');

  const tabBooks = document.getElementById('tabbtn-books');
  const tabLoans = document.getElementById('tabbtn-loans');
  const tabReaders = document.getElementById('tabbtn-readers');

  const navBooks = document.getElementById('nav-books');
  const navLoans = document.getElementById('nav-loans');
  const navReaders = document.getElementById('nav-readers');

  if (currentUser) {
    guestArea.style.display = 'none';
    userArea.style.display = 'flex';
    label.textContent = `🟢 ${currentUser.full_name} (${currentUser.role})`;

    if (tabBooks) tabBooks.textContent = '📖 Quản lý Sách';
    if (tabLoans) tabLoans.textContent = '🔄 Mượn / Trả Sách';
    if (tabReaders) tabReaders.textContent = '👤 Quản lý Độc giả';

    if (navBooks) navBooks.textContent = '📖 Quản lý Sách';
    if (navLoans) navLoans.textContent = '🔄 Mượn / Trả';
    if (navReaders) navReaders.textContent = '👤 Độc giả';
  } else {
    guestArea.style.display = 'flex';
    userArea.style.display = 'none';

    if (tabBooks) tabBooks.textContent = '🔒 Quản lý Sách';
    if (tabLoans) tabLoans.textContent = '🔒 Mượn / Trả Sách';
    if (tabReaders) tabReaders.textContent = '🔒 Quản lý Độc giả';

    if (navBooks) navBooks.textContent = '🔒 Quản lý Sách';
    if (navLoans) navLoans.textContent = '🔒 Mượn / Trả';
    if (navReaders) navReaders.textContent = '🔒 Độc giả';
  }
}

async function checkAuthSession() {
  if (!ApiService.getToken()) {
    currentUser = null;
    updateAuthUI();
    return;
  }
  try {
    const data = await ApiService.getMe();
    currentUser = data.user;
  } catch (err) {
    ApiService.setToken('');
    currentUser = null;
  }
  updateAuthUI();
}

function handlePostLoginNavigation() {
  if (pendingTabAfterLogin) {
    const targetTab = pendingTabAfterLogin;
    const targetBookId = pendingBookIdAfterLogin;
    pendingTabAfterLogin = null;
    pendingBookIdAfterLogin = null;
    switchTab(targetTab);
    if (targetBookId) {
      const selectBook = document.getElementById('loan-book-id');
      if (selectBook) {
        selectBook.value = String(targetBookId);
        selectBook.focus();
      }
    }
  }
}

async function handleLogin(e) {
  e.preventDefault();
  try {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const data = await ApiService.login({ username, password });
    ApiService.setToken(data.token);
    currentUser = data.user;
    updateAuthUI();
    closeAuthModal();
    showToast(`Xin chào ${currentUser.full_name}! Đã mở khóa các chức năng Quản lý.`);
    handlePostLoginNavigation();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  try {
    const full_name = document.getElementById('reg-fullname').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const data = await ApiService.register({ full_name, username, password });
    ApiService.setToken(data.token);
    currentUser = data.user;
    updateAuthUI();
    closeAuthModal();
    e.target.reset();
    showToast(`Đăng ký & đăng nhập thành công: ${currentUser.full_name}`);
    handlePostLoginNavigation();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleLogout() {
  try {
    await ApiService.logout();
  } catch (e) {}
  ApiService.setToken('');
  currentUser = null;
  updateAuthUI();
  switchTab('home');
  showToast('Đã đăng xuất! Các chức năng quản lý đã được khóa.');
}

function switchTab(tabName) {
  // Bảo vệ 3 chức năng Quản lý Sách, Mượn/Trả Sách, Quản lý Độc giả: Bắt buộc đăng nhập
  const protectedTabs = ['books', 'loans', 'readers'];
  if (protectedTabs.includes(tabName) && !currentUser) {
    pendingTabAfterLogin = tabName;
    showToast('🔒 Vui lòng Đăng nhập để sử dụng chức năng Quản lý Sách, Mượn/Trả & Độc giả!', true);
    openAuthModal('login');
    return;
  }

  document.querySelectorAll('.tab-panel, .home-panel').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach((a) => a.classList.remove('active-nav'));

  const panel = document.getElementById('tab-' + tabName);
  if (panel) panel.classList.add('active');

  const tabBtn = document.getElementById('tabbtn-' + tabName);
  if (tabBtn) tabBtn.classList.add('active');

  const navLink = document.getElementById('nav-' + tabName);
  if (navLink) navLink.classList.add('active-nav');
}

function selectHomeCategory(cat, btn) {
  selectedHomeCategory = cat;
  document.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderHomeCatalog();
}

function renderHomeCatalog() {
  const q = (document.getElementById('home-search-input')?.value || '').toLowerCase().trim();
  const filtered = allBooksCache.filter((b) => {
    const matchCat = selectedHomeCategory === 'ALL' || (b.category || '') === selectedHomeCategory;
    const matchText =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.category || '').toLowerCase().includes(q);
    return matchCat && matchText;
  });

  document.getElementById('home-book-count').textContent = `Hiển thị ${filtered.length} đầu sách`;
  const grid = document.getElementById('home-books-grid');

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="card" style="grid-column:1/-1;text-align:center;color:var(--muted)">Không tìm thấy đầu sách phù hợp với từ khóa.</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (b) => `
    <div class="book-card">
      <div>
        <div class="book-card-top">
          <span class="pill pill-blue">${b.category || 'CNTT'}</span>
          ${
            b.available > 0
              ? `<span class="pill pill-green">Còn ${b.available} cuốn</span>`
              : `<span class="pill pill-red">Tạm hết</span>`
          }
        </div>
        <div class="book-icon-title">
          <div class="book-cover-icon">📘</div>
          <div>
            <h3>${b.title}</h3>
            <p class="book-author">✍️ Tác giả: <strong>${b.author}</strong></p>
          </div>
        </div>
      </div>
      <div class="book-card-footer">
        <span class="book-stock-info">Kho: <strong>${b.available}/${b.quantity}</strong> bản</span>
        ${
          b.available > 0
            ? `<button class="btn btn-sm btn-solid" onclick="quickBorrowFromHome(${b.id})">📖 Mượn sách ngay</button>`
            : `<button class="btn btn-sm" style="background:#e2e8f0;color:#64748b;cursor:not-allowed" disabled>Đang được mượn hết</button>`
        }
      </div>
    </div>
  `
    )
    .join('');
}

function quickBorrowFromHome(bookId) {
  if (!currentUser) {
    pendingTabAfterLogin = 'loans';
    pendingBookIdAfterLogin = bookId;
    showToast('🔒 Vui lòng Đăng nhập trước khi lập phiếu mượn sách!', true);
    openAuthModal('login');
    return;
  }
  switchTab('loans');
  const selectBook = document.getElementById('loan-book-id');
  if (selectBook) {
    selectBook.value = String(bookId);
    selectBook.focus();
  }
  showToast('Đã chọn sách! Hãy chọn Độc giả và bấm "Xác Nhận Cho Mượn".');
}

async function loadStats() {
  const data = await ApiService.getStats();
  document.getElementById('stat-books').textContent = `${data.titles} / ${data.totalCopies}`;
  document.getElementById('stat-avail').textContent = data.availableCopies;
  document.getElementById('stat-readers').textContent = data.totalReaders;
  document.getElementById('stat-active-loans').textContent = data.activeLoans;
  document.getElementById('stat-overdue').textContent = data.overdueLoans;
  document.getElementById('stat-returned').textContent = data.returnedLoans;
}

async function loadBooks() {
  const q = document.getElementById('search-book').value || '';
  const books = await ApiService.getBooks(q);
  if (!q) {
    allBooksCache = books;
    renderHomeCatalog();
  }

  const tbody = document.getElementById('books-tbody');
  tbody.innerHTML = books
    .map(
      (b) => `
    <tr>
      <td><strong>#${b.id}</strong></td>
      <td><strong>${b.title}</strong></td>
      <td>${b.author}</td>
      <td><span class="pill pill-blue">${b.category || 'CNTT'}</span></td>
      <td>${b.available} / ${b.quantity}</td>
      <td>
        ${
          b.available > 0
            ? '<span class="pill pill-green">Còn sách</span>'
            : '<span class="pill pill-red">Hết sách</span>'
        }
      </td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteBook(${b.id})">Xóa</button>
      </td>
    </tr>
  `
    )
    .join('');

  const selectBook = document.getElementById('loan-book-id');
  const availBooks = books.filter((b) => b.available > 0);
  selectBook.innerHTML = availBooks.length
    ? availBooks
        .map((b) => `<option value="${b.id}">#${b.id} - ${b.title} (Còn ${b.available})</option>`)
        .join('')
    : '<option value="">-- Không có sách khả dụng --</option>';
}

async function loadReaders() {
  const readers = await ApiService.getReaders();
  const tbody = document.getElementById('readers-tbody');
  tbody.innerHTML = readers
    .map(
      (r) => `
    <tr>
      <td><span class="pill pill-blue">${r.card_code}</span></td>
      <td><strong>${r.name}</strong></td>
      <td>${r.email}</td>
      <td>${r.phone}</td>
      <td><strong>${r.borrowing_count || 0}</strong> cuốn</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteReader(${r.id})">Xóa</button>
      </td>
    </tr>
  `
    )
    .join('');

  const selectReader = document.getElementById('loan-reader-id');
  selectReader.innerHTML = readers.length
    ? readers.map((r) => `<option value="${r.id}">${r.card_code} — ${r.name}</option>`).join('')
    : '<option value="">-- Chưa có độc giả --</option>';
}

async function loadLoans() {
  const loans = await ApiService.getLoans();
  const tbody = document.getElementById('loans-tbody');
  tbody.innerHTML = loans
    .map((l) => {
      const borrowDate = Formatters.formatDate(l.borrow_date);
      const dueDate = Formatters.formatDate(l.due_date);
      const isBorrowed = l.status === 'BORROWED';
      return `
      <tr>
        <td><strong>#PM${l.id}</strong></td>
        <td><strong>${l.book_title}</strong></td>
        <td>${l.reader_name} <small style="color:var(--muted)">(${l.reader_card})</small></td>
        <td>${borrowDate}</td>
        <td>${dueDate}</td>
        <td>
          ${
            isBorrowed
              ? '<span class="pill pill-yellow">Đang mượn</span>'
              : '<span class="pill pill-green">Đã trả</span>'
          }
        </td>
        <td>
          ${
            isBorrowed
              ? `<button class="btn btn-sm btn-success" onclick="returnBook(${l.id})">✔ Trả sách</button>`
              : `<small style="color:var(--muted)">Trả: ${Formatters.formatDate(l.return_date)}</small>`
          }
        </td>
      </tr>
    `;
    })
    .join('');

  const homeRecent = document.getElementById('home-recent-loans');
  if (homeRecent) {
    homeRecent.innerHTML = loans
      .slice(0, 4)
      .map(
        (l) => `
      <tr>
        <td><strong>#PM${l.id}</strong></td>
        <td><strong>${l.book_title}</strong></td>
        <td>${l.reader_name}</td>
        <td>
          ${
            l.status === 'BORROWED'
              ? '<span class="pill pill-yellow">Đang mượn</span>'
              : '<span class="pill pill-green">Đã trả</span>'
          }
        </td>
      </tr>
    `
      )
      .join('');
  }
}

async function refreshAll() {
  await Promise.all([loadStats(), loadBooks(), loadReaders(), loadLoans()]);
}

async function handleAddBook(e) {
  e.preventDefault();
  try {
    await ApiService.createBook({
      title: document.getElementById('book-title').value,
      author: document.getElementById('book-author').value,
      category: document.getElementById('book-category').value,
      quantity: Number(document.getElementById('book-quantity').value),
    });
    e.target.reset();
    document.getElementById('book-quantity').value = 3;
    showToast('Đã thêm sách mới vào thư viện!');
    refreshAll();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function deleteBook(id) {
  if (!confirm('Bạn có chắc muốn xóa đầu sách này?')) return;
  try {
    await ApiService.deleteBook(id);
    showToast('Đã xóa sách');
    refreshAll();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleAddReader(e) {
  e.preventDefault();
  try {
    await ApiService.createReader({
      name: document.getElementById('reader-name').value,
      email: document.getElementById('reader-email').value,
      phone: document.getElementById('reader-phone').value,
      card_code: document.getElementById('reader-card').value,
    });
    e.target.reset();
    showToast('Đã cấp thẻ độc giả thành công!');
    refreshAll();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function deleteReader(id) {
  if (!confirm('Xóa độc giả này sẽ xóa các phiếu mượn liên quan. Tiếp tục?')) return;
  try {
    await ApiService.deleteReader(id);
    showToast('Đã xóa độc giả');
    refreshAll();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleCreateLoan(e) {
  e.preventDefault();
  try {
    await ApiService.createLoan({
      book_id: Number(document.getElementById('loan-book-id').value),
      reader_id: Number(document.getElementById('loan-reader-id').value),
      days: Number(document.getElementById('loan-days').value),
    });
    showToast('Lập phiếu mượn sách thành công!');
    refreshAll();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function returnBook(loanId) {
  try {
    await ApiService.returnLoan(loanId);
    showToast('Đã xác nhận trả sách thành công!');
    refreshAll();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function triggerLokiError() {
  const res = await fetch('/test-error');
  const txt = await res.text();
  showToast('Đã bắn log lỗi 500 sang Loki: ' + txt, true);
}

checkAuthSession();
refreshAll();
