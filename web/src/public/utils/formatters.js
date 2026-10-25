window.Formatters = {
  formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  },
};
