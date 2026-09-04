/**
 * FINOVATE ERP X - Service Worker
 * Phase 24: PWA & Offline Support
 * Developer: Ahmed Mostafa Ibrahim
 * Brand: FINOVATE – AHMED EG
 */

const CACHE_NAME = 'finovate-erp-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/manifest.json',
  '/css/core.css',
  '/css/auth.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/localization.js',
  '/js/api.js',
  '/js/database.js',
  '/js/permissions.js',
  '/js/companies.js',
  '/js/customers.js',
  '/js/suppliers.js',
  '/js/products.js',
  '/js/sales.js',
  '/js/pos.js',
  '/js/purchasing.js',
  '/js/accounting.js',
  '/js/cash-bank.js',
  '/js/hr.js',
  '/js/assets.js',
  '/js/crm.js',
  '/js/manufacturing.js',
  '/js/fleet.js',
  '/js/projects.js',
  '/js/budgeting.js',
  '/js/reports.js',
  '/js/documents.js',
  '/js/backup.js',
  '/js/audit.js',
  '/js/ai-assistant.js'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete, skipping waiting');
        return self.skipWaiting();
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete, claiming clients');
        return self.clients.claim();
      })
  );
});

// اعتراض الطلبات
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // استراتيجية الشبكة أولاً ثم التخزين المؤقت للـ API
  if (url.pathname.includes('/api/') || request.url.includes('googleapis.com')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // استراتيجية التخزين المؤقت أولاً ثم الشبكة للأصول الثابتة
  if (request.method === 'GET') {
    event.respondWith(cacheFirst(request));
  }
});

// استراتيجية الشبكة أولاً
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline - No cached data available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// استراتيجية التخزين المؤقت أولاً
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('Offline - Resource not cached', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// التعامل مع الرسائل من الصفحة الرئيسية
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    // تحديث البيانات المخزنة عند توفر اتصال
    console.log('[SW] Received cache update request');
  }
});

// إشعارات الخلفية (اختياري)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[SW] Service Worker loaded');
