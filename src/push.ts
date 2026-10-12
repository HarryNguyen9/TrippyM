// ===== PUSH NOTIFICATION (Web Push qua FCM - chạy được trên iOS 16.4+ khi đã "Thêm vào MH chính") =====
// Dùng 1 Firebase project RIÊNG cho push (app tên "push"), không đụng tới project dữ liệu chính.
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, deleteToken, isSupported, onMessage } from "firebase/messaging";

const PUSH_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_PUSH_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_PUSH_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_PUSH_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_PUSH_FIREBASE_APP_ID,
};
const VAPID_KEY = import.meta.env.VITE_PUSH_VAPID_KEY;

const LS_ENABLED = "trippy_push_enabled";
const LS_TOKEN = "trippy_push_token";
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

let _messaging: ReturnType<typeof getMessaging> | null = null;
async function messaging() {
  if (_messaging) return _messaging;
  if (!(await isSupported())) return null;
  const app = getApps().find((a) => a.name === "push") || initializeApp(PUSH_FIREBASE_CONFIG, "push");
  _messaging = getMessaging(app);
  // App đang mở (foreground) thì FCM không hiện banner -> tự hiện qua service worker
  onMessage(_messaging, async (payload) => {
    const d = payload.data || {};
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(d.title || "Trippy", { body: d.body || "", icon: "/image.png", tag: d.tag || undefined, data: { url: d.url || "/" } });
  });
  return _messaging;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!PUSH_FIREBASE_CONFIG.apiKey || !VAPID_KEY) return "unconfigured";
  if (isIOS() && !isStandalone()) return "needs-install";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return Notification.permission === "granted" && ls.get(LS_ENABLED) === "1" && ls.get(LS_TOKEN) ? "on" : "off";
}

async function api(path: string, method: string, body: any) {
  const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Lỗi ${res.status}`);
  return json;
}

async function register(roomCode: string) {
  const token = ls.get(LS_TOKEN);
  if (!token) return;
  await api("/api/push/subscription", "POST", {
    token, roomCode, deviceId: getDeviceId(), prefs: getPushPrefs(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

// PHẢI gọi từ 1 thao tác bấm của người dùng (iOS yêu cầu user gesture để xin quyền)
export async function enablePush(roomCode: string) {
  const status = await getPushStatus();
  if (status === "unconfigured") throw new Error("Chưa cấu hình Firebase cho push (xem .env.example)");
  if (status === "needs-install") throw new Error("Trên iPhone: bấm Chia sẻ → Thêm vào MH chính, rồi mở app từ icon để bật thông báo");
  if (status === "unsupported") throw new Error("Trình duyệt này không hỗ trợ thông báo đẩy");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Bạn chưa cho phép thông báo. Vào Cài đặt iPhone → Thông báo → Trippy để bật lại");

  const m = await messaging();
  if (!m) throw new Error("Thiết bị không hỗ trợ thông báo đẩy");
  let token: string;
  try {
    token = await getToken(m, { vapidKey: VAPID_KEY, serviceWorkerRegistration: await navigator.serviceWorker.ready });
  } catch (e: any) {
    throw new Error(`[FCM] ${e?.code || ""} ${e?.message || e}`.trim());
  }
  if (!token) throw new Error("Không lấy được token thông báo");

  ls.set(LS_TOKEN, token);
  try {
    await register(roomCode);
  } catch (e: any) {
    ls.del(LS_TOKEN);
    throw new Error(`[Lưu đăng ký] ${e?.message || e}`);
  }
  ls.set(LS_ENABLED, "1");
}

export async function disablePush() {
  const token = ls.get(LS_TOKEN);
  ls.del(LS_ENABLED);
  ls.del(LS_TOKEN);
  if (!token) return;
  await api("/api/push/subscription", "DELETE", { token }).catch(() => {});
  const m = await messaging().catch(() => null);
  if (m) await deleteToken(m).catch(() => {});
}

export async function savePushPrefs(prefs: Partial<PushPrefs>, roomCode: string | null) {
  ls.set(LS_PREFS, JSON.stringify({ ...getPushPrefs(), ...prefs }));
  if (roomCode && (await getPushStatus()) === "on") await register(roomCode);
}

// Gọi khi vào phòng / đổi phòng (roomCode) hoặc rời phòng (null)
export async function syncPushRoom(roomCode: string | null) {
  if ((await getPushStatus()) !== "on") return;
  if (!roomCode) {
    const token = ls.get(LS_TOKEN);
    if (token) await api("/api/push/subscription", "DELETE", { token }).catch(() => {});
    return;
  }
  // Làm mới token mỗi lần mở app (FCM có thể xoay token)
  try {
    const m = await messaging();
    if (m) {
      const token = await getToken(m, { vapidKey: VAPID_KEY, serviceWorkerRegistration: await navigator.serviceWorker.ready });
      const old = ls.get(LS_TOKEN);
      if (token && token !== old) {
        if (old) await api("/api/push/subscription", "DELETE", { token: old }).catch(() => {});
        ls.set(LS_TOKEN, token);
      }
    }
  } catch (e) { console.warn("Push: refresh token lỗi", e); }
  await register(roomCode).catch((e) => console.warn("Push: đăng ký lỗi", e));
}

export async function sendTestPush() {
  return api("/api/push/notify", "POST", { type: "test", token: ls.get(LS_TOKEN) });
}

export async function sendManualPush(roomCode: string, editorKey: string, message: string) {
  return api("/api/push/notify", "POST", { type: "manual", roomCode, editorKey, message, deviceId: getDeviceId() });
}

// Gom các lần sửa liên tiếp thành 1 thông báo (server còn throttle thêm 5 phút/room)
let _changeTimer: ReturnType<typeof setTimeout> | null = null;
export function notifyTripChanged(roomCode: string, editorKey: string) {
  if (!PUSH_FIREBASE_CONFIG.apiKey) return;
  if (_changeTimer) clearTimeout(_changeTimer);
  _changeTimer = setTimeout(() => {
    _changeTimer = null;
    api("/api/push/notify", "POST", { type: "change", roomCode, editorKey, deviceId: getDeviceId() })
      .catch((e) => console.warn("Push: báo thay đổi lỗi", e));
  }, 15000);
}
