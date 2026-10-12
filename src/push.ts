// ===== PUSH NOTIFICATION (Web Push chuẩn + VAPID - chạy được trên iOS 16.4+ khi đã "Thêm vào MH chính") =====
// Thiết bị đăng ký thẳng với dịch vụ push của trình duyệt (Apple/Google/Mozilla) qua pushManager.subscribe,
// không dùng Firebase Messaging SDK. Server (api/push/*) lưu subscription và gửi bằng thư viện web-push.
import { describeTripChanges } from "./tripDiff";

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

export async function api(path: string, method: string, body?: any) {
  const res = await fetch(path, body === undefined ? { method } : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Lỗi ${res.status}`);
  return json;
}

// "Tôi là ai" của máy này trong room hiện tại (main.ts set khi vào phòng / khi người dùng chọn)
let _memberName = "";
export function setPushMember(name: string | null) { _memberName = name || ""; }

async function register(sub: PushSubscription, roomCode: string) {
  await api("/api/push/subscription", "POST", {
    subscription: sub.toJSON(), roomCode, deviceId: getDeviceId(), prefs: getPushPrefs(), memberName: _memberName,
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

export async function sendDebtReminders(roomCode: string, editorKey: string, targets: { member: string; amount: number }[]) {
  return api("/api/push/notify", "POST", { type: "debt", roomCode, editorKey, targets, deviceId: getDeviceId() });
}

// ===== THÔNG BÁO "CHUYẾN ĐI ĐƯỢC CẬP NHẬT" KÈM NỘI DUNG CỤ THỂ =====
// _baseline = dữ liệu lúc đã báo lần cuối (hoặc lúc nhận bản mới từ server). Khi editor sửa, sau 20s
// không sửa thêm sẽ so _baseline với dữ liệu hiện tại để ra danh sách thay đổi rồi gửi 1 thông báo.
let _baseline: string | null = null;
let _changeTimer: ReturnType<typeof setTimeout> | null = null;
const CHANGE_DEBOUNCE_MS = 20000;

// Gọi khi vào phòng và mỗi khi nhận dữ liệu mới từ người khác (để không báo nhầm thay đổi của họ)
export function setChangeBaseline(data: any) {
  if (_changeTimer || !data) return; // đang có thay đổi chờ gửi -> giữ mốc cũ
  _baseline = JSON.stringify(data);
}

export function notifyTripChanged(roomCode: string, editorKey: string, getData: () => any) {
  if (!VAPID_KEY || _baseline === null) return;
  if (_changeTimer) clearTimeout(_changeTimer);
  _changeTimer = setTimeout(() => flushTripChanges(roomCode, editorKey, getData), CHANGE_DEBOUNCE_MS);
}

async function flushTripChanges(roomCode: string, editorKey: string, getData: () => any) {
  _changeTimer = null;
  const data = getData();
  if (!data || data.trip?.code !== roomCode || _baseline === null) return;
  const snapshot = JSON.stringify(data);
  const changes = describeTripChanges(JSON.parse(_baseline), data);
  if (!changes.length) { _baseline = snapshot; return; }
  try {
    const r = await api("/api/push/notify", "POST", { type: "change", roomCode, editorKey, changes, deviceId: getDeviceId() });
    if (r.skipped === "throttled") {
      // Giữ mốc cũ để lần gửi sau gộp luôn các thay đổi này
      _changeTimer = setTimeout(() => flushTripChanges(roomCode, editorKey, getData), (r.retryAfterMs || 30000) + 1000);
      return;
    }
  } catch (e) {
    console.warn("Push: báo thay đổi lỗi", e);
  }
  _baseline = snapshot;
}

// ===== CHECK-IN TẠI ĐIỂM HẸN =====
export type CheckinEntry = { status: "arrived" | "otw"; at: number; lat?: number; lng?: number };

export async function getCheckins(room: string, act: string): Promise<Record<string, CheckinEntry>> {
  const r = await api(`/api/push/checkin?room=${encodeURIComponent(room)}&act=${encodeURIComponent(act)}`, "GET");
  return r.members || {};
}

export async function postCheckin(body: {
  room: string; act: string; actName: string; member: string; status?: "arrived" | "otw"; lat?: number; lng?: number;
}): Promise<Record<string, CheckinEntry>> {
  return (await api("/api/push/checkin", "POST", body)).members || {};
}

export async function nudgeLateMembers(room: string, act: string, actName: string, member: string) {
  return api("/api/push/checkin", "POST", { action: "nudge", room, act, actName, member });
}
