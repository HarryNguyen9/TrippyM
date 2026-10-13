# Trippy - Trip Management (bản TypeScript + Vite)

Đây là bản chuyển đổi từ `index.html` (HTML/JS thuần, ~9000 dòng) sang project
TypeScript dùng [Vite](https://vitejs.dev) làm bundler. **Toàn bộ tính năng được
giữ nguyên** — chỉ khác ở chỗ code được tổ chức thành project chuẩn, có build step,
type-check (lỏng), và tối ưu file khi build.

## Cấu trúc project

```
trippy-vite/
├── index.html          # Shell HTML (giữ nguyên toàn bộ markup gốc)
├── src/
│   ├── main.ts          # Toàn bộ logic app (được chuyển từ <script> gốc)
│   ├── style.css        # CSS (tách từ <style> gốc)
│   └── config.ts        # Config Firebase + Cloudinary
├── public/
│   ├── manifest.json     # PWA manifest
│   ├── sw.js              # Service worker
│   └── image.png          # Icon/logo
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Chạy thử ở máy local

```bash
npm install
npm run dev
```
Mở link hiện ra (thường là http://localhost:5173).

## Build ra bản production

```bash
npm run build
```
Kết quả nằm trong thư mục `dist/` — đây là bản đã tối ưu (minify, tree-shake).

Muốn xem thử bản build trước khi deploy:
```bash
npm run preview
```

## Deploy lên Vercel

Project này giờ Vercel sẽ **tự nhận diện là Vite project** (không cần chọn "Other"
như bản HTML thuần nữa):

1. Push toàn bộ thư mục này lên 1 GitHub repo (nhớ đừng push `node_modules`, đã có
   sẵn `.gitignore` lo việc này)
2. Vào https://vercel.com/new → Import Git Repository → chọn repo
3. Vercel tự động điền:
   - Framework Preset: **Vite**
   - Build Command: `vite build` (hoặc `npm run build`)
   - Output Directory: `dist`
4. Bấm Deploy

Hoặc deploy nhanh bằng CLI:
```bash
npm i -g vercel
vercel login
vercel --prod
```

## Những điều đã thay đổi so với bản HTML gốc (kỹ thuật)

1. **Cấu trúc file**: CSS, HTML, JS được tách ra 3 file riêng thay vì gộp
   chung 1 file `index.html`.
2. **Module hóa**: `config.js` giờ là ES module (`export const ...`), Firebase SDK
   được import qua npm package `firebase` thay vì load qua URL CDN dạng ESM.
3. **Vá lỗi phạm vi biến (quan trọng)**: bản gốc dùng cách gán
   `window.tenHam = () => {...}` rồi gọi lại bằng tên trần `tenHam(...)` ở chỗ
   khác. Cách này chạy được trong `<script>` thường (vì `window` chính là phạm vi
   toàn cục), nhưng **sẽ báo lỗi runtime** nếu chuyển thẳng sang ES module mà không
   sửa gì (vì module có phạm vi riêng, không tự động lộ ra ngoài qua tên trần).
   Mình đã tự động thêm khai báo `var` + gán kép (`window.tenHam = tenHam = ...`)
   cho ~158 hàm/biến bị ảnh hưởng để giữ đúng hành vi cũ.
4. **Thư viện ngoài** (`xlsx`, `html2canvas`, `canvas-confetti`): vẫn giữ nguyên
   load qua thẻ `<script>` CDN trong `index.html` (không đổi sang npm import) để
   tránh rủi ro thay đổi hành vi không cần thiết.
5. **TypeScript**: cấu hình `tsconfig.json` để **lỏng** (`strict: false`,
   `noImplicitAny: false`) vì code gốc chưa có type annotation nào. Chạy
   `npx tsc --noEmit` sẽ vẫn thấy một số cảnh báo type (ví dụ `Property 'value'
   does not exist on type 'HTMLElement'`) — đây chỉ là các gợi ý để làm chặt type
   dần dần sau này, **không ảnh hưởng đến việc build hay chạy app** (Vite dùng
   esbuild để build, esbuild chỉ dịch cú pháp chứ không kiểm tra type).
6. **Service Worker (`sw.js`)**: đã bỏ `./config.js` khỏi danh sách precache vì
   file này không còn tồn tại riêng sau khi build (được gộp vào bundle JS có tên
   dạng hash, ví dụ `assets/index-XXXX.js`). Muốn precache đầy đủ 100% offline cho
   cả file bundle, nên cân nhắc dùng thêm plugin `vite-plugin-pwa` (tự sinh service
   worker theo đúng tên file build ra mỗi lần).

## Đã test

Mình đã chạy `npm install` + `npm run build` thành công, output ra file JS/CSS
đã minify (~400KB JS, ~52KB CSS trước gzip). Tuy nhiên **chưa test được bằng
trình duyệt thật** (môi trường của mình không có browser), nên bạn nhớ chạy
`npm run dev` và test kỹ toàn bộ tính năng (đặc biệt các phần dùng Firebase
realtime, upload ảnh Cloudinary, export Excel/ảnh) trước khi thay thế hẳn bản
HTML cũ.

## 🔔 Push notification (iOS / Android / Desktop)

Dùng **Web Push chuẩn + VAPID** (thiết bị đăng ký thẳng với Apple/Google qua `pushManager.subscribe`,
server gửi bằng thư viện `web-push`). Firestore của 1 Firebase project **riêng** chỉ dùng để lưu
các thiết bị đã đăng ký. Gồm 3 loại thông báo:

| Loại | Kích hoạt |
|---|---|
| ✏️ Chuyến đi được cập nhật | Editor sửa dữ liệu → sau 15s gửi cho các máy khác trong room (tối đa 1 lần / 5 phút / room) |
| ⏰ Nhắc lịch trình | `/api/push/cron` chạy mỗi 5 phút, nhắc trước giờ hoạt động (10–120 phút, mỗi người tự chọn) |
| 📣 Gửi thủ công | Editor nhập tin nhắn trong Cài đặt → gửi cho cả nhóm |
| ☀️ Tóm tắt buổi sáng | 7:00 mỗi ngày có lịch: hoạt động hôm nay, thời tiết, số dư của bạn (cron) |
| 💰 Nhắc nợ | Editor bấm "Nhắc nợ" ở tab Thành viên → gửi riêng từng người đang nợ |
| 📍 Check-in điểm hẹn | Trang Hôm nay: Tôi tới rồi / Gửi vị trí / Nhắc người chưa tới |
| 🧾 Khoản chi chờ duyệt | Viewer "Gửi bill" → Editor nhận thông báo, duyệt trên trang Hôm nay |
| 🆘 SOS | Báo khẩn kèm vị trí cho cả nhóm, banner đỏ tới khi bấm "Mình ổn rồi" |

Các tính năng cá nhân (nhắc nợ, check-in, SOS, gửi bill) cần mỗi máy chọn **"Tôi là ai"** ở trang Hôm nay.
Dữ liệu nhóm (check-in, khoản chờ duyệt, SOS) lưu ở Firestore của project push, cron tự dọn khi hết hạn.

**Lưu ý iOS:** cần iOS/iPadOS **16.4+**, người dùng phải mở Safari → Chia sẻ → **Thêm vào MH chính**,
rồi mở Trippy từ icon đó và bấm "Bật thông báo" trong Cài đặt. Trong tab Safari thường sẽ không bật được.

### Biến môi trường trên Vercel

| Biến | Type | Giá trị |
|---|---|---|
| `VITE_PUSH_VAPID_KEY` | Config | VAPID public key (`npx web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | Secret | VAPID private key của cùng cặp |
| `FIREBASE_PUSH_SERVICE_ACCOUNT` | Secret | JSON service account của Firebase project push (đã bật Firestore) |
| `CRON_SECRET` | Secret | Chuỗi ngẫu nhiên |

Nhắc lịch trình: Vercel Hobby chỉ cho cron 1 lần/ngày, nên dùng https://cron-job.org (miễn phí):
URL `https://<domain>/api/push/cron`, mỗi 5 phút, header `Authorization: Bearer <CRON_SECRET>`.
Bản ghi chống nhắc trùng (`push_reminders_sent`) được cron tự dọn sau 7 ngày.

Code: `src/push.ts` (client), `public/sw.js` (nhận push), `api/push/*` (Vercel Functions).

## Đồng bộ không ghi đè, Hoàn tác, Chia sẻ lịch trình

- **Đồng bộ** (`src/syncMerge.ts`): mỗi lần lưu, app áp phần mình đã đổi lên bản mới nhất trên server bằng
  transaction (gộp 3 phía: bản gốc / bản trên máy / bản server), nên 2 Editor sửa cùng lúc không ghi đè nhau.
  Danh sách được ghép theo từng món (id / ngày / tên). Bản gốc lưu trong `localStorage.tripSyncBase`.
- **Hoàn tác**: sau khi xoá (khoản chi, hoạt động, ngày, thành viên, lần nạp quỹ, đồ mang, Trip Vault, file)
  có thanh "Hoàn tác" 6 giây; chỉ thêm lại món đã xoá, không đụng thay đổi khác.
- **Chia sẻ lịch trình** (`api/push/share.ts`): Editor tạo link `?itin=<mã ngẫu nhiên>` trong Lịch → ⋯.
  Người nhận chỉ xem ngày/giờ/địa điểm/ghi chú, không thấy tiền/thành viên, không vào được phòng. Tắt link là hết hiệu lực.
Local `npm run dev` không chạy được `/api` — dùng `vercel dev` để test đầy đủ.
