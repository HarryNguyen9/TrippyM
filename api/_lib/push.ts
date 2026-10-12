// ===== PUSH NOTIFICATION - SERVER HELPERS =====
// Chạy trên Vercel Serverless Functions (Node). Gửi bằng Web Push chuẩn (thư viện web-push + VAPID),
// không qua FCM SDK ở client -> iPhone đăng ký thẳng với Apple. Firestore của 1 Firebase project
// RIÊNG dùng để lưu các subscription, tách khỏi project chính chứa dữ liệu chuyến đi.
//
// Biến môi trường (Vercel -> Project Settings -> Environment Variables):
//   FIREBASE_PUSH_SERVICE_ACCOUNT  JSON service account của project push (dán nguyên JSON hoặc base64)
//   VITE_PUSH_VAPID_KEY            VAPID public key (client cũng dùng)
//   VAPID_PRIVATE_KEY              VAPID private key (bí mật)
//   VAPID_SUBJECT                  (tuỳ chọn) "mailto:email-cua-ban@gmail.com"
//   MAIN_FIREBASE_DB_URL           (tuỳ chọn) URL Realtime DB của project chính
//   CRON_SECRET                    chuỗi bí mật bảo vệ endpoint /api/push/cron
import { createHash } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import webpush from "web-push";

const DEFAULT_MAIN_DB_URL = "https://trip-app-8e382-default-rtdb.asia-southeast1.firebasedatabase.app/";

export const SUBS = "push_subscriptions";
export const ROOM_META = "push_room_meta";
export const REMINDERS_SENT = "push_reminders_sent";
export const CHECKINS = "group_checkins";
export const EXPENSES = "group_pending_expenses";
export const SOS = "group_sos";
export const CLAIMS = "group_member_claims"; // "Tôi là ai": mỗi thành viên chỉ 1 máy được chọn

function loadServiceAccount() {
  const raw = process.env.FIREBASE_PUSH_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Thiếu biến môi trường FIREBASE_PUSH_SERVICE_ACCOUNT");
  const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json);
}

function app() {
  return getApps()[0] || initializeApp({ credential: cert(loadServiceAccount()) });
}

export const db = () => getFirestore(app());
export { FieldValue };

let _vapidReady = false;
function vapid() {
  if (_vapidReady) return;
  const pub = process.env.VITE_PUSH_VAPID_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("Thiếu VITE_PUSH_VAPID_KEY / VAPID_PRIVATE_KEY");
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@trippy.app", pub, priv);
  _vapidReady = true;
}

export const hashId = (s: string) => createHash("sha256").update(s).digest("hex");

export interface SubscriptionDoc {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  deviceId: string;
  roomCode: string;
  memberName?: string; // "Tôi là ai" trong nhóm (để gửi thông báo riêng: nhắc nợ, nhắc tới điểm hẹn)
  isEditor?: boolean;   // máy đang giữ mã Editor đúng (để báo khi có khoản chi chờ duyệt)
  tz: string;
  prefs: { changes: boolean; reminders: boolean; leadMinutes: number; morning?: boolean };
}

// ---- Đọc dữ liệu chuyến đi từ Realtime DB của project chính (REST, giống client) ----
export async function fetchRoom(roomCode: string): Promise<any | null> {
  const base = (process.env.MAIN_FIREBASE_DB_URL || DEFAULT_MAIN_DB_URL).replace(/\/?$/, "/");
  const res = await fetch(`${base}rooms/${encodeURIComponent(roomCode)}.json`);
  if (!res.ok) throw new Error(`Không đọc được room (${res.status})`);
  return res.json();
}

// Editor hợp lệ khi room chưa đặt mã, hoặc mã gửi lên khớp trip.secretKey (giống verifyRole ở client)
export function isEditorKeyValid(room: any, editorKey: string | undefined) {
  const actual = room?.trip?.secretKey || "";
  return actual === "" || actual === (editorKey || "");
}

// ---- Gửi push tới danh sách subscription, tự xoá subscription đã chết (404/410) ----
export async function sendToSubs(
  subs: { id: string; data: SubscriptionDoc }[],
  msg: { title: string; body: string; url?: string; tag?: string }
) {
  if (!subs.length) return { sent: 0, failed: 0 };
  vapid();
  // sw.js tự hiển thị notification từ payload này (iOS bắt buộc mỗi push phải hiện thông báo)
  const payload = JSON.stringify({ title: msg.title, body: msg.body, url: msg.url || "/", tag: msg.tag || "" });

  let sent = 0, failed = 0;
  await Promise.all(subs.map(async ({ id, data }) => {
    try {
      await webpush.sendNotification({ endpoint: data.endpoint, keys: data.keys }, payload, { TTL: 86400, urgency: "high" });
      sent++;
    } catch (e: any) {
      failed++;
      if (e?.statusCode === 404 || e?.statusCode === 410) await db().collection(SUBS).doc(id).delete();
      else console.error("web-push lỗi", e?.statusCode, e?.body || e?.message);
    }
  }));
  return { sent, failed };
}

