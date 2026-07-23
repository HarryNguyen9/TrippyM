const CACHE_NAME = 'trippy-v6'; // Đổi số này để ép máy cập nhật bản mới
const assets = ['./', './index.html', './manifest.json', './config.js', './image.png'];

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