/**
 * FINOVATE ERP X - Reports Center Module (Phase 18)
 * مركز التقارير والتحليلات - تقارير شاملة لكل الوحدات
 */

const ReportsModule = (() => {
  // حالة الوحدة
  let state = {
    reports: [],
    charts: [],
    kpis: {},
    currentView: 'dashboard',
    dateRange: { start: null, end: null }
  };

  // تهيئة الوحدة
  function init() {
    loadReportsData();
    setupEventListeners();
    renderReportsDashboard();
  }

  // تحميل بيانات التقارير
  async function loadReportsData() {
    try {
      const [kpis, reports] = await Promise.all([
        fetchKPIData(),
        fetchAvailableReports()
      ]);
      
      state.kpis = kpis;
      state.reports = reports;
    } catch (error) {
      console.error('Error loading reports data:', error);
      showToast('فشل تحميل بيانات التقارير', 'error');
    }
  }

  // جلب مؤشرات الأداء
  async function fetchKPIData() {
    // محاكاة لبيانات KPI من وحدات مختلفة
    return {
      revenue: 128430,
      expenses: 86150,
      profit: 42280,
      outstandingInvoices: 18640,
      activeCustomers: 1248,
      totalSales: 245,
      totalPurchases: 128,
      inventoryValue: 95000,
      lowStockItems: 3,
      pendingApprovals: 8,
      employeeCount: 45,
      attendanceRate: 94.5
    };
  }

  // جلب التقارير المتاحة
  async function fetchAvailableReports() {
    return [
      { id: 'sales_summary', name: 'Sales Summary', category: 'sales', icon: '↗' },
      { id: 'sales_by_customer', name: 'Sales by Customer', category: 'sales', icon: '♧' },
      { id: 'sales_by_product', name: 'Sales by Product', category: 'sales', icon: '📦' },
      { id: 'purchase_summary', name: 'Purchase Summary', category: 'purchasing', icon: '▣' },
      { id: 'inventory_valuation', name: 'Inventory Valuation', category: 'inventory', icon: '▤' },
      { id: 'stock_movement', name: 'Stock Movement', category: 'inventory', icon: '🔄' },
      { id: 'trial_balance', name: 'Trial Balance', category: 'accounting', icon: '⚖️' },
      { id: 'income_statement', name: 'Income Statement', category: 'accounting', icon: '📊' },
      { id: 'balance_sheet', name: 'Balance Sheet', category: 'accounting', icon: '🏦' },
      { id: 'cash_flow', name: 'Cash Flow', category: 'cash', icon: '💰' },
      { id: 'employee_list', name: 'Employee List', category: 'hr', icon: '♙' },
      { id: 'attendance_report', name: 'Attendance Report', category: 'hr', icon: '⏱️' },
      { id: 'payroll_summary', name: 'Payroll Summary', category: 'hr', icon: '💵' },
      { id: 'project_profitability', name: 'Project Profitability', category: 'projects', icon: '📈' },
      { id: 'fleet_costs', name: 'Fleet Costs', category: 'fleet', icon: '🚚' },
      { id: 'budget_variance', name: 'Budget Variance', category: 'budget', icon: '📉' }
    ];
  }

  // إعداد مستمعي الأحداث
  function setupEventListeners() {
    document.addEventListener('click', handleNavigation);
    document.getElementById('export-all-btn')?.addEventListener('click', () => exportAllReports());
    document.getElementById('refresh-data-btn')?.addEventListener('click', () => refreshData());
  }

  // التنقل بين الأقسام
  function handleNavigation(e) {
    const target = e.target.closest('[data-report-view]');
    if (!target) return;
    
    state.currentView = target.dataset.reportView;
    document.querySelectorAll('[data-report-view]').forEach(btn => btn.classList.remove('active'));
    target.classList.add('active');
    
    renderReportsContent();
  }

  // عرض لوحة تحكم التقارير
  function renderReportsDashboard() {
    const html = `
      <div class="reports-dashboard">
        <div class="metrics-grid">
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon indigo">↗</span><span data-i18n="reports.revenue">Revenue</span></div>
            <strong>${formatCurrency(state.kpis.revenue)}</strong>
            <p class="up">↗ 12.5% <span data-i18n="reports.vsLastMonth">vs. last month</span></p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon green">◎</span><span data-i18n="reports.netProfit">Net Profit</span></div>
            <strong>${formatCurrency(state.kpis.profit)}</strong>
            <p class="up">↗ 8.2% <span data-i18n="reports.vsLastMonth">vs. last month</span></p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon orange">◫</span><span data-i18n="reports.outstanding">Outstanding</span></div>
            <strong>${formatCurrency(state.kpis.outstandingInvoices)}</strong>
            <p class="down">↘ 3.1% <span data-i18n="reports.vsLastMonth">vs. last month</span></p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon violet">♙</span><span data-i18n="reports.activeCustomers">Active Customers</span></div>
            <strong>${state.kpis.activeCustomers.toLocaleString()}</strong>
            <p class="up">↗ 5.4% <span data-i18n="reports.vsLastMonth">vs. last month</span></p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon blue">📦</span><span data-i18n="reports.inventoryValue">Inventory Value</span></div>
            <strong>${formatCurrency(state.kpis.inventoryValue)}</strong>
            <p>${state.kpis.lowStockItems} <span data-i18n="reports.lowStock">low stock items</span></p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon rose">✅</span><span data-i18n="reports.pendingApprovals">Pending Approvals</span></div>
            <strong>${state.kpis.pendingApprovals}</strong>
            <p data-i18n="reports.requireAction">Require Action</p>
          </article>
        </div>

        <div class="reports-tabs">
          <button class="tab-btn active" data-report-view="all" data-i18n="reports.allReports">All Reports</button>
          <button class="tab-btn" data-report-view="sales" data-i18n="reports.sales">Sales</button>
          <button class="tab-btn" data-report-view="purchasing" data-i18n="reports.purchasing">Purchasing</button>
          <button class="tab-btn" data-report-view="inventory" data-i18n="reports.inventory">Inventory</button>
          <button class="tab-btn" data-report-view="accounting" data-i18n="reports.accounting">Accounting</button>
          <button class="tab-btn" data-report-view="hr" data-i18n="reports.hr">HR</button>
          <button class="tab-btn" data-report-view="projects" data-i18n="reports.projects">Projects</button>
        </div>

        <div id="reports-content" class="reports-content"></div>
      </div>
    `;

    const mainContent = document.querySelector('main');
    const pageHeader = mainContent.querySelector('.page-header');
    const contentGrid = mainContent.querySelector('.content-grid');
    
    if (pageHeader) {
      pageHeader.innerHTML = `
        <div>
          <p class="eyebrow" data-i18n="navigation.reports">REPORTS CENTER</p>
          <h1 data-i18n="reports.title">Reports & Analytics</h1>
          <p data-i18n="reports.subtitle">Comprehensive business intelligence and reporting</p>
        </div>
        <div class="header-actions">
          <button class="button secondary" id="refresh-data-btn">🔄 Refresh</button>
          <button class="button primary" id="export-all-btn">📥 Export All</button>
        </div>
      `;
    }

    if (contentGrid) {
      contentGrid.innerHTML = html;
      renderReportsContent();
    }
  }

  // عرض محتوى التقارير
  function renderReportsContent() {
    const contentDiv = document.getElementById('reports-content');
    if (!contentDiv) return;

    let filteredReports = state.reports;
    if (state.currentView !== 'all') {
      filteredReports = state.reports.filter(r => r.category === state.currentView);
    }

    if (filteredReports.length === 0) {
      contentDiv.innerHTML = `<div class="empty-state"><span>📊</span><p data-i18n="reports.noReports">No reports available in this category</p></div>`;
      return;
    }

    const html = `
      <div class="reports-grid">
        ${filteredReports.map(report => `
          <article class="report-card" onclick="openReport('${report.id}')">
            <div class="report-icon">${report.icon}</div>
            <h3 data-i18n="reports.${report.id}">${report.name}</h3>
            <p data-i18n="reports.viewReport">View Report</p>
            <div class="report-actions">
              <button class="icon-btn" onclick="event.stopPropagation(); previewReport('${report.id}')" title="Preview">👁️</button>
              <button class="icon-btn" onclick="event.stopPropagation(); exportReport('${report.id}', 'pdf')" title="PDF">📄</button>
              <button class="icon-btn" onclick="event.stopPropagation(); exportReport('${report.id}', 'excel')" title="Excel">📊</button>
              <button class="icon-btn" onclick="event.stopPropagation(); exportReport('${report.id}', 'csv')" title="CSV">📋</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;
    contentDiv.innerHTML = html;
  }

  // فتح تقرير
  window.openReport = (reportId) => {
    showToast(`Opening report: ${reportId}`, 'info');
    // هنا يتم تنفيذ منطق فتح التقرير الفعلي
  };

  // معاينة تقرير
  window.previewReport = (reportId) => {
    showToast(`Previewing report: ${reportId}`, 'info');
  };

  // تصدير تقرير
  window.exportReport = async (reportId, format) => {
    try {
      showToast(`Exporting ${reportId} as ${format.toUpperCase()}...`, 'info');
      await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة
      showToast(`Report exported successfully as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export report', 'error');
    }
  };

  // تصدير كل التقارير
  async function exportAllReports() {
    try {
      showToast('Preparing all reports for export...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000)); // محاكاة
      showToast('All reports exported successfully', 'success');
    } catch (error) {
      console.error('Export all error:', error);
      showToast('Failed to export reports', 'error');
    }
  }

  // تحديث البيانات
  async function refreshData() {
    try {
      showToast('Refreshing data...', 'info');
      await loadReportsData();
      renderReportsDashboard();
      showToast('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Refresh error:', error);
      showToast('Failed to refresh data', 'error');
    }
  }

  // تنسيق العملة
  function formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return { init, renderReportsDashboard };
})();

// تهيئة الوحدة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#reports') {
    ReportsModule.init();
  }
});
