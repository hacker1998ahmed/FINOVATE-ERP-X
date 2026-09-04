/**
 * FINOVATE ERP X - Projects Management Module (Phase 16)
 * إدارة المشاريع - المهام، الموارد، الميزانية، الربحية
 */

const ProjectsModule = (() => {
  // حالة الوحدة
  let state = {
    projects: [],
    tasks: [],
    resources: [],
    budgets: [],
    currentView: 'projects'
  };

  // تهيئة الوحدة
  function init() {
    loadProjectsData();
    setupEventListeners();
    renderProjectsDashboard();
  }

  // تحميل بيانات المشاريع
  async function loadProjectsData() {
    try {
      const [projects, tasks, resources, budgets] = await Promise.all([
        DatabaseService.query('SELECT * FROM Projects WHERE isActive = true'),
        DatabaseService.query('SELECT * FROM Tasks ORDER BY dueDate ASC'),
        DatabaseService.query('SELECT * FROM ProjectResources'),
        DatabaseService.query('SELECT * FROM ProjectBudgets')
      ]);
      
      state.projects = projects || [];
      state.tasks = tasks || [];
      state.resources = resources || [];
      state.budgets = budgets || [];
    } catch (error) {
      console.error('Error loading projects data:', error);
      showToast('فشل تحميل بيانات المشاريع', 'error');
    }
  }

  // إعداد مستمعي الأحداث
  function setupEventListeners() {
    document.addEventListener('click', handleNavigation);
    document.getElementById('new-project-btn')?.addEventListener('click', () => showProjectForm());
  }

  // التنقل بين الأقسام
  function handleNavigation(e) {
    const target = e.target.closest('[data-projects-view]');
    if (!target) return;
    
    state.currentView = target.dataset.projectsView;
    document.querySelectorAll('[data-projects-view]').forEach(btn => btn.classList.remove('active'));
    target.classList.add('active');
    
    renderProjectsContent();
  }

  // عرض لوحة تحكم المشاريع
  function renderProjectsDashboard() {
    const totalProjects = state.projects.length;
    const activeProjects = state.projects.filter(p => p.status === 'active').length;
    const completedProjects = state.projects.filter(p => p.status === 'completed').length;
    const delayedProjects = state.projects.filter(p => {
      if (!p.endDate) return false;
      return new Date(p.endDate) < new Date() && p.status !== 'completed';
    }).length;
    const totalBudget = state.budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalSpent = state.budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    const budgetUtilization = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;
    const avgProfitability = calculateAvgProfitability();

    const html = `
      <div class="projects-dashboard">
        <div class="metrics-grid">
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon blue">📋</span><span data-i18n="projects.totalProjects">Total Projects</span></div>
            <strong>${totalProjects}</strong>
            <p>${activeProjects} <span data-i18n="projects.active">Active</span> · ${completedProjects} <span data-i18n="projects.completed">Completed</span></p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon rose">⚠️</span><span data-i18n="projects.delayed">Delayed Projects</span></div>
            <strong>${delayedProjects}</strong>
            <p class="down" data-i18n="projects.requireAttention">Require Attention</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon orange">💰</span><span data-i18n="projects.budgetUtilization">Budget Utilization</span></div>
            <strong>${budgetUtilization}%</strong>
            <p>${formatCurrency(totalSpent)} / ${formatCurrency(totalBudget)}</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon green">📈</span><span data-i18n="projects.avgProfitability">Avg Profitability</span></div>
            <strong>${avgProfitability.toFixed(1)}%</strong>
            <p class="up" data-i18n="projects.profitMargin">Profit Margin</p>
          </article>
        </div>

        <div class="projects-tabs">
          <button class="tab-btn active" data-projects-view="projects" data-i18n="projects.projectsList">Projects</button>
          <button class="tab-btn" data-projects-view="tasks" data-i18n="projects.tasks">Tasks</button>
          <button class="tab-btn" data-projects-view="resources" data-i18n="projects.resources">Resources</button>
          <button class="tab-btn" data-projects-view="budget" data-i18n="projects.budget">Budget</button>
        </div>

        <div id="projects-content" class="projects-content"></div>
      </div>
    `;

    const mainContent = document.querySelector('main');
    const pageHeader = mainContent.querySelector('.page-header');
    const contentGrid = mainContent.querySelector('.content-grid');
    
    if (pageHeader) {
      pageHeader.innerHTML = `
        <div>
          <p class="eyebrow" data-i18n="navigation.projects">PROJECTS MANAGEMENT</p>
          <h1 data-i18n="projects.title">Projects Management</h1>
          <p data-i18n="projects.subtitle">Manage projects, tasks, resources, and budgets</p>
        </div>
        <div class="header-actions">
          <button class="button secondary" onclick="exportProjectsReport()">📥 Export Report</button>
          <button class="button primary" id="new-project-btn">➕ New Project</button>
        </div>
      `;
    }

    if (contentGrid) {
      contentGrid.innerHTML = html;
      renderProjectsContent();
    }
  }

  // عرض محتوى القسم المحدد
  function renderProjectsContent() {
    const contentDiv = document.getElementById('projects-content');
    if (!contentDiv) return;

    switch(state.currentView) {
      case 'projects':
        renderProjectsList(contentDiv);
        break;
      case 'tasks':
        renderTasksList(contentDiv);
        break;
      case 'resources':
        renderResourcesList(contentDiv);
        break;
      case 'budget':
        renderBudgetOverview(contentDiv);
        break;
    }
  }

  // عرض قائمة المشاريع
  function renderProjectsList(container) {
    if (state.projects.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>📋</span><p data-i18n="projects.noProjects">No projects created yet</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="projects.projectId">ID</th>
              <th data-i18n="projects.name">Name</th>
              <th data-i18n="projects.client">Client</th>
              <th data-i18n="projects.manager">Manager</th>
              <th data-i18n="projects.startDate">Start Date</th>
              <th data-i18n="projects.endDate">End Date</th>
              <th data-i18n="projects.status">Status</th>
              <th data-i18n="projects.progress">Progress</th>
              <th data-i18n="projects.budget">Budget</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.projects.map(p => `
              <tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.client || '-'}</td>
                <td>${getEmployeeName(p.managerId)}</td>
                <td>${formatDate(p.startDate)}</td>
                <td>${formatDate(p.endDate)}</td>
                <td><span class="status-badge ${p.status}">${translateStatus(p.status)}</span></td>
                <td>
                  <div class="progress-bar">
                    <div style="width: ${p.progress || 0}%" class="progress-fill"></div>
                  </div>
                  <small>${p.progress || 0}%</small>
                </td>
                <td>${formatCurrency(p.budget)}</td>
                <td>
                  <button class="icon-btn" onclick="editProject('${p.id}')" title="Edit">✏️</button>
                  <button class="icon-btn" onclick="viewProjectDetails('${p.id}')" title="Details">👁️</button>
                  <button class="icon-btn" onclick="deleteProject('${p.id}')" title="Delete">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // عرض قائمة المهام
  function renderTasksList(container) {
    if (state.tasks.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>✅</span><p data-i18n="projects.noTasks">No tasks created yet</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="projects.taskId">ID</th>
              <th data-i18n="projects.taskName">Task Name</th>
              <th data-i18n="projects.project">Project</th>
              <th data-i18n="projects.assignedTo">Assigned To</th>
              <th data-i18n="projects.priority">Priority</th>
              <th data-i18n="projects.dueDate">Due Date</th>
              <th data-i18n="projects.status">Status</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.tasks.map(t => `
              <tr>
                <td>${t.id}</td>
                <td>${t.name}</td>
                <td>${getProjectName(t.projectId)}</td>
                <td>${getEmployeeName(t.assignedTo)}</td>
                <td><span class="priority-badge ${t.priority}">${translatePriority(t.priority)}</span></td>
                <td>${formatDate(t.dueDate)}</td>
                <td><span class="status-badge ${t.status}">${translateStatus(t.status)}</span></td>
                <td>
                  <button class="icon-btn" onclick="editTask('${t.id}')" title="Edit">✏️</button>
                  <button class="icon-btn" onclick="updateTaskStatus('${t.id}')" title="Update Status">🔄</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // عرض قائمة الموارد
  function renderResourcesList(container) {
    if (state.resources.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>👥</span><p data-i18n="projects.noResources">No resources assigned yet</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="projects.resourceId">ID</th>
              <th data-i18n="projects.resourceName">Resource Name</th>
              <th data-i18n="projects.type">Type</th>
              <th data-i18n="projects.project">Project</th>
              <th data-i18n="projects.allocation">Allocation</th>
              <th data-i18n="projects.costPerHour">Cost/Hour</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.resources.map(r => `
              <tr>
                <td>${r.id}</td>
                <td>${r.name}</td>
                <td>${r.type}</td>
                <td>${getProjectName(r.projectId)}</td>
                <td>${r.allocation}%</td>
                <td>${formatCurrency(r.costPerHour)}</td>
                <td>
                  <button class="icon-btn" onclick="editResource('${r.id}')" title="Edit">✏️</button>
                  <button class="icon-btn" onclick="deleteResource('${r.id}')" title="Delete">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // عرض نظرة عامة على الميزانية
  function renderBudgetOverview(container) {
    if (state.budgets.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>💰</span><p data-i18n="projects.noBudget">No budgets created yet</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="projects.project">Project</th>
              <th data-i18n="projects.budgetAmount">Budget Amount</th>
              <th data-i18n="projects.spent">Spent</th>
              <th data-i18n="projects.remaining">Remaining</th>
              <th data-i18n="projects.utilization">Utilization</th>
              <th data-i18n="projects.variance">Variance</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.budgets.map(b => {
              const remaining = (b.amount || 0) - (b.spent || 0);
              const utilization = b.amount > 0 ? ((b.spent / b.amount) * 100).toFixed(1) : 0;
              const variance = ((b.spent - b.amount) / b.amount * 100).toFixed(1);
              const varianceClass = parseFloat(variance) > 0 ? 'over' : 'under';
              
              return `
              <tr>
                <td>${getProjectName(b.projectId)}</td>
                <td>${formatCurrency(b.amount)}</td>
                <td>${formatCurrency(b.spent)}</td>
                <td>${formatCurrency(remaining)}</td>
                <td>
                  <div class="progress-bar">
                    <div style="width: ${utilization}%" class="progress-fill ${parseFloat(utilization) > 90 ? 'warning' : ''}"></div>
                  </div>
                  <small>${utilization}%</small>
                </td>
                <td><span class="variance-badge ${varianceClass}">${variance}%</span></td>
                <td>
                  <button class="icon-btn" onclick="editBudget('${b.id}')" title="Edit">✏️</button>
                  <button class="icon-btn" onclick="viewBudgetDetails('${b.id}')" title="Details">👁️</button>
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // حساب متوسط الربحية
  function calculateAvgProfitability() {
    if (state.projects.length === 0) return 0;
    
    const profitableProjects = state.projects.filter(p => p.revenue && p.costs);
    if (profitableProjects.length === 0) return 0;
    
    const totalProfit = profitableProjects.reduce((sum, p) => {
      return sum + ((p.revenue || 0) - (p.costs || 0));
    }, 0);
    
    const totalRevenue = profitableProjects.reduce((sum, p) => sum + (p.revenue || 0), 0);
    
    if (totalRevenue === 0) return 0;
    return (totalProfit / totalRevenue) * 100;
  }

  // دوال مساعدة
  function getEmployeeName(employeeId) {
    // يمكن ربطها بوحدة HR
    return employeeId ? `EMP-${employeeId}` : 'Unassigned';
  }

  function getProjectName(projectId) {
    const project = state.projects.find(p => p.id === projectId);
    return project ? project.name : '-';
  }

  function translateStatus(status) {
    const statusMap = {
      'planning': 'تخطيط',
      'active': 'نشط',
      'on_hold': 'معلق',
      'completed': 'مكتمل',
      'cancelled': 'ملغى',
      'delayed': 'متأخر'
    };
    return statusMap[status] || status;
  }

  function translatePriority(priority) {
    const priorityMap = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };
    return priorityMap[priority] || priority;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG');
  }

  function formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  // دوال النموذج
  function showProjectForm() {
    showToast('نموذج إضافة مشروع - قيد التطوير', 'info');
  }

  // تصدير تقرير المشاريع
  async function exportProjectsReport() {
    try {
      const reportData = {
        projects: state.projects,
        tasks: state.tasks,
        resources: state.resources,
        budgets: state.budgets,
        generatedAt: new Date().toISOString()
      };
      
      const csv = convertToCSV(reportData);
      downloadFile(csv, 'projects_report.csv', 'text/csv');
      showToast('تم تصدير تقرير المشاريع بنجاح', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('فشل تصدير التقرير', 'error');
    }
  }

  function convertToCSV(data) {
    const headers = ['Entity', 'ID', 'Name', 'Status'];
    const rows = [];
    
    data.projects.forEach(p => {
      rows.push(['Project', p.id, p.name, p.status]);
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
  window.editProject = (id) => showToast(`تعديل المشروع ${id}`, 'info');
  window.viewProjectDetails = (id) => showToast(`تفاصيل المشروع ${id}`, 'info');
  window.deleteProject = (id) => showToast(`حذف المشروع ${id}`, 'warning');
  window.editTask = (id) => showToast(`تعديل المهمة ${id}`, 'info');
  window.updateTaskStatus = (id) => showToast(`تحديث حالة المهمة ${id}`, 'info');
  window.editResource = (id) => showToast(`تعديل المورد ${id}`, 'info');
  window.deleteResource = (id) => showToast(`حذف المورد ${id}`, 'warning');
  window.editBudget = (id) => showToast(`تعديل الميزانية ${id}`, 'info');
  window.viewBudgetDetails = (id) => showToast(`تفاصيل الميزانية ${id}`, 'info');

  return { init, renderProjectsDashboard };
})();

// تهيئة الوحدة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#projects') {
    ProjectsModule.init();
  }
});
