// ===== PUSH NOTIFICATION (Web Push chuẩn + VAPID - chạy được trên iOS 16.4+ khi đã "Thêm vào MH chính") =====
// Thiết bị đăng ký thẳng với dịch vụ push của trình duyệt (Apple/Google/Mozilla) qua pushManager.subscribe,
// không dùng Firebase Messaging SDK. Server (api/push/*) lưu subscription và gửi bằng thư viện web-push.
const VAPID_KEY = (import.meta.env.VITE_PUSH_VAPID_KEY || "").trim();

const LS_ENABLED = "trippy_push_enabled";
const LS_PREFS = "trippy_push_prefs";
const LS_DEVICE = "trippy_device_id";

export interface PushPrefs { changes: boolean; reminders: boolean; leadMinutes: number }

export type PushStatus = "unconfigured" | "unsupported" | "needs-install" | "denied" | "on" | "off";

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { localStorage.removeItem(k); } catch {} },
};

export function getDeviceId() {
  let id = ls.get(LS_DEVICE);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    ls.set(LS_DEVICE, id);
  }
  return id;
}

export function getPushPrefs(): PushPrefs {
  try { return { changes: true, reminders: true, leadMinutes: 30, ...JSON.parse(ls.get(LS_PREFS) || "{}") }; }
  catch { return { changes: true, reminders: true, leadMinutes: 30 }; }
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const b64uToBytes = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function currentSub(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!VAPID_KEY) return "unconfigured";
  if (!pushSupported()) return isIOS() && !isStandalone() ? "needs-install" : "unsupported";
  if (isIOS() && !isStandalone()) return "needs-install";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted" || ls.get(LS_ENABLED) !== "1") return "off";
  return (await currentSub().catch(() => null)) ? "on" : "off";
}

async function api(path: string, method: string, body: any) {
  const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Lỗi ${res.status}`);
  return json;
}

async function register(sub: PushSubscription, roomCode: string) {
  await api("/api/push/subscription", "POST", {
    subscription: sub.toJSON(), roomCode, deviceId: getDeviceId(), prefs: getPushPrefs(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

// PHẢI gọi từ 1 thao tác bấm của người dùng (iOS yêu cầu user gesture để xin quyền)
export async function enablePush(roomCode: string) {
  const status = await getPushStatus();
  if (status === "unconfigured") throw new Error("Chưa cấu hình VAPID key cho push (xem .env.example)");
  if (status === "needs-install") throw new Error("Trên iPhone: bấm Chia sẻ → Thêm vào MH chính, rồi mở app từ icon để bật thông báo");
  if (status === "unsupported") throw new Error("Trình duyệt này không hỗ trợ thông báo đẩy");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Bạn chưa cho phép thông báo. Vào Cài đặt iPhone → Thông báo → Trippy để bật lại");

  let sub: PushSubscription;
  try {
    const reg = await navigator.serviceWorker.ready;
    sub = (await reg.pushManager.getSubscription())
      || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(VAPID_KEY) });
  } catch (e: any) {
    throw new Error(`[Đăng ký push] ${e?.name || ""} ${e?.message || e}`.trim());
  }

  try {
    await register(sub, roomCode);
  } catch (e: any) {
    throw new Error(`[Lưu đăng ký] ${e?.message || e}`);
  }
  ls.set(LS_ENABLED, "1");
}

export async function disablePush() {
  ls.del(LS_ENABLED);
  const sub = await currentSub().catch(() => null);
  if (!sub) return;
  await api("/api/push/subscription", "DELETE", { subscription: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export async function savePushPrefs(prefs: Partial<PushPrefs>, roomCode: string | null) {
  ls.set(LS_PREFS, JSON.stringify({ ...getPushPrefs(), ...prefs }));
  const sub = await currentSub().catch(() => null);
  if (roomCode && sub && (await getPushStatus()) === "on") await register(sub, roomCode);
}

// Gọi khi vào phòng / đổi phòng (roomCode) hoặc rời phòng (null)
export async function syncPushRoom(roomCode: string | null) {
  if ((await getPushStatus()) !== "on") return;
  const sub = await currentSub().catch(() => null);
  if (!sub) return;
  if (!roomCode) {
    await api("/api/push/subscription", "DELETE", { subscription: { endpoint: sub.endpoint } }).catch(() => {});
    return;
  }
  await register(sub, roomCode).catch((e) => console.warn("Push: đăng ký lỗi", e));
}

export async function sendTestPush() {
  const sub = await currentSub();
  if (!sub) throw new Error("Thiết bị chưa bật thông báo");
  return api("/api/push/notify", "POST", { type: "test", endpoint: sub.endpoint });
}

export async function sendManualPush(roomCode: string, editorKey: string, message: string) {
  return api("/api/push/notify", "POST", { type: "manual", roomCode, editorKey, message, deviceId: getDeviceId() });
}

// Gom các lần sửa liên tiếp thành 1 thông báo (server còn throttle thêm 5 phút/room)
let _changeTimer: ReturnType<typeof setTimeout> | null = null;
export function notifyTripChanged(roomCode: string, editorKey: string) {
  if (!VAPID_KEY) return;
  if (_changeTimer) clearTimeout(_changeTimer);
  _changeTimer = setTimeout(() => {
    _changeTimer = null;
    api("/api/push/notify", "POST", { type: "change", roomCode, editorKey, deviceId: getDeviceId() })
      .catch((e) => console.warn("Push: báo thay đổi lỗi", e));
  }, 15000);
}
