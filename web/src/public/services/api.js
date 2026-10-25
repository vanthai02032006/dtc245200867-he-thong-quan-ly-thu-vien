window.ApiService = {
  getToken() {
    return localStorage.getItem('lib_token') || '';
  },

  setToken(token) {
    if (token) localStorage.setItem('lib_token', token);
    else localStorage.removeItem('lib_token');
  },

  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    const token = this.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Có lỗi xảy ra');
    }
    return data;
  },

  getStats() {
    return this.request('/api/stats');
  },

  getBooks(search = '') {
    return this.request('/api/books?search=' + encodeURIComponent(search));
  },

  createBook(payload) {
    return this.request('/api/books', { method: 'POST', body: JSON.stringify(payload) });
  },

  deleteBook(id) {
    return this.request('/api/books/' + id, { method: 'DELETE' });
  },

  getReaders() {
    return this.request('/api/readers');
  },

  createReader(payload) {
    return this.request('/api/readers', { method: 'POST', body: JSON.stringify(payload) });
  },

  deleteReader(id) {
    return this.request('/api/readers/' + id, { method: 'DELETE' });
  },

  getLoans() {
    return this.request('/api/loans');
  },

  createLoan(payload) {
    return this.request('/api/loans', { method: 'POST', body: JSON.stringify(payload) });
  },

  returnLoan(id) {
    return this.request('/api/loans/' + id + '/return', { method: 'POST' });
  },

  login(payload) {
    return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },

  register(payload) {
    return this.request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },

  logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  },

  getMe() {
    return this.request('/api/auth/me');
  },
};