export async function subsForRoom(roomCode: string) {
  const snap = await db().collection(SUBS).where("roomCode", "==", roomCode).get();
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as SubscriptionDoc }));
}

// ---- Quy đổi giờ địa phương (theo IANA timezone) sang epoch ms ----
function tzOffsetMs(utcMs: number, tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(utcMs)).map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - utcMs;
}

export function zonedToEpoch(y: number, m: number, d: number, hh: number, mm: number, tz: string) {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  return guess - tzOffsetMs(guess, tz);
}

export function yearInTz(tz: string) {
  return +new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric" }).format(new Date());
}

// Danh sách hoạt động có giờ cụ thể của chuyến đi -> { id, name, location, startMs }
// Ngày lưu dạng "dd/mm" hoặc "dd/mm/yyyy", giờ dạng "HH:mm" (xem addDay / parseTripDateValue ở client)
export function listTimedActivities(room: any, tz: string) {
  const out: { id: string; name: string; location: string; time: string; startMs: number }[] = [];
  const fallbackYear = yearInTz(tz);
  for (const day of room?.days || []) {
    const [dd, mo, yyyy] = String(day?.date || "").split("/").map(Number);
    if (!dd || !mo) continue;
    for (const act of day.activities || []) {
      const m = /^(\d{1,2}):(\d{2})/.exec(act?.time || "");
      if (!act?.name || !m) continue;
      out.push({
        id: String(act.id || `${day.date}-${act.time}-${act.name}`),
        name: act.name,
        location: act.location || "",
        time: `${m[1].padStart(2, "0")}:${m[2]}`,
        startMs: zonedToEpoch(yyyy || fallbackYear, mo, dd, +m[1], +m[2], tz),
      });
    }
  }
  return out;
}

export function readBody(req: any) {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body || {};
}

export const vnd = (n: number) => Math.round(n || 0).toLocaleString("vi-VN") + "đ";

export const memberNames = (room: any) =>
  (Array.isArray(room?.members) ? room.members : Object.values(room?.members || {}))
    .map((m: any) => m?.name).filter(Boolean) as string[];

// Số dư từng người - CÙNG công thức với client (getMemberFinance / tab Thành viên):
// Đóng quỹ + Ứng hộ (không lấy từ quỹ) - Phần bị chia trong các khoản đã trả
export function memberBalances(room: any) {
  const list = (v: any) => (Array.isArray(v) ? v : Object.values(v || {})).filter(Boolean) as any[];
  const st: Record<string, { contributed: number; consumed: number; advanced: number; balance: number }> = {};
  for (const m of list(room?.members)) {
    const contributed = list(m.payments).reduce((s: number, v: any) => s + (Number(v) || 0), 0) || m.paid || 0;
    st[m.name] = { contributed, consumed: 0, advanced: 0, balance: 0 };
  }
  for (const p of list(room?.payments)) {
    if (typeof p !== "object" || !p.isPaid || p.isEstimate) continue;
    const parts = list(p.participants);
    if (parts.length) {
      const split = Math.round(p.amount / parts.length);
      for (const n of parts) if (st[n]) st[n].consumed += split;
    }
    if (p.multiPayers) { for (const mp of list(p.multiPayers)) if (!mp.fromFund && st[mp.name]) st[mp.name].advanced += mp.amount; }
    else if (!p.fromFund && st[p.payer]) st[p.payer].advanced += p.amount;
  }
  for (const v of Object.values(st)) v.balance = v.contributed + v.advanced - v.consumed;
  return st;
}

// Ngày giờ hiện tại theo múi giờ của thiết bị
export function localNow(tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date()).map((x) => [x.type, x.value])
  );
  return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour, mm: +p.minute };
}

// Dự báo thời tiết 1 ngày cho địa điểm chuyến đi (Open-Meteo, giống client)
export async function weatherFor(room: any, ymd: string) {
  try {
    let lat = room?.trip?.lat, lon = room?.trip?.lon;
    const city = room?.trip?.location;
    if ((!lat || !lon) && city) {
      const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=vi&format=json`)).json();
      if (g.results?.length) { lat = g.results[0].latitude; lon = g.results[0].longitude; }
    }
    if (!lat || !lon) return null;
    const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${ymd}&end_date=${ymd}`)).json();
    if (!w.daily?.time?.length) return null;
    return {
      tMin: Math.round(w.daily.temperature_2m_min[0]),
      tMax: Math.round(w.daily.temperature_2m_max[0]),
      rain: w.daily.precipitation_probability_max[0] ?? 0,
    };
  } catch {
    return null;
  }
}
