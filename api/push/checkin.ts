// Check-in tại điểm hẹn (hoạt động đang diễn ra) + nhắc người chưa tới.
// GET  /api/push/checkin?room=CODE&act=ACT_KEY       -> { members: { [tên]: { status, at, lat?, lng? } } }
// POST /api/push/checkin { room, act, actName, member, status: "arrived" | "otw", lat?, lng? }
// POST /api/push/checkin { action: "nudge", room, act, actName, member }  -> push cho người chưa tới
// Lưu ở Firestore (project push) thay vì Realtime DB chính: viewer cũng check-in được và
// không bị autoSync của editor (ghi đè cả room) xoá mất.
import { CHECKINS, db, FieldValue, fetchRoom, hashId, memberNames, readBody, sendToSubs, subsForRoom } from "../_lib/push.js";

const NUDGE_THROTTLE_MS = 15 * 1000; // theo từng người gửi, chỉ để chống bấm liên tục
const KEEP_MS = 3 * 864e5;

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const q = req.method === "GET" ? req.query || {} : readBody(req);
    const room = String(q.room || "").trim();
    const act = String(q.act || "").trim().slice(0, 200);
    if (!room || !act) return res.status(400).json({ error: "Thiếu room / act" });
    const ref = db().collection(CHECKINS).doc(hashId(`${room}|${act}`));

    if (req.method === "GET") {
      const snap = await ref.get();
      return res.status(200).json({ members: snap.exists ? snap.get("members") || {} : {} });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const roomData = await fetchRoom(room);
    if (!roomData) return res.status(404).json({ error: "Không tìm thấy chuyến đi" });
    const names = memberNames(roomData);
    const member = String(q.member || "");
    const actName = String(q.actName || "điểm hẹn").slice(0, 100);
    const tripName = roomData.trip?.name || "Chuyến đi";

    if (q.action === "nudge") {
      // Ai cũng nhắc được, kể cả chưa chọn "Tôi là ai". Throttle tính riêng từng người/máy gửi
      // (chống bấm liên tục) nên nhiều người nhắc cùng lúc không chặn nhau.
      const requester = names.includes(member) ? member : "";
      const deviceId = String(q.deviceId || "");
      const senderKey = hashId(requester || deviceId || "anon").slice(0, 16);
      const result = await db().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const last = Number(snap.get(`nudges.${senderKey}`)) || 0;
        if (Date.now() - last < NUDGE_THROTTLE_MS) return null;
        tx.set(ref, { room, act, nudges: { [senderKey]: Date.now() }, expireAt: new Date(Date.now() + KEEP_MS) }, { merge: true });
        return (snap.get("members") || {}) as Record<string, any>;
      });
      if (!result) return res.status(429).json({ error: "Bạn vừa nhắc xong, đợi chút rồi nhắc lại nhé" });

      const arrived = names.filter((n) => result[n]?.status === "arrived");
      const waiting = names.filter((n) => n !== requester && result[n]?.status !== "arrived");
      if (!waiting.length) return res.status(200).json({ sent: 0, genericSent: 0, waiting: [], noDevice: [] });

      const roomSubs = (await subsForRoom(room)).filter((s) => !deviceId || s.data.deviceId !== deviceId);
      const progress = `${arrived.length}/${names.length} người đã tới`;

      // Người đã chọn "Tôi là ai" -> nhắc đích danh
      const named = roomSubs.filter((s) => waiting.includes(s.data.memberName || ""));
      const r = await sendToSubs(named, {
        title: `⏳ ${tripName} · ${actName}`,
        body: `${requester || "Cả nhóm"} nhắc: mọi người đang chờ bạn! (${progress})`,
        tag: `nudge-${act}`,
      });

      // Máy chưa chọn "Tôi là ai" -> không biết có phải người chưa tới không, gửi thông báo chung
      const unnamed = roomSubs.filter((s) => !s.data.memberName);
      const g = await sendToSubs(unnamed, {
        title: `⏳ ${tripName} · ${actName}`,
        body: `Cả nhóm đang chờ ở ${actName}! Ai chưa tới thì nhanh lên nhé (${progress})`,
        tag: `nudge-${act}`,
      });

      const withDevice = new Set(named.map((s) => s.data.memberName));
      return res.status(200).json({
        sent: r.sent, genericSent: g.sent, waiting, noDevice: waiting.filter((n) => !withDevice.has(n)),
      });
    }

    if (!names.includes(member)) return res.status(400).json({ error: "Chọn \"Tôi là ai\" trước khi check-in" });

    // ---- Check-in / gửi vị trí ----
    const status = q.status === "otw" ? "otw" : "arrived";
    const lat = Number(q.lat), lng = Number(q.lng);
    const entry: any = { status, at: Date.now() };
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      entry.lat = Math.round(lat * 1e5) / 1e5;
      entry.lng = Math.round(lng * 1e5) / 1e5;
    }

    const { members, notifyAll } = await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const prev = (snap.get("members") || {}) as Record<string, any>;
      // Đã "tới" rồi thì gửi vị trí không làm lùi trạng thái về "đang tới"
      const merged = { ...prev, [member]: { ...prev[member], ...entry, status: prev[member]?.status === "arrived" ? "arrived" : status } };
      const allArrived = names.every((n) => merged[n]?.status === "arrived");
      const notifyAll = allArrived && !snap.get("allArrivedNotified");
      tx.set(ref, {
        room, act, actName, members: merged,
        ...(notifyAll ? { allArrivedNotified: true } : {}),
        expireAt: new Date(Date.now() + KEEP_MS),
      }, { merge: true });
      return { members: merged, notifyAll };
    });

    if (notifyAll && names.length > 1) {
      await sendToSubs(await subsForRoom(room), {
        title: `🎉 ${tripName}`, body: `Cả nhóm ${names.length} người đã có mặt ở ${actName}!`, tag: `all-${act}`,
      });
    }
    return res.status(200).json({ members });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
