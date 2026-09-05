// FINOVATE ERP X - Authentication
const AuthModule = {
  currentUser: null,
  currentCompany: null,
  init() { this.bindEvents(); this.checkSession(); },
  bindEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    if (document.getElementById('language-toggle')) {
      populateLanguageSelector();
      setLanguage(localStorage.getItem('finovate-language') || 'ar');
    }
  },
  async handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked;
    const loginBtn = document.getElementById('login-btn');
    const toast = document.querySelector('.toast');
    if (!email || !password) return this.showToast(toast, 'الرجاء إدخال البريد الإلكتروني وكلمة المرور', 'error');
    loginBtn?.classList.add('loading');
    if (loginBtn) loginBtn.disabled = true;
    const result = await APIClient.login(email, password);
    if (result.status === 'success' && result.user) {
      this.currentUser = Object.assign({}, result.user, { token: result.token });
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('finovate-user', JSON.stringify(this.currentUser));
      if (remember) localStorage.setItem('finovate-session', Date.now().toString());
      this.showToast(toast, 'تم تسجيل الدخول بنجاح', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 500);
    } else {
      if (loginBtn) { loginBtn.classList.remove('loading'); loginBtn.disabled = false; }
      this.showToast(toast, result.message || 'بيانات الدخول غير صحيحة', 'error');
    }
  },
  checkSession() {
    const storedUser = localStorage.getItem('finovate-user') || sessionStorage.getItem('finovate-user');
    if (!storedUser) {
      if (!window.location.pathname.endsWith('/login.html') && !window.location.pathname.endsWith('login.html')) {
        window.location.replace('login.html');
      }
      return;
    }
    try { this.currentUser = JSON.parse(storedUser); } catch (_) { this.logout(); return; }
    if (window.location.pathname.includes('login.html')) window.location.href = 'index.html';
  },
  logout() {
    localStorage.removeItem('finovate-user');
    localStorage.removeItem('finovate-session');
    sessionStorage.removeItem('finovate-user');
    this.currentUser = null;
    window.location.href = 'login.html';
  },
  isAuthenticated() { return this.currentUser !== null; },
  getCurrentUser() { return this.currentUser; },
  getUserRole() { return this.currentUser?.role || 'guest'; },
  hasPermission(permission) {
    const permissions = {
      admin: ['view','create','edit','delete','approve','reject','post','unpost','print','export','import'],
      manager: ['view','create','edit','approve','print','export'],
      accountant: ['view','create','edit','post','print','export'],
      user: ['view','print']
    };
    return permissions[this.getUserRole()]?.includes(permission) || false;
  },
  async hashPassword(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  },
  showToast(toast, message, type = 'info') {
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#e55d78' : type === 'success' ? '#17a673' : '#17233a';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
};
document.addEventListener('DOMContentLoaded', () => AuthModule.init());
