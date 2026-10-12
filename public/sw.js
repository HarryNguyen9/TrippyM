const CACHE_NAME = 'trippy-v9'; // Đổi số này để ép máy cập nhật bản mới
// LƯU Ý: sau khi build bằng Vite, file JS/CSS chính sẽ có tên dạng
// /assets/main-[hash].js (hash đổi mỗi lần build) nên không thể liệt kê cứng
// ở đây. File này vẫn được cache tự động ở lần đầu người dùng mở app
// (nhờ browser cache HTTP), nhưng sẽ KHÔNG được precache offline ngay từ
// install như trước. Nếu cần precache đầy đủ 100% offline-first, nên dùng
// plugin "vite-plugin-pwa" để tự sinh sw.js với danh sách file đã build.
const assets = ['./', './index.html', './manifest.json', './image.png'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(assets)));
    self.skipWaiting(); // Ép Service worker mới giành quyền kiểm soát ngay
});

self.addEventListener('activate', (e) => {
    // Tự động dọn dẹp các cache phiên bản cũ
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Không can thiệp request POST/PUT... (API push, Firebase) để tránh trả về cache rỗng
    if (e.request.method !== 'GET') return;

    // ĐẶC TRỊ LỖI SAFARI REDIRECTIONS:
    // Với các yêu cầu load trang (navigate), luôn ưu tiên lấy trực tiếp từ mạng (mới nhất).
    // Chỉ khi rớt mạng (catch) thì mới lôi file index.html trong cache ra dùng.
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request).catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Với ảnh, CSS, JS tĩnh... thì ưu tiên lấy trong cache cho nhanh
    e.respondWith(
        caches.match(e.request).then((cachedRes) => {
            return cachedRes || fetch(e.request).catch(() => {});
        })
    );
});

// ===== PUSH NOTIFICATION (Web Push chuẩn, gửi từ api/push/* bằng thư viện web-push) =====
// Payload: { title, body, url, tag }.
// iOS BẮT BUỘC mỗi push phải hiện 1 notification, nếu không Safari sẽ thu hồi quyền.
self.addEventListener('push', (e) => {
    let payload = {};
    try { payload = e.data ? e.data.json() : {}; } catch (_) { payload = { data: { body: e.data && e.data.text() } }; }
    const d = Object.assign({}, payload, payload.notification, payload.data);

    e.waitUntil(self.registration.showNotification(d.title || 'Trippy', {
        body: d.body || '',
        icon: './image.png',
        badge: './image.png',
        tag: d.tag || undefined,
        data: { url: d.url || './' },
    }));
});

self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    const url = new URL((e.notification.data && e.notification.data.url) || './', self.location.origin).href;
    // Link ngoài app (VD: vị trí SOS trên Google Maps) -> mở thẳng link đó
    if (!url.startsWith(self.location.origin)) {
        e.waitUntil(self.clients.openWindow(url));
        return;
    }
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            const client = list.find((c) => c.url.startsWith(self.location.origin));
            if (client) return client.focus();
            return self.clients.openWindow(url);
        })
    );
});
