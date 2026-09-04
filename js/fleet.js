/**
 * FINOVATE ERP X - Fleet Management Module (Phase 15)
 * إدارة الأسطول - المركبات، السائقين، الوقود، الصيانة
 */

const FleetModule = (() => {
  // حالة الوحدة
  let state = {
    vehicles: [],
    drivers: [],
    fuelLogs: [],
    maintenanceLogs: [],
    insuranceRecords: [],
    currentView: 'vehicles'
  };

  // تهيئة الوحدة
  function init() {
    loadFleetData();
    setupEventListeners();
    renderFleetDashboard();
  }

  // تحميل بيانات الأسطول
  async function loadFleetData() {
    try {
      const [vehicles, drivers, fuelLogs, maintenanceLogs, insuranceRecords] = await Promise.all([
        DatabaseService.query('SELECT * FROM Vehicles WHERE isActive = true'),
        DatabaseService.query('SELECT * FROM Drivers WHERE isActive = true'),
        DatabaseService.query('SELECT * FROM FuelLogs ORDER BY date DESC LIMIT 50'),
        DatabaseService.query('SELECT * FROM MaintenanceLogs ORDER BY date DESC LIMIT 50'),
        DatabaseService.query('SELECT * FROM InsuranceRecords WHERE expiryDate >= date("now")')
      ]);
      
      state.vehicles = vehicles || [];
      state.drivers = drivers || [];
      state.fuelLogs = fuelLogs || [];
      state.maintenanceLogs = maintenanceLogs || [];
      state.insuranceRecords = insuranceRecords || [];
    } catch (error) {
      console.error('Error loading fleet data:', error);
      showToast('فشل تحميل بيانات الأسطول', 'error');
    }
  }

  // إعداد مستمعي الأحداث
  function setupEventListeners() {
    document.addEventListener('click', handleNavigation);
    document.getElementById('new-vehicle-btn')?.addEventListener('click', () => showVehicleForm());
    document.getElementById('new-driver-btn')?.addEventListener('click', () => showDriverForm());
    document.getElementById('add-fuel-log-btn')?.addEventListener('click', () => showFuelLogForm());
    document.getElementById('add-maintenance-btn')?.addEventListener('click', () => showMaintenanceForm());
  }

  // التنقل بين الأقسام
  function handleNavigation(e) {
    const target = e.target.closest('[data-fleet-view]');
    if (!target) return;
    
    state.currentView = target.dataset.fleetView;
    document.querySelectorAll('[data-fleet-view]').forEach(btn => btn.classList.remove('active'));
    target.classList.add('active');
    
    renderFleetContent();
  }

  // عرض لوحة تحكم الأسطول
  function renderFleetDashboard() {
    const totalVehicles = state.vehicles.length;
    const activeVehicles = state.vehicles.filter(v => v.status === 'active').length;
    const inMaintenance = state.vehicles.filter(v => v.status === 'maintenance').length;
    const totalDrivers = state.drivers.length;
    const expiringInsurance = state.insuranceRecords.filter(r => {
      const daysLeft = (new Date(r.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft <= 30;
    }).length;
    const avgFuelConsumption = calculateAvgFuelConsumption();

    const html = `
      <div class="fleet-dashboard">
        <div class="metrics-grid">
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon blue">🚗</span><span data-i18n="fleet.totalVehicles">Total Vehicles</span></div>
            <strong>${totalVehicles}</strong>
            <p>${activeVehicles} <span data-i18n="fleet.active">Active</span> · ${inMaintenance} <span data-i18n="fleet.inMaintenance">In Maintenance</span></p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon green">👨‍✈️</span><span data-i18n="fleet.totalDrivers">Total Drivers</span></div>
            <strong>${totalDrivers}</strong>
            <p data-i18n="fleet.licensedDrivers">Licensed & Available</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon orange">⛽</span><span data-i18n="fleet.avgConsumption">Avg Consumption</span></div>
            <strong>${avgFuelConsumption.toFixed(2)} L/100km</strong>
            <p class="up" data-i18n="fleet.lastMonth">Last Month</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon rose">⚠️</span><span data-i18n="fleet.expiringInsurance">Expiring Insurance</span></div>
            <strong>${expiringInsurance}</strong>
            <p class="down" data-i18n="fleet.within30Days">Within 30 Days</p>
          </article>
        </div>

        <div class="fleet-tabs">
          <button class="tab-btn active" data-fleet-view="vehicles" data-i18n="fleet.vehicles">Vehicles</button>
          <button class="tab-btn" data-fleet-view="drivers" data-i18n="fleet.drivers">Drivers</button>
          <button class="tab-btn" data-fleet-view="fuel" data-i18n="fleet.fuelLogs">Fuel Logs</button>
          <button class="tab-btn" data-fleet-view="maintenance" data-i18n="fleet.maintenance">Maintenance</button>
          <button class="tab-btn" data-fleet-view="insurance" data-i18n="fleet.insurance">Insurance</button>
        </div>

        <div id="fleet-content" class="fleet-content"></div>
      </div>
    `;

    const mainContent = document.querySelector('main');
    const pageHeader = mainContent.querySelector('.page-header');
    const contentGrid = mainContent.querySelector('.content-grid');
    
    if (pageHeader) {
      pageHeader.innerHTML = `
        <div>
          <p class="eyebrow" data-i18n="navigation.fleet">FLEET MANAGEMENT</p>
          <h1 data-i18n="fleet.title">Fleet Management</h1>
          <p data-i18n="fleet.subtitle">Manage vehicles, drivers, fuel, and maintenance</p>
        </div>
        <div class="header-actions">
          <button class="button secondary" onclick="exportFleetReport()">📥 Export Report</button>
          <button class="button primary" id="new-vehicle-btn">➕ Add Vehicle</button>
        </div>
      `;
    }

    if (contentGrid) {
      contentGrid.innerHTML = html;
      renderFleetContent();
    }
  }

  // عرض محتوى القسم المحدد
  function renderFleetContent() {
    const contentDiv = document.getElementById('fleet-content');
    if (!contentDiv) return;

    switch(state.currentView) {
      case 'vehicles':
        renderVehiclesList(contentDiv);
        break;
      case 'drivers':
        renderDriversList(contentDiv);
        break;
      case 'fuel':
        renderFuelLogs(contentDiv);
        break;
      case 'maintenance':
        renderMaintenanceLogs(contentDiv);
        break;
      case 'insurance':
        renderInsuranceRecords(contentDiv);
        break;
    }
  }

  // عرض قائمة المركبات
  function renderVehiclesList(container) {
    if (state.vehicles.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>🚗</span><p data-i18n="fleet.noVehicles">No vehicles registered yet</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="fleet.vehicleId">ID</th>
              <th data-i18n="fleet.makeModel">Make/Model</th>
              <th data-i18n="fleet.plateNumber">Plate Number</th>
              <th data-i18n="fleet.year">Year</th>
              <th data-i18n="fleet.status">Status</th>
              <th data-i18n="fleet.mileage">Mileage (km)</th>
              <th data-i18n="fleet.assignedDriver">Assigned Driver</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.vehicles.map(v => `
              <tr>
                <td>${v.id}</td>
                <td>${v.make} ${v.model}</td>
                <td>${v.plateNumber}</td>
                <td>${v.year}</td>
                <td><span class="status-badge ${v.status}">${translateStatus(v.status)}</span></td>
                <td>${v.mileage?.toLocaleString() || '0'}</td>
                <td>${getDriverName(v.driverId)}</td>
                <td>
                  <button class="icon-btn" onclick="editVehicle('${v.id}')" title="Edit">✏️</button>
                  <button class="icon-btn" onclick="viewVehicleDetails('${v.id}')" title="Details">👁️</button>
                  <button class="icon-btn" onclick="deleteVehicle('${v.id}')" title="Delete">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // عرض قائمة السائقين
  function renderDriversList(container) {
    if (state.drivers.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>👨‍✈️</span><p data-i18n="fleet.noDrivers">No drivers registered yet</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="fleet.driverId">ID</th>
              <th data-i18n="fleet.name">Name</th>
              <th data-i18n="fleet.licenseNumber">License Number</th>
              <th data-i18n="fleet.licenseExpiry">License Expiry</th>
              <th data-i18n="fleet.phone">Phone</th>
              <th data-i18n="fleet.status">Status</th>
              <th data-i18n="fleet.assignedVehicle">Assigned Vehicle</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.drivers.map(d => `
              <tr>
                <td>${d.id}</td>
                <td>${d.fullName}</td>
                <td>${d.licenseNumber}</td>
                <td>${formatDate(d.licenseExpiry)}</td>
                <td>${d.phone}</td>
                <td><span class="status-badge ${d.status}">${translateStatus(d.status)}</span></td>
                <td>${getVehicleInfo(d.assignedVehicleId)}</td>
                <td>
                  <button class="icon-btn" onclick="editDriver('${d.id}')" title="Edit">✏️</button>
                  <button class="icon-btn" onclick="deleteDriver('${d.id}')" title="Delete">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // عرض سجلات الوقود
  function renderFuelLogs(container) {
    if (state.fuelLogs.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>⛽</span><p data-i18n="fleet.noFuelLogs">No fuel logs recorded yet</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="common.date">Date</th>
              <th data-i18n="fleet.vehicle">Vehicle</th>
              <th data-i18n="fleet.driver">Driver</th>
              <th data-i18n="fleet.liters">Liters</th>
              <th data-i18n="fleet.cost">Cost</th>
              <th data-i18n="fleet.odometer">Odometer (km)</th>
              <th data-i18n="fleet.station">Station</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.fuelLogs.map(log => `
              <tr>
                <td>${formatDate(log.date)}</td>
                <td>${getVehiclePlate(log.vehicleId)}</td>
                <td>${getDriverName(log.driverId)}</td>
                <td>${log.liters}</td>
                <td>${formatCurrency(log.cost)}</td>
                <td>${log.odometer?.toLocaleString()}</td>
                <td>${log.station}</td>
                <td>
                  <button class="icon-btn" onclick="editFuelLog('${log.id}')" title="Edit">✏️</button>
                  <button class="icon-btn" onclick="deleteFuelLog('${log.id}')" title="Delete">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // عرض سجلات الصيانة
  function renderMaintenanceLogs(container) {
    if (state.maintenanceLogs.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>🔧</span><p data-i18n="fleet.noMaintenance">No maintenance records yet</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="common.date">Date</th>
              <th data-i18n="fleet.vehicle">Vehicle</th>
              <th data-i18n="fleet.serviceType">Service Type</th>
              <th data-i18n="fleet.description">Description</th>
              <th data-i18n="fleet.cost">Cost</th>
              <th data-i18n="fleet.provider">Provider</th>
              <th data-i18n="fleet.nextDue">Next Due</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.maintenanceLogs.map(log => `
              <tr>
                <td>${formatDate(log.date)}</td>
                <td>${getVehiclePlate(log.vehicleId)}</td>
                <td>${log.serviceType}</td>
                <td>${log.description}</td>
                <td>${formatCurrency(log.cost)}</td>
                <td>${log.provider}</td>
                <td>${formatDate(log.nextDue)}</td>
                <td>
                  <button class="icon-btn" onclick="editMaintenance('${log.id}')" title="Edit">✏️</button>
                  <button class="icon-btn" onclick="deleteMaintenance('${log.id}')" title="Delete">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // عرض سجلات التأمين
  function renderInsuranceRecords(container) {
    if (state.insuranceRecords.length === 0) {
      container.innerHTML = `<div class="empty-state"><span>📋</span><p data-i18n="fleet.noInsurance">No insurance records yet</p></div>`;
      return;
    }

    const html = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="fleet.vehicle">Vehicle</th>
              <th data-i18n="fleet.insuranceCompany">Insurance Company</th>
              <th data-i18n="fleet.policyNumber">Policy Number</th>
              <th data-i18n="fleet.startDate">Start Date</th>
              <th data-i18n="fleet.expiryDate">Expiry Date</th>
              <th data-i18n="fleet.premium">Premium</th>
              <th data-i18n="fleet.status">Status</th>
              <th data-i18n="actions.actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.insuranceRecords.map(rec => {
              const daysLeft = (new Date(rec.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
              const statusClass = daysLeft <= 30 ? 'expiring' : 'active';
              const statusText = daysLeft <= 30 ? 'Expiring Soon' : 'Active';
              
              return `
              <tr>
                <td>${getVehiclePlate(rec.vehicleId)}</td>
                <td>${rec.insuranceCompany}</td>
                <td>${rec.policyNumber}</td>
                <td>${formatDate(rec.startDate)}</td>
                <td>${formatDate(rec.expiryDate)}</td>
                <td>${formatCurrency(rec.premium)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                  <button class="icon-btn" onclick="editInsurance('${rec.id}')" title="Edit">✏️</button>
                  <button class="icon-btn" onclick="renewInsurance('${rec.id}')" title="Renew">🔄</button>
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // حساب متوسط استهلاك الوقود
  function calculateAvgFuelConsumption() {
    if (state.fuelLogs.length === 0) return 0;
    
    const recentLogs = state.fuelLogs.slice(0, 20);
    const totalLiters = recentLogs.reduce((sum, log) => sum + (log.liters || 0), 0);
    const totalDistance = recentLogs.reduce((sum, log, idx, arr) => {
      if (idx === 0) return 0;
      return sum + Math.abs((arr[idx - 1]?.odometer || 0) - (log.odometer || 0));
    }, 0);
    
    if (totalDistance === 0) return 0;
    return (totalLiters / totalDistance) * 100;
  }

  // دوال مساعدة
  function getDriverName(driverId) {
    const driver = state.drivers.find(d => d.id === driverId);
    return driver ? driver.fullName : '-';
  }

  function getVehiclePlate(vehicleId) {
    const vehicle = state.vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})` : '-';
  }

  function getVehicleInfo(vehicleId) {
    const vehicle = state.vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.plateNumber}` : 'Unassigned';
  }

  function translateStatus(status) {
    const statusMap = {
      'active': 'نشط',
      'inactive': 'غير نشط',
      'maintenance': 'صيانة',
      'out_of_service': 'خارج الخدمة',
      'expiring': 'قارب على الانتهاء'
    };
    return statusMap[status] || status;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG');
  }

  function formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  // دوال النموذج (يمكن توسيعها)
  function showVehicleForm() {
    showToast('نموذج إضافة مركبة - قيد التطوير', 'info');
  }

  function showDriverForm() {
    showToast('نموذج إضافة سائق - قيد التطوير', 'info');
  }

  function showFuelLogForm() {
    showToast('نموذج تسجيل وقود - قيد التطوير', 'info');
  }

  function showMaintenanceForm() {
    showToast('نموذج تسجيل صيانة - قيد التطوير', 'info');
  }

  // تصدير تقرير الأسطول
  async function exportFleetReport() {
    try {
      const reportData = {
        vehicles: state.vehicles,
        drivers: state.drivers,
        fuelLogs: state.fuelLogs,
        maintenanceLogs: state.maintenanceLogs,
        generatedAt: new Date().toISOString()
      };
      
      const csv = convertToCSV(reportData);
      downloadFile(csv, 'fleet_report.csv', 'text/csv');
      showToast('تم تصدير تقرير الأسطول بنجاح', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('فشل تصدير التقرير', 'error');
    }
  }

  function convertToCSV(data) {
    // تحويل بسيط للبيانات إلى CSV
    const headers = ['Entity', 'ID', 'Details'];
    const rows = [];
    
    data.vehicles.forEach(v => {
      rows.push(['Vehicle', v.id, `${v.make} ${v.model} - ${v.plateNumber}`]);
    });
    
    data.drivers.forEach(d => {
      rows.push(['Driver', d.id, `${d.fullName} - ${d.licenseNumber}`]);
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

  // دوال CRUD (وهمية للتطوير المستقبلي)
  window.editVehicle = (id) => showToast(`تعديل المركبة ${id}`, 'info');
  window.viewVehicleDetails = (id) => showToast(`تفاصيل المركبة ${id}`, 'info');
  window.deleteVehicle = (id) => showToast(`حذف المركبة ${id}`, 'warning');
  window.editDriver = (id) => showToast(`تعديل السائق ${id}`, 'info');
  window.deleteDriver = (id) => showToast(`حذف السائق ${id}`, 'warning');
  window.editFuelLog = (id) => showToast(`تعديل سجل الوقود ${id}`, 'info');
  window.deleteFuelLog = (id) => showToast(`حذف سجل الوقود ${id}`, 'warning');
  window.editMaintenance = (id) => showToast(`تعديل الصيانة ${id}`, 'info');
  window.deleteMaintenance = (id) => showToast(`حذف الصيانة ${id}`, 'warning');
  window.editInsurance = (id) => showToast(`تعديل التأمين ${id}`, 'info');
  window.renewInsurance = (id) => showToast(`تجديد التأمين ${id}`, 'success');

  return { init, renderFleetDashboard };
})();

// تهيئة الوحدة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#fleet') {
    FleetModule.init();
  }
});
