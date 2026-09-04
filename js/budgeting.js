/**
 * FINOVATE ERP X - Budgeting Module (Phase 17)
 * إدارة الميزانيات - الموازنات السنوية، القسمية، التحليل
 */

const BudgetingModule = (() => {
  // حالة الوحدة
  let state = {
    budgets: [],
    budgetLines: [],
    actuals: [],
    fiscalYear: null,
    currentView: 'annual'
  };

  // تهيئة الوحدة
  function init() {
    loadBudgetData();
    setupEventListeners();
    renderBudgetDashboard();
  }

  // تحميل بيانات الميزانية
  async function loadBudgetData() {
    try {
      const [budgets, budgetLines, actuals, settings] = await Promise.all([
        DatabaseService.query('SELECT * FROM Budgets WHERE isActive = true'),
        DatabaseService.query('SELECT * FROM BudgetLines'),
        DatabaseService.query('SELECT * FROM BudgetActuals'),
        DatabaseService.query('SELECT * FROM Settings WHERE key = "fiscalYear"')
      ]);
      
      state.budgets = budgets || [];
      state.budgetLines = budgetLines || [];
      state.actuals = actuals || [];
      state.fiscalYear = settings?.[0]?.value || new Date().getFullYear();
    } catch (error) {
      console.error('Error loading budget data:', error);
      showToast('فشل تحميل بيانات الميزانية', 'error');
    }
  }

  // إعداد مستمعي الأحداث
  function setupEventListeners() {
    document.addEventListener('click', handleNavigation);
    document.getElementById('new-budget-btn')?.addEventListener('click', () => showBudgetForm());
  }

  // التنقل بين الأقسام
  function handleNavigation(e) {
    const target = e.target.closest('[data-budget-view]');
    if (!target) return;
    
    state.currentView = target.dataset.budgetView;
    document.querySelectorAll('[data-budget-view]').forEach(btn => btn.classList.remove('active'));
    target.classList.add('active');
    
    renderBudgetContent();
  }

  // عرض لوحة تحكم الميزانية
  function renderBudgetDashboard() {
    const totalBudget = state.budgets.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalActual = state.actuals.reduce((sum, a) => sum + (a.amount || 0), 0);
    const variance = totalBudget - totalActual;
    const variancePercent = totalBudget > 0 ? ((variance / totalBudget) * 100).toFixed(1) : 0;
    const departmentsCount = new Set(state.budgets.map(b => b.departmentId)).size;
    const budgetsCount = state.budgets.length;
    const overBudgetItems = state.budgetLines.filter(l => {
      const actual = state.actuals.find(a => a.lineId === l.id)?.amount || 0;
      return actual > l.amount;
    }).length;

    const html = `
      <div class="budget-dashboard">
        <div class="metrics-grid">
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon blue">📊</span><span data-i18n="budget.totalBudget">Total Budget</span></div>
            <strong>${formatCurrency(totalBudget)}</strong>
            <p data-i18n="budget.fiscalYear">Fiscal Year ${state.fiscalYear}</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon green">💵</span><span data-i18n="budget.totalActual">Total Actual</span></div>
            <strong>${formatCurrency(totalActual)}</strong>
            <p data-i18n="budget.yearToDate">Year to Date</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon orange">📈</span><span data-i18n="budget.variance">Variance</span></div>
            <strong class="${variance >= 0 ? 'positive' : 'negative'}">${formatCurrency(variance)}</strong>
            <p class="${variance >= 0 ? 'up' : 'down'}">${variancePercent}% ${data-i18n="budget.vsBudget"}vs. Budget</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon rose">⚠️</span><span data-i18n="budget.overBudgetItems">Over Budget Items</span></div>
            <strong>${overBudgetItems}</strong>
            <p class="down" data-i18n="budget.requireReview">Require Review</p>
          </article>
        </div>

        <div class="budget-tabs">
          <button class="tab-btn active" data-budget-view="annual" data-i18n="budget.annual">Annual Budget</button>
          <button class="tab-btn" data-budget-view="departmental" data-i18n="budget.departmental">Departmental</button>
          <button class="tab-btn" data-budget-view="comparison" data-i18n="budget.comparison">Budget vs Actual</button>
          <button class="tab-btn" data-budget-view="variance" data-i18n="budget.varianceAnalysis">Variance Analysis</button>
        </div>

        <div id="budget-content" class="budget-content"></div>
      </div>
    `;

    const mainContent = document.querySelector('main');
    const pageHeader = mainContent.querySelector('.page-header');
    const contentGrid = mainContent.querySelector('.content-grid');
    
    if (pageHeader) {
      pageHeader.innerHTML = `
        <div>
          <p class="eyebrow" data-i18n="navigation.budget">BUDGET MANAGEMENT</p>
          <h1 data-i18n="budget.title">Budget Management</h1>
          <p data-i18n="budget.subtitle">Manage annual and departmental budgets with variance analysis</p>
        </div>
        <div class="header-actions">
          <button class="button secondary" onclick="exportBudgetReport()">📥 Export Report</button>
          <button class="button primary" id="new-budget-btn">➕ New Budget</button>
        </div>
      `;
    }

    if (contentGrid) {
      contentGrid.innerHTML = html;
      renderBudgetContent();
    }
  }

  // عرض محتوى القسم المحدد
  function renderBudgetContent() {
    const contentDiv = document.getElementById('budget-content');
    if (!contentDiv) return;

    switch(state.currentView) {
      case 'annual':
        renderAnnualBudget(contentDiv);
        break;
      case 'departmental':
        renderDepartmentalBudget(contentDiv);
        break;
      case 'comparison':
        renderBudgetComparison(contentDiv);
        break;
      case 'variance':
        renderVarianceAnalysis(contentDiv);
        break;
    }
  }

  // عرض الميزانية السنوية
  function renderAnnualBudget(container) {
    if (state.budgets.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>📊</span><p data-i18n="budget.noBudgets">No budgets created for this fiscal year</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="budget.budgetId">ID</th>
              <th data-i18n="budget.name">Name</th>
              <th data-i18n="budget.department">Department</th>
              <th data-i18n="budget.category">Category</th>
              <th data-i18n="budget.amount">Amount</th>
              <th data-i18n="budget.period">Period</th>
              <th data-i18n="budget.status">Status</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.budgets.map(b => `
              <tr>
                <td>${b.id}</td>
                <td>${b.name}</td>
                <td>${getDepartmentName(b.departmentId)}</td>
                <td>${b.category}</td>
                <td>${formatCurrency(b.totalAmount)}</td>
                <td>${b.startDate} - ${b.endDate}</td>
                <td><span class="status-badge ${b.status}">${translateStatus(b.status)}</span></td>
                <td>
                  <button class="icon-btn" onclick="editBudget('${b.id}')" title="Edit">✏️</button>
                  <button class="icon-btn" onclick="viewBudgetDetails('${b.id}')" title="Details">👁️</button>
                  <button class="icon-btn" onclick="deleteBudget('${b.id}')" title="Delete">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // عرض الميزانية القسمية
  function renderDepartmentalBudget(container) {
    const departments = groupByDepartment();
    
    if (departments.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>🏢</span><p data-i18n="budget.noDepartments">No departmental budgets found</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="budget.department">Department</th>
              <th data-i18n="budget.budgetAmount">Budget Amount</th>
              <th data-i18n="budget.actualSpent">Actual Spent</th>
              <th data-i18n="budget.remaining">Remaining</th>
              <th data-i18n="budget.utilization">Utilization %</th>
              <th data-i18n="budget.variance">Variance</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${departments.map(dept => {
              const remaining = dept.budget - dept.actual;
              const utilization = dept.budget > 0 ? ((dept.actual / dept.budget) * 100).toFixed(1) : 0;
              const variance = ((dept.actual - dept.budget) / dept.budget * 100).toFixed(1);
              const varianceClass = parseFloat(variance) > 0 ? 'over' : 'under';
              
              return `
              <tr>
                <td>${dept.name}</td>
                <td>${formatCurrency(dept.budget)}</td>
                <td>${formatCurrency(dept.actual)}</td>
                <td>${formatCurrency(remaining)}</td>
                <td>
                  <div class="progress-bar">
                    <div style="width: ${utilization}%" class="progress-fill ${parseFloat(utilization) > 90 ? 'warning' : ''}"></div>
                  </div>
                  <small>${utilization}%</small>
                </td>
                <td><span class="variance-badge ${varianceClass}">${variance}%</span></td>
                <td>
                  <button class="icon-btn" onclick="viewDepartmentBudget('${dept.id}')" title="View">👁️</button>
                  <button class="icon-btn" onclick="adjustDepartmentBudget('${dept.id}')" title="Adjust">🔄</button>
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // عرض مقارنة الميزانية مع الفعلي
  function renderBudgetComparison(container) {
    const comparison = prepareComparisonData();
    
    if (comparison.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>📊</span><p data-i18n="budget.noComparison">No comparison data available</p></div>`;
      return;
    }

    const html = `
      <div class="comparison-chart">
        <div class="chart-container">
          <h3 data-i18n="budget.monthlyComparison">Monthly Comparison</h3>
          <div class="bars-chart">
            ${comparison.map(month => `
              <div class="bar-group">
                <div class="bar budget-bar" style="height: ${month.budgetPercent}%" title="Budget: ${formatCurrency(month.budget)}"></div>
                <div class="bar actual-bar" style="height: ${month.actualPercent}%" title="Actual: ${formatCurrency(month.actual)}"></div>
                <span class="bar-label">${month.month}</span>
              </div>
            `).join('')}
          </div>
          <div class="chart-legend">
            <span><i class="budget-indicator"></i> Budget</span>
            <span><i class="actual-indicator"></i> Actual</span>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  }

  // عرض تحليل الانحرافات
  function renderVarianceAnalysis(container) {
    const varianceData = calculateVarianceData();
    
    if (varianceData.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>📈</span><p data-i18n="budget.noVarianceData">No variance data available</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="budget.category">Category</th>
              <th data-i18n="budget.budget">Budget</th>
              <th data-i18n="budget.actual">Actual</th>
              <th data-i18n="budget.variance">Variance</th>
              <th data-i18n="budget.variancePercent">Variance %</th>
              <th data-i18n="budget.analysis">Analysis</th>
            </tr>
          </thead>
          <tbody>
            ${varianceData.map(item => `
              <tr>
                <td>${item.category}</td>
                <td>${formatCurrency(item.budget)}</td>
                <td>${formatCurrency(item.actual)}</td>
                <td class="${item.variance >= 0 ? 'positive' : 'negative'}">${formatCurrency(item.variance)}</td>
                <td><span class="variance-badge ${item.variance >= 0 ? 'favorable' : 'unfavorable'}">${item.variancePercent}%</span></td>
                <td>${item.analysis || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // تجميع البيانات حسب القسم
  function groupByDepartment() {
    const deptMap = {};
    
    state.budgets.forEach(b => {
      if (!deptMap[b.departmentId]) {
        deptMap[b.departmentId] = {
          id: b.departmentId,
          name: getDepartmentName(b.departmentId),
          budget: 0,
          actual: 0
        };
      }
      deptMap[b.departmentId].budget += b.totalAmount || 0;
    });
    
    state.actuals.forEach(a => {
      if (deptMap[a.departmentId]) {
        deptMap[a.departmentId].actual += a.amount || 0;
      }
    });
    
    return Object.values(deptMap);
  }

  // تحضير بيانات المقارنة
  function prepareComparisonData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const budget = state.budgets.reduce((sum, b) => sum + ((b.monthlyAmounts?.[index]) || (b.totalAmount / 12)), 0);
      const actual = state.actuals.filter(a => new Date(a.date).getMonth() === index).reduce((sum, a) => sum + (a.amount || 0), 0);
      const maxVal = Math.max(budget, actual, 1);
      
      return {
        month,
        budget,
        actual,
        budgetPercent: (budget / maxVal * 100),
        actualPercent: (actual / maxVal * 100)
      };
    });
  }

  // حساب بيانات تحليل الانحرافات
  function calculateVarianceData() {
    const categoryMap = {};
    
    state.budgetLines.forEach(line => {
      if (!categoryMap[line.category]) {
        categoryMap[line.category] = {
          category: line.category,
          budget: 0,
          actual: 0,
          variance: 0,
          variancePercent: 0,
          analysis: ''
        };
      }
      categoryMap[line.category].budget += line.amount || 0;
    });
    
    state.actuals.forEach(actual => {
      if (categoryMap[actual.category]) {
        categoryMap[actual.category].actual += actual.amount || 0;
      }
    });
    
    return Object.values(categoryMap).map(item => {
      item.variance = item.budget - item.actual;
      item.variancePercent = item.budget > 0 ? ((item.variance / item.budget) * 100).toFixed(1) : 0;
      item.analysis = item.variance < 0 ? 'Over budget - review required' : 'Within budget';
      return item;
    });
  }

  // دوال مساعدة
  function getDepartmentName(deptId) {
    // يمكن ربطها بوحدة HR
    return deptId ? `DEPT-${deptId}` : 'General';
  }

  function translateStatus(status) {
    const statusMap = {
      'draft': 'مسودة',
      'pending': 'قيد المراجعة',
      'approved': 'معتمد',
      'active': 'نشط',
      'closed': 'مغلق'
    };
    return statusMap[status] || status;
  }

  function formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  // دوال النموذج
  function showBudgetForm() {
    showToast('نموذج إضافة ميزانية - قيد التطوير', 'info');
  }

  // تصدير تقرير الميزانية
  async function exportBudgetReport() {
    try {
      const reportData = {
        budgets: state.budgets,
        budgetLines: state.budgetLines,
        actuals: state.actuals,
        fiscalYear: state.fiscalYear,
        generatedAt: new Date().toISOString()
      };
      
      const csv = convertToCSV(reportData);
      downloadFile(csv, 'budget_report.csv', 'text/csv');
      showToast('تم تصدير تقرير الميزانية بنجاح', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('فشل تصدير التقرير', 'error');
    }
  }

  function convertToCSV(data) {
    const headers = ['Entity', 'ID', 'Name', 'Amount', 'Status'];
    const rows = [];
    
    data.budgets.forEach(b => {
      rows.push(['Budget', b.id, b.name, b.totalAmount, b.status]);
    });
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // دوال CRUD
  window.editBudget = (id) => showToast(`تعديل الميزانية ${id}`, 'info');
  window.viewBudgetDetails = (id) => showToast(`تفاصيل الميزانية ${id}`, 'info');
  window.deleteBudget = (id) => showToast(`حذف الميزانية ${id}`, 'warning');
  window.viewDepartmentBudget = (id) => showToast(`ميزانية القسم ${id}`, 'info');
  window.adjustDepartmentBudget = (id) => showToast(`تعديل ميزانية القسم ${id}`, 'info');

  return { init, renderBudgetDashboard };
})();

// تهيئة الوحدة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#budget') {
    BudgetingModule.init();
  }
});
