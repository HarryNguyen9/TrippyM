// GET /api/push/cron  (Authorization: Bearer <CRON_SECRET>  hoặc  ?secret=<CRON_SECRET>)
// Gọi định kỳ mỗi 5 phút (cron-job.org / Vercel Cron bản Pro) để nhắc trước các hoạt động sắp diễn ra.
// Mỗi (thiết bị, hoạt động, giờ bắt đầu) chỉ nhắc 1 lần nhờ bản ghi trong push_reminders_sent.
import {
  CHECKINS, db, FieldValue, fetchRoom, hashId, listTimedActivities, REMINDERS_SENT, sendToSubs, SUBS, SubscriptionDoc,
} from "../_lib/push.js";

export default async function handler(req: any, res: any) {
  const secret = process.env.CRON_SECRET;
  const given = (req.headers.authorization || "").replace(/^Bearer\s+/i, "") || req.query?.secret;
  if (!secret || given !== secret) return res.status(401).json({ error: "Unauthorized" });

  try {
    const now = Date.now();
    const snap = await db().collection(SUBS).where("prefs.reminders", "==", true).get();

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

      for (const sub of subs) {
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
    for (const col of [REMINDERS_SENT, CHECKINS]) {
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
