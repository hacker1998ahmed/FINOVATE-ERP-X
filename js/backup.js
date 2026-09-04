/**
 * FINOVATE ERP X - Backup & Restore Module (Phase 20)
 * النسخ الاحتياطي والاستعادة - حماية البيانات
 */

const BackupModule = (() => {
  // حالة الوحدة
  let state = {
    backups: [],
    schedules: [],
    lastBackup: null,
    storageUsed: 0,
    storageTotal: 0
  };

  // تهيئة الوحدة
  function init() {
    loadBackupData();
    setupEventListeners();
    renderBackupDashboard();
  }

  // تحميل بيانات النسخ الاحتياطي
  async function loadBackupData() {
    try {
      const [backups, schedules, settings] = await Promise.all([
        DatabaseService.query('SELECT * FROM Backups ORDER BY createdDate DESC LIMIT 50'),
        DatabaseService.query('SELECT * FROM BackupSchedules WHERE isActive = true'),
        DatabaseService.query('SELECT * FROM Settings WHERE key LIKE "backup_%"')
      ]);
      
      state.backups = backups || [];
      state.schedules = schedules || [];
      state.lastBackup = backups?.[0]?.createdDate || null;
      
      // حساب مساحة التخزين
      state.storageUsed = backups.reduce((sum, b) => sum + (b.size || 0), 0);
      state.storageTotal = 10 * 1024 * 1024 * 1024; // 10GB افتراضي
    } catch (error) {
      console.error('Error loading backup data:', error);
      showToast('فشل تحميل بيانات النسخ الاحتياطي', 'error');
    }
  }

  // إعداد مستمعي الأحداث
  function setupEventListeners() {
    document.addEventListener('click', handleNavigation);
    document.getElementById('create-backup-btn')?.addEventListener('click', () => createBackup());
    document.getElementById('schedule-backup-btn')?.addEventListener('click', () => showScheduleDialog());
    document.getElementById('restore-backup-btn')?.addEventListener('click', () => showRestoreDialog());
  }

  // التنقل بين الأقسام
  function handleNavigation(e) {
    const target = e.target.closest('[data-backup-view]');
    if (!target) return;
    
    document.querySelectorAll('[data-backup-view]').forEach(btn => btn.classList.remove('active'));
    target.classList.add('active');
  }

  // عرض لوحة تحكم النسخ الاحتياطي
  function renderBackupDashboard() {
    const backupsCount = state.backups.length;
    const storagePercent = ((state.storageUsed / state.storageTotal) * 100).toFixed(1);
    const daysSinceLastBackup = state.lastBackup ? 
      Math.floor((new Date() - new Date(state.lastBackup)) / (1000 * 60 * 60 * 24)) : null;
    const scheduledBackups = state.schedules.length;

    const html = `
      <div class="backup-dashboard">
        <div class="metrics-grid">
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon blue">💾</span><span data-i18n="backup.totalBackups">Total Backups</span></div>
            <strong>${backupsCount}</strong>
            <p data-i18n="backup.stored">Stored</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon green">🕒</span><span data-i18n="backup.lastBackup">Last Backup</span></div>
            <strong>${daysSinceLastBackup !== null ? `${daysSinceLastBackup}d ago` : 'Never'}</strong>
            <p>${state.lastBackup ? formatDate(state.lastBackup) : 'No backups yet'}</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon orange">📦</span><span data-i18n="backup.storageUsed">Storage Used</span></div>
            <strong>${formatSize(state.storageUsed)} / ${formatSize(state.storageTotal)}</strong>
            <p>${storagePercent}% ${data-i18n="backup.used"}used</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon violet">⏰</span><span data-i18n="backup.scheduled">Scheduled Backups</span></div>
            <strong>${scheduledBackups}</strong>
            <p data-i18n="backup.active">Active</p>
          </article>
        </div>

        <div class="backup-actions-toolbar">
          <button class="button primary" id="create-backup-btn">🔄 Create Backup Now</button>
          <button class="button secondary" id="schedule-backup-btn">⏰ Schedule Backup</button>
          <button class="button secondary" id="restore-backup-btn">⬅️ Restore from Backup</button>
        </div>

        <div class="backups-section">
          <h3 data-i18n="backup.recentBackups">Recent Backups</h3>
          ${state.backups.length > 0 ? `
            <div class="backups-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th data-i18n="backup.name">Name</th>
                    <th data-i18n="common.date">Date</th>
                    <th data-i18n="backup.type">Type</th>
                    <th data-i18n="backup.size">Size</th>
                    <th data-i18n="backup.status">Status</th>
                    <th data-i18n="actions.actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.backups.map(backup => `
                    <tr>
                      <td>${backup.name || `Backup-${backup.id}`}</td>
                      <td>${formatDate(backup.createdDate)}</td>
                      <td><span class="badge ${backup.type}">${backup.type}</span></td>
                      <td>${formatSize(backup.size)}</td>
                      <td><span class="status-badge ${backup.status}">${backup.status}</span></td>
                      <td>
                        <button class="icon-btn" onclick="downloadBackup('${backup.id}')" title="Download">⬇️</button>
                        <button class="icon-btn" onclick="restoreBackup('${backup.id}')" title="Restore">↩️</button>
                        <button class="icon-btn" onclick="deleteBackup('${backup.id}')" title="Delete">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state">
              <span>💾</span>
              <p data-i18n="backup.noBackups">No backups created yet</p>
              <button class="button primary" onclick="createBackup()">Create First Backup</button>
            </div>
          `}
        </div>

        ${state.schedules.length > 0 ? `
          <div class="schedules-section">
            <h3 data-i18n="backup.schedules">Backup Schedules</h3>
            <div class="schedules-grid">
              ${state.schedules.map(schedule => `
                <div class="schedule-card">
                  <div class="schedule-icon">⏰</div>
                  <div class="schedule-info">
                    <strong>${schedule.frequency}</strong>
                    <small>Next: ${formatDate(schedule.nextRun)}</small>
                  </div>
                  <div class="schedule-actions">
                    <button class="icon-btn" onclick="editSchedule('${schedule.id}')" title="Edit">✏️</button>
                    <button class="icon-btn" onclick="toggleSchedule('${schedule.id}')" title="Toggle">🔄</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    const mainContent = document.querySelector('main');
    const pageHeader = mainContent.querySelector('.page-header');
    const contentGrid = mainContent.querySelector('.content-grid');
    
    if (pageHeader) {
      pageHeader.innerHTML = `
        <div>
          <p class="eyebrow" data-i18n="navigation.backup">BACKUP & RESTORE</p>
          <h1 data-i18n="backup.title">Backup & Restore</h1>
          <p data-i18n="backup.subtitle">Protect your data with automated backups</p>
        </div>
      `;
    }

    if (contentGrid) {
      contentGrid.innerHTML = html;
    }
  }

  // إنشاء نسخة احتياطية
  async function createBackup() {
    try {
      showToast('Creating backup...', 'info');
      
      // محاكاة عملية النسخ الاحتياطي
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      showToast('Backup created successfully', 'success');
      loadBackupData();
      renderBackupDashboard();
    } catch (error) {
      console.error('Backup error:', error);
      showToast('Failed to create backup', 'error');
    }
  }

  // إظهار حوار الجدولة
  function showScheduleDialog() {
    const frequency = prompt('Enter backup frequency (daily/weekly/monthly):', 'daily');
    if (frequency) {
      showToast(`Scheduling ${frequency} backup...`, 'info');
    }
  }

  // إظهار حوار الاستعادة
  function showRestoreDialog() {
    if (state.backups.length === 0) {
      showToast('No backups available to restore', 'warning');
      return;
    }
    
    const backupId = prompt(`Enter backup ID to restore (available: ${state.backups.map(b => b.id).join(', ')})`);
    if (backupId) {
      restoreBackup(backupId);
    }
  }

  // تنزيل نسخة احتياطية
  window.downloadBackup = (id) => {
    showToast(`Downloading backup: ${id}`, 'info');
  };

  // استعادة من نسخة احتياطية
  window.restoreBackup = (id) => {
    if (confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
      showToast(`Restoring from backup: ${id}`, 'warning');
    }
  };

  // حذف نسخة احتياطية
  window.deleteBackup = (id) => {
    if (confirm('Are you sure you want to delete this backup?')) {
      showToast(`Deleting backup: ${id}`, 'warning');
    }
  };

  // تعديل جدول
  window.editSchedule = (id) => {
    showToast(`Editing schedule: ${id}`, 'info');
  };

  // تبديل جدول
  window.toggleSchedule = (id) => {
    showToast(`Toggling schedule: ${id}`, 'info');
  };

  // دوال مساعدة
  function formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ar-EG');
  }

  return { init, renderBackupDashboard };
})();

// تهيئة الوحدة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#backup') {
    BackupModule.init();
  }
});
