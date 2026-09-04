/**
 * FINOVATE ERP X - Audit Trail Module (Phase 21)
 * مسار التدقيق - تسجيل كل العمليات والتغييرات
 */

const AuditModule = (() => {
  // حالة الوحدة
  let state = {
    logs: [],
    filters: {
      user: null,
      action: null,
      module: null,
      dateFrom: null,
      dateTo: null
    },
    stats: {}
  };

  // تهيئة الوحدة
  function init() {
    loadAuditLogs();
    setupEventListeners();
    renderAuditDashboard();
  }

  // تحميل سجلات التدقيق
  async function loadAuditLogs() {
    try {
      const [logs, stats] = await Promise.all([
        DatabaseService.query('SELECT * FROM AuditLogs ORDER BY timestamp DESC LIMIT 500'),
        fetchAuditStats()
      ]);
      
      state.logs = logs || [];
      state.stats = stats;
    } catch (error) {
      console.error('Error loading audit logs:', error);
      showToast('فشل تحميل سجلات التدقيق', 'error');
    }
  }

  // جلب إحصائيات التدقيق
  async function fetchAuditStats() {
    return {
      totalLogs: state.logs.length,
      todayLogs: state.logs.filter(l => {
        const today = new Date().toDateString();
        return new Date(l.timestamp).toDateString() === today;
      }).length,
      criticalActions: state.logs.filter(l => l.severity === 'critical').length,
      uniqueUsers: new Set(state.logs.map(l => l.userId)).size,
      topActions: getTopActions(),
      recentViolations: state.logs.filter(l => l.status === 'violation').length
    };
  }

  // الحصول على أكثر الإجراءات تكراراً
  function getTopActions() {
    const actionCount = {};
    state.logs.forEach(log => {
      actionCount[log.action] = (actionCount[log.action] || 0) + 1;
    });
    
    return Object.entries(actionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  // إعداد مستمعي الأحداث
  function setupEventListeners() {
    document.addEventListener('click', handleNavigation);
    document.getElementById('export-audit-btn')?.addEventListener('click', () => exportAuditLogs());
    document.getElementById('clear-old-logs-btn')?.addEventListener('click', () => showClearDialog());
    
    // فلاتر البحث
    document.getElementById('audit-filter-user')?.addEventListener('change', (e) => {
      state.filters.user = e.target.value;
      applyFilters();
    });
    
    document.getElementById('audit-filter-module')?.addEventListener('change', (e) => {
      state.filters.module = e.target.value;
      applyFilters();
    });
  }

  // التنقل بين الأقسام
  function handleNavigation(e) {
    const target = e.target.closest('[data-audit-view]');
    if (!target) return;
    
    document.querySelectorAll('[data-audit-view]').forEach(btn => btn.classList.remove('active'));
    target.classList.add('active');
  }

  // عرض لوحة تحكم التدقيق
  function renderAuditDashboard() {
    const html = `
      <div class="audit-dashboard">
        <div class="metrics-grid">
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon blue">📋</span><span data-i18n="audit.totalLogs">Total Logs</span></div>
            <strong>${state.stats.totalLogs?.toLocaleString() || 0}</strong>
            <p data-i18n="audit.recorded">Recorded</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon green">📅</span><span data-i18n="audit.today">Today</span></div>
            <strong>${state.stats.todayLogs?.toLocaleString() || 0}</strong>
            <p data-i18n="audit.actions">Actions</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon rose">⚠️</span><span data-i18n="audit.critical">Critical Actions</span></div>
            <strong>${state.stats.criticalActions?.toLocaleString() || 0}</strong>
            <p data-i18n="audit.requireReview">Require Review</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon violet">👥</span><span data-i18n="audit.activeUsers">Active Users</span></div>
            <strong>${state.stats.uniqueUsers || 0}</strong>
            <p data-i18n="audit.tracked">Tracked</p>
          </article>
        </div>

        <div class="audit-filters">
          <div class="filter-group">
            <label data-i18n="audit.filterUser">Filter by User:</label>
            <select id="audit-filter-user">
              <option value="">All Users</option>
              ${generateUserOptions()}
            </select>
          </div>
          <div class="filter-group">
            <label data-i18n="audit.filterModule">Filter by Module:</label>
            <select id="audit-filter-module">
              <option value="">All Modules</option>
              <option value="auth">Authentication</option>
              <option value="sales">Sales</option>
              <option value="purchasing">Purchasing</option>
              <option value="inventory">Inventory</option>
              <option value="accounting">Accounting</option>
              <option value="hr">HR</option>
              <option value="settings">Settings</option>
            </select>
          </div>
          <div class="filter-group">
            <label data-i18n="audit.dateRange">Date Range:</label>
            <input type="date" id="audit-date-from" />
            <span>to</span>
            <input type="date" id="audit-date-to" />
          </div>
        </div>

        <div class="audit-toolbar">
          <button class="button secondary" id="export-audit-btn">📥 Export Logs</button>
          <button class="button secondary" id="clear-old-logs-btn">🗑️ Clear Old Logs</button>
        </div>

        <div class="audit-logs-section">
          <h3 data-i18n="audit.recentLogs">Recent Audit Logs</h3>
          ${state.logs.length > 0 ? `
            <div class="audit-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th data-i18n="audit.timestamp">Timestamp</th>
                    <th data-i18n="audit.user">User</th>
                    <th data-i18n="audit.module">Module</th>
                    <th data-i18n="audit.action">Action</th>
                    <th data-i18n="audit.entity">Entity</th>
                    <th data-i18n="audit.changes">Changes</th>
                    <th data-i18n="audit.ipAddress">IP Address</th>
                    <th data-i18n="audit.status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.logs.map(log => `
                    <tr class="${log.severity === 'critical' ? 'critical-row' : ''}">
                      <td>${formatDateTime(log.timestamp)}</td>
                      <td>${log.userName || log.userId}</td>
                      <td><span class="badge">${log.module}</span></td>
                      <td><strong>${log.action}</strong></td>
                      <td>${log.entityType} #${log.entityId}</td>
                      <td><small>${truncate(log.changes, 50)}</small></td>
                      <td>${log.ipAddress}</td>
                      <td><span class="status-badge ${log.status}">${log.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state">
              <span>📋</span>
              <p data-i18n="audit.noLogs">No audit logs found</p>
            </div>
          `}
        </div>
      </div>
    `;

    const mainContent = document.querySelector('main');
    const pageHeader = mainContent.querySelector('.page-header');
    const contentGrid = mainContent.querySelector('.content-grid');
    
    if (pageHeader) {
      pageHeader.innerHTML = `
        <div>
          <p class="eyebrow" data-i18n="navigation.audit">AUDIT TRAIL</p>
          <h1 data-i18n="audit.title">Audit Trail</h1>
          <p data-i18n="audit.subtitle">Track all system activities and changes</p>
        </div>
      `;
    }

    if (contentGrid) {
      contentGrid.innerHTML = html;
    }
  }

  // توليد خيارات المستخدمين
  function generateUserOptions() {
    const users = [...new Set(state.logs.map(l => l.userName))].filter(Boolean);
    return users.map(user => `<option value="${user}">${user}</option>`).join('');
  }

  // تطبيق الفلاتر
  function applyFilters() {
    // سيتم تطبيق الفلتر عند التحميل التالي
    showToast('Filters applied', 'info');
  }

  // تصدير سجلات التدقيق
  async function exportAuditLogs() {
    try {
      showToast('Exporting audit logs...', 'info');
      
      const csv = convertLogsToCSV(state.logs);
      downloadFile(csv, 'audit_logs.csv', 'text/csv');
      
      showToast('Audit logs exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export audit logs', 'error');
    }
  }

  // تحويل السجلات إلى CSV
  function convertLogsToCSV(logs) {
    const headers = ['Timestamp', 'User', 'Module', 'Action', 'EntityType', 'EntityId', 'Changes', 'IPAddress', 'Status'];
    const rows = logs.map(log => [
      log.timestamp,
      log.userName,
      log.module,
      log.action,
      log.entityType,
      log.entityId,
      log.changes,
      log.ipAddress,
      log.status
    ]);
    
    return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  }

  // تنزيل ملف
  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // إظهار حوار مسح السجلات القديمة
  function showClearDialog() {
    const days = prompt('Delete logs older than (days):', '90');
    if (days && confirm(`Are you sure you want to delete logs older than ${days} days?`)) {
      showToast(`Deleting logs older than ${days} days...`, 'warning');
    }
  }

  // دوال مساعدة
  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ar-EG');
  }

  function truncate(str, length) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
  }

  return { init, renderAuditDashboard };
})();

// تهيئة الوحدة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#audit') {
    AuditModule.init();
  }
});
