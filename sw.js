/** FINOVATE ERP X - Service Worker */
const CACHE_NAME = 'finovate-erp-v2';
const STATIC_ASSETS = [
  '/','/index.html','/login.html','/manifest.json','/config.js',
  '/css/core.css','/css/auth.css','/js/app.js','/js/auth.js','/js/localization.js','/js/api.js',
  '/js/database.js','/js/permissions.js','/js/companies.js','/js/customers.js','/js/suppliers.js',
  '/js/products.js','/js/sales.js','/js/pos.js','/js/purchasing.js','/js/accounting.js',
  '/js/cash-bank.js','/js/hr.js','/js/assets.js','/js/crm.js','/js/manufacturing.js','/js/fleet.js',
  '/js/projects.js','/js/budgeting.js','/js/reports.js','/js/documents.js','/js/backup.js','/js/audit.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.hostname.includes('google')) return;
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    return response;
  }).catch(() => caches.match(request).then((cached) => cached || new Response('Offline', { status: 503 }))));
});
