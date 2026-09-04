/**
 * FINOVATE ERP X - Documents Management Module (Phase 19)
 * إدارة المستندات - تكامل مع Google Drive
 */

const DocumentsModule = (() => {
  // حالة الوحدة
  let state = {
    folders: [],
    documents: [],
    currentFolder: null,
    uploadQueue: []
  };

  // تهيئة الوحدة
  function init() {
    loadDocumentsData();
    setupEventListeners();
    renderDocumentsDashboard();
  }

  // تحميل بيانات المستندات
  async function loadDocumentsData() {
    try {
      const [folders, documents] = await Promise.all([
        DatabaseService.query('SELECT * FROM DocumentFolders WHERE isActive = true'),
        DatabaseService.query('SELECT * FROM Documents ORDER BY uploadDate DESC')
      ]);
      
      state.folders = folders || [];
      state.documents = documents || [];
    } catch (error) {
      console.error('Error loading documents data:', error);
      showToast('فشل تحميل بيانات المستندات', 'error');
    }
  }

  // إعداد مستمعي الأحداث
  function setupEventListeners() {
    document.addEventListener('click', handleNavigation);
    document.getElementById('upload-doc-btn')?.addEventListener('click', () => showUploadDialog());
    document.getElementById('new-folder-btn')?.addEventListener('click', () => showNewFolderDialog());
    
    // drag & drop
    const dropZone = document.getElementById('documents-drop-zone');
    if (dropZone) {
      dropZone.addEventListener('dragover', handleDragOver);
      dropZone.addEventListener('dragleave', handleDragLeave);
      dropZone.addEventListener('drop', handleDrop);
    }
  }

  // التنقل بين الأقسام
  function handleNavigation(e) {
    const target = e.target.closest('[data-doc-view]');
    if (!target) return;
    
    const view = target.dataset.docView;
    if (view === 'all' || view === 'recent' || view === 'shared') {
      state.currentFolder = null;
      renderDocumentsContent(view);
    }
    
    document.querySelectorAll('[data-doc-view]').forEach(btn => btn.classList.remove('active'));
    target.classList.add('active');
  }

  // عرض لوحة تحكم المستندات
  function renderDocumentsDashboard() {
    const totalDocs = state.documents.length;
    const recentDocs = state.documents.filter(d => {
      const daysDiff = (new Date() - new Date(d.uploadDate)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    const totalSize = state.documents.reduce((sum, d) => sum + (d.size || 0), 0);
    const sharedDocs = state.documents.filter(d => d.isShared).length;

    const html = `
      <div class="documents-dashboard">
        <div class="metrics-grid">
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon blue">📁</span><span data-i18n="docs.totalDocuments">Total Documents</span></div>
            <strong>${totalDocs}</strong>
            <p data-i18n="docs.stored">Stored in Drive</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon green">🕒</span><span data-i18n="docs.recent">Recent (7 days)</span></div>
            <strong>${recentDocs}</strong>
            <p data-i18n="docs.uploaded">Uploaded</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon orange">💾</span><span data-i18n="docs.totalSize">Total Size</span></div>
            <strong>${formatSize(totalSize)}</strong>
            <p data-i18n="docs.used">Used</p>
          </article>
          <article class="metric-card">
            <div class="metric-label"><span class="metric-icon violet">🤝</span><span data-i18n="docs.shared">Shared Documents</span></div>
            <strong>${sharedDocs}</strong>
            <p data-i18n="docs.withOthers">With others</p>
          </article>
        </div>

        <div class="documents-toolbar">
          <div class="documents-tabs">
            <button class="tab-btn active" data-doc-view="all" data-i18n="docs.all">All Documents</button>
            <button class="tab-btn" data-doc-view="recent" data-i18n="docs.recent">Recent</button>
            <button class="tab-btn" data-doc-view="shared" data-i18n="docs.shared">Shared</button>
          </div>
          <div class="documents-actions">
            <button class="button secondary" id="new-folder-btn">📁 New Folder</button>
            <button class="button primary" id="upload-doc-btn">⬆️ Upload</button>
          </div>
        </div>

        <div id="documents-drop-zone" class="documents-drop-zone">
          <div id="documents-content" class="documents-content"></div>
        </div>
      </div>
    `;

    const mainContent = document.querySelector('main');
    const pageHeader = mainContent.querySelector('.page-header');
    const contentGrid = mainContent.querySelector('.content-grid');
    
    if (pageHeader) {
      pageHeader.innerHTML = `
        <div>
          <p class="eyebrow" data-i18n="navigation.documents">DOCUMENTS MANAGEMENT</p>
          <h1 data-i18n="docs.title">Documents Management</h1>
          <p data-i18n="docs.subtitle">Manage files and folders integrated with Google Drive</p>
        </div>
      `;
    }

    if (contentGrid) {
      contentGrid.innerHTML = html;
      renderDocumentsContent('all');
    }
  }

  // عرض محتوى المستندات
  function renderDocumentsContent(view) {
    const contentDiv = document.getElementById('documents-content');
    if (!contentDiv) return;

    let filteredDocs = state.documents;
    
    switch(view) {
      case 'recent':
        filteredDocs = state.documents.filter(d => {
          const daysDiff = (new Date() - new Date(d.uploadDate)) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7;
        });
        break;
      case 'shared':
        filteredDocs = state.documents.filter(d => d.isShared);
        break;
    }

    if (filteredDocs.length === 0 && state.folders.length === 0) {
      contentDiv.innerHTML = `
        <div class="empty-state">
          <span>📁</span>
          <p data-i18n="docs.noDocuments">No documents uploaded yet</p>
          <button class="button primary" onclick="showUploadDialog()">⬆️ Upload First Document</button>
        </div>
      `;
      return;
    }

    const html = `
      ${state.folders.length > 0 ? `
        <div class="folders-section">
          <h3 data-i18n="docs.folders">Folders</h3>
          <div class="folders-grid">
            ${state.folders.map(folder => `
              <div class="folder-card" onclick="openFolder('${folder.id}')">
                <span class="folder-icon">📁</span>
                <span class="folder-name">${folder.name}</span>
                <small>${folder.documentCount || 0} documents</small>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="documents-section">
        <h3 data-i18n="docs.files">Files</h3>
        <div class="documents-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th data-i18n="docs.name">Name</th>
                <th data-i18n="docs.type">Type</th>
                <th data-i18n="docs.size">Size</th>
                <th data-i18n="docs.uploadDate">Upload Date</th>
                <th data-i18n="docs.uploadedBy">Uploaded By</th>
                <th data-i18n="docs.status">Status</th>
                <th data-i18n="actions.actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDocs.map(doc => `
                <tr>
                  <td>
                    <span class="file-icon">${getFileIcon(doc.type)}</span>
                    ${doc.name}
                  </td>
                  <td>${doc.type.toUpperCase()}</td>
                  <td>${formatSize(doc.size)}</td>
                  <td>${formatDate(doc.uploadDate)}</td>
                  <td>${doc.uploadedBy || '-'}</td>
                  <td><span class="status-badge ${doc.isShared ? 'shared' : 'private'}">${doc.isShared ? 'Shared' : 'Private'}</span></td>
                  <td>
                    <button class="icon-btn" onclick="downloadDocument('${doc.id}')" title="Download">⬇️</button>
                    <button class="icon-btn" onclick="previewDocument('${doc.id}')" title="Preview">👁️</button>
                    <button class="icon-btn" onclick="shareDocument('${doc.id}')" title="Share">🤝</button>
                    <button class="icon-btn" onclick="deleteDocument('${doc.id}')" title="Delete">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    contentDiv.innerHTML = html;
  }

  // معالجة السحب والإفلات
  function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    handleFilesUpload(files);
  }

  // معالجة رفع الملفات
  function handleFilesUpload(files) {
    Array.from(files).forEach(file => {
      addToUploadQueue(file);
    });
    processUploadQueue();
  }

  function addToUploadQueue(file) {
    state.uploadQueue.push({
      file: file,
      status: 'pending',
      progress: 0
    });
  }

  async function processUploadQueue() {
    for (const item of state.uploadQueue) {
      if (item.status === 'pending') {
        item.status = 'uploading';
        await simulateUpload(item);
      }
    }
    showToast('All uploads completed', 'success');
    loadDocumentsData();
    renderDocumentsContent(state.currentView || 'all');
  }

  function simulateUpload(item) {
    return new Promise(resolve => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        item.progress = progress;
        if (progress >= 100) {
          clearInterval(interval);
          item.status = 'completed';
          resolve();
        }
      }, 100);
    });
  }

  // دوال مساعدة
  function getFileIcon(type) {
    const icons = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'ppt': '📽️',
      'pptx': '📽️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'zip': '📦',
      'rar': '📦'
    };
    return icons[type?.toLowerCase()] || '📄';
  }

  function formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG');
  }

  // دوال النماذج
  window.showUploadDialog = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => handleFilesUpload(e.target.files);
    input.click();
  };

  window.showNewFolderDialog = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      showToast(`Creating folder: ${folderName}`, 'info');
    }
  };

  window.openFolder = (id) => {
    showToast(`Opening folder: ${id}`, 'info');
  };

  window.downloadDocument = (id) => {
    showToast(`Downloading document: ${id}`, 'info');
  };

  window.previewDocument = (id) => {
    showToast(`Previewing document: ${id}`, 'info');
  };

  window.shareDocument = (id) => {
    showToast(`Sharing document: ${id}`, 'info');
  };

  window.deleteDocument = (id) => {
    if (confirm('Are you sure you want to delete this document?')) {
      showToast(`Deleting document: ${id}`, 'warning');
    }
  };

  return { init, renderDocumentsDashboard };
})();

// تهيئة الوحدة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#documents') {
    DocumentsModule.init();
  }
});
