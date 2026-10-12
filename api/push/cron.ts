// GET /api/push/cron  (Authorization: Bearer <CRON_SECRET>  hoặc  ?secret=<CRON_SECRET>)
// Gọi định kỳ mỗi 5 phút (cron-job.org / Vercel Cron bản Pro) để nhắc trước các hoạt động sắp diễn ra.
// Mỗi (thiết bị, hoạt động, giờ bắt đầu) chỉ nhắc 1 lần nhờ bản ghi trong push_reminders_sent.
// Ngoài ra gửi "tóm tắt buổi sáng" lúc 7:00-7:29 (giờ của thiết bị) trong các ngày có lịch.
import {
  CHECKINS, db, EXPENSES, FieldValue, fetchRoom, hashId, listTimedActivities, localNow, memberBalances,
  REMINDERS_SENT, sendToSubs, SOS, SUBS, SubscriptionDoc, vnd, weatherFor,
} from "../_lib/push.js";

const BRIEF_HOUR = 7;

// Tìm ngày hôm nay trong lịch trình (ngày lưu dạng "dd/mm" hoặc "dd/mm/yyyy")
function todayInTrip(room: any, y: number, m: number, d: number) {
  const days = (Array.isArray(room?.days) ? room.days : Object.values(room?.days || {})).filter(Boolean) as any[];
  const parsed = days
    .map((day) => {
      const [dd, mo, yy] = String(day.date || "").split("/").map(Number);
      return { day, key: (yy || y) * 10000 + mo * 100 + dd };
    })
    .filter((x) => x.key > 0)
    .sort((a, b) => a.key - b.key);
  const idx = parsed.findIndex((x) => x.key === y * 10000 + m * 100 + d);
  return idx >= 0 ? { day: parsed[idx].day, index: idx } : null;
}

async function morningBrief(room: any, sub: { id: string; data: SubscriptionDoc }, weatherCache: Map<string, any>) {
  if (sub.data.prefs?.morning === false || room?.trip?.isFinished) return 0;
  const tz = sub.data.tz || "Asia/Ho_Chi_Minh";
  const t = localNow(tz);
  if (t.hh !== BRIEF_HOUR || t.mm >= 30) return 0;
  const today = todayInTrip(room, t.y, t.m, t.d);
  if (!today) return 0;

  const ymd = `${t.y}-${String(t.m).padStart(2, "0")}-${String(t.d).padStart(2, "0")}`;
  try {
    await db().collection(REMINDERS_SENT).doc(hashId(`brief|${sub.id}|${ymd}`)).create({
      roomCode: sub.data.roomCode, at: FieldValue.serverTimestamp(), expireAt: new Date(Date.now() + 2 * 864e5),
    });
  } catch { return 0; } // đã gửi hôm nay

  const acts = ((Array.isArray(today.day.activities) ? today.day.activities : Object.values(today.day.activities || {})) as any[])
    .filter((a) => a?.name)
    .sort((a, b) => String(a.time || "99").localeCompare(String(b.time || "99")));
  const lines: string[] = [];
  const first = acts.find((a) => a.time) || acts[0];
  lines.push(acts.length
    ? `📅 ${acts.length} hoạt động · bắt đầu ${first.time ? first.time + " " : ""}${first.name}`
    : "📅 Hôm nay chưa có lịch cụ thể, tự do khám phá!");

  if (!weatherCache.has(ymd)) weatherCache.set(ymd, await weatherFor(room, ymd));
  const w = weatherCache.get(ymd);
  if (w) lines.push(`🌤 ${w.tMin}–${w.tMax}°C, khả năng mưa ${w.rain}%${w.rain >= 50 ? " · nhớ mang áo mưa ☔" : ""}`);

  const me = sub.data.memberName;
  const bal = me ? memberBalances(room)[me] : null;
  if (bal) {
    if (bal.balance < 0) lines.push(`💰 Bạn đang nợ nhóm ${vnd(-bal.balance)}`);
    else lines.push(`💰 Bạn đã tiêu ${vnd(bal.consumed)}, còn dư ${vnd(bal.balance)}`);
  }

  const r = await sendToSubs([sub], {
    title: `☀️ Chào buổi sáng${me ? " " + me : ""} · Day ${today.index + 1}`,
    body: lines.join("\n"),
    tag: `brief-${ymd}`,
  });
  return r.sent;
}

export default async function handler(req: any, res: any) {
  const secret = process.env.CRON_SECRET;
  const given = (req.headers.authorization || "").replace(/^Bearer\s+/i, "") || req.query?.secret;
  if (!secret || given !== secret) return res.status(401).json({ error: "Unauthorized" });

  try {
    const now = Date.now();
    const snap = await db().collection(SUBS).get();

    const byRoom = new Map<string, { id: string; data: SubscriptionDoc }[]>();
    for (const d of snap.docs) {
      const data = d.data() as SubscriptionDoc;
      if (!byRoom.has(data.roomCode)) byRoom.set(data.roomCode, []);
      byRoom.get(data.roomCode)!.push({ id: d.id, data });
    }

    let sent = 0;
    for (const [roomCode, subs] of byRoom) {
      let room: any;
      try { room = await fetchRoom(roomCode); } catch (e) { console.error(roomCode, e); continue; }
      if (!room) continue;
      const tripName = room.trip?.name || "Chuyến đi";
      const weatherCache = new Map<string, any>();

      for (const sub of subs) {
        try { sent += await morningBrief(room, sub, weatherCache); } catch (e) { console.error("brief", e); }
        if (sub.data.prefs?.reminders === false) continue;

        const leadMs = (sub.data.prefs.leadMinutes || 30) * 60 * 1000;
        const due = listTimedActivities(room, sub.data.tz)
          .filter((a) => a.startMs > now && a.startMs - now <= leadMs);

        for (const act of due) {
          // create() lỗi nếu doc đã tồn tại -> đảm bảo không nhắc trùng
          const markId = hashId(`${sub.id}|${roomCode}|${act.id}|${act.startMs}`);
          try {
            await db().collection(REMINDERS_SENT).doc(markId).create({
              roomCode, at: FieldValue.serverTimestamp(), expireAt: new Date(act.startMs + 7 * 864e5),
            });
          } catch { continue; }

          const mins = Math.max(1, Math.round((act.startMs - now) / 60000));
          const r = await sendToSubs([sub], {
            title: `⏰ ${act.time} · ${act.name}`,
            body: `${tripName}: còn ${mins} phút nữa${act.location ? ` · 📍 ${act.location}` : ""}`,
            tag: `remind-${act.id}`,
          });
          sent += r.sent;
        }
      }
    }
    // Dọn bản ghi đã hết hạn (thay cho TTL policy - TTL cần bật billing)
    let cleaned = 0;
    for (const col of [REMINDERS_SENT, CHECKINS, EXPENSES, SOS]) {
      const expired = await db().collection(col).where("expireAt", "<", new Date()).limit(300).get();
      if (expired.empty) continue;
      const batch = db().batch();
      expired.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      cleaned += expired.size;
    }

    return res.status(200).json({ ok: true, rooms: byRoom.size, sent, cleaned });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
