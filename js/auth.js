// Authentication Module for FINOVATE ERP X
const AuthModule = {
  currentUser: null,
  currentCompany: null,
  
  // Demo users (will be replaced with Google Sheets backend)
  demoUsers: [
    { email: 'admin@finovate.com', password: 'admin123', name: 'Ahmed Mostafa', role: 'admin', company: 'Ahmed EG' },
    { email: 'accountant@finovate.com', password: 'account123', name: 'Sarah Ibrahim', role: 'accountant', company: 'Ahmed EG' },
    { email: 'manager@finovate.com', password: 'manager123', name: 'Mohamed Ali', role: 'manager', company: 'Ahmed EG' }
  ],
  
  init() {
    this.bindEvents();
    this.checkSession();
  },
  
  bindEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    // Populate language selector
    if (document.getElementById('language-toggle')) {
      populateLanguageSelector();
      setLanguage(localStorage.getItem('finovate-language') || 'ar');
    }
  },
  
  async handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    const loginBtn = document.getElementById('login-btn');
    const toast = document.querySelector('.toast');
    
    if (!email || !password) {
      this.showToast(toast, document.documentElement.lang === 'ar' ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password', 'error');
      return;
    }
    
    // Show loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Find user
    const user = this.demoUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Successful login
      this.currentUser = {
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase()
      };
      
      // Save session
      if (remember) {
        localStorage.setItem('finovate-user', JSON.stringify(this.currentUser));
        localStorage.setItem('finovate-session', Date.now().toString());
      } else {
        sessionStorage.setItem('finovate-user', JSON.stringify(this.currentUser));
      }
      
      this.showToast(toast, document.documentElement.lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    } else {
      // Failed login
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
      this.showToast(toast, document.documentElement.lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password', 'error');
    }
  },
  
  checkSession() {
    const storedUser = localStorage.getItem('finovate-user') || sessionStorage.getItem('finovate-user');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      // If on login page and has session, redirect to dashboard
      if (window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
      }
    }
  },
  
  logout() {
    localStorage.removeItem('finovate-user');
    localStorage.removeItem('finovate-session');
    sessionStorage.removeItem('finovate-user');
    this.currentUser = null;
    window.location.href = 'login.html';
  },
  
  isAuthenticated() {
    return this.currentUser !== null;
  },
  
  getUserRole() {
    return this.currentUser?.role || 'guest';
  },
  
  hasPermission(permission) {
    const rolePermissions = {
      admin: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'post', 'unpost', 'print', 'export', 'import'],
      manager: ['view', 'create', 'edit', 'approve', 'print', 'export'],
      accountant: ['view', 'create', 'edit', 'post', 'print', 'export'],
      user: ['view', 'print']
    };
    
    return rolePermissions[this.getUserRole()]?.includes(permission) || false;
  },
  
  showToast(toast, message, type = 'info') {
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#e55d78' : type === 'success' ? '#17a673' : '#17233a';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
};

// Initialize auth module when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AuthModule.init();
});
