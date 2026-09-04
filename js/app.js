document.addEventListener('DOMContentLoaded', () => {
  populateLanguageSelector();
  setLanguage(localStorage.getItem('finovate-language') || 'en');
  document.querySelector('#language-toggle').addEventListener('change', (event) => setLanguage(event.target.value));
  document.querySelector('.mobile-menu').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
  const toast = document.querySelector('.toast');
  document.querySelector('#new-transaction').addEventListener('click', () => { toast.textContent = document.documentElement.lang === 'ar' ? 'سيتم فتح معاملة جديدة قريبًا.' : 'New transaction workspace is coming next.'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); });
});
