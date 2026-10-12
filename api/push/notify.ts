// POST /api/push/notify
// body: { type: "change" | "manual" | "test", roomCode, deviceId, editorKey?, message?, endpoint? }
//   change -> báo cả nhóm là chuyến đi vừa được sửa (editor gọi sau khi autoSync xong)
//   manual -> editor gửi 1 tin nhắn tới cả nhóm
//   test   -> gửi thử 1 thông báo tới chính thiết bị đang bật
import {
  db, fetchRoom, FieldValue, hashId, isEditorKeyValid, readBody, ROOM_META, sendToSubs, SUBS, subsForRoom,
} from "../_lib/push.js";

const CHANGE_THROTTLE_MS = 5 * 60 * 1000; // tối đa 1 thông báo "có thay đổi" / room / 5 phút
const MANUAL_THROTTLE_MS = 20 * 1000;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { type, roomCode, deviceId, editorKey, message, endpoint } = readBody(req);

    if (type === "test") {
      const snap = await db().collection(SUBS).doc(hashId(String(endpoint || ""))).get();
      if (!snap.exists) return res.status(404).json({ error: "Thiết bị chưa đăng ký nhận thông báo" });
      const r = await sendToSubs([{ id: snap.id, data: snap.data() as any }], {
        title: "🔔 Trippy", body: "Thông báo đã hoạt động trên thiết bị này!", tag: "test",
      });
      return res.status(200).json(r);
    }

    if (!roomCode || typeof roomCode !== "string") return res.status(400).json({ error: "Thiếu roomCode" });
    const room = await fetchRoom(roomCode);
    if (!room) return res.status(404).json({ error: "Không tìm thấy chuyến đi" });
    if (!isEditorKeyValid(room, editorKey)) return res.status(403).json({ error: "Sai mã Editor" });

    const tripName = room.trip?.name || "Chuyến đi";
    const isChange = type === "change";
    if (!isChange && type !== "manual") return res.status(400).json({ error: "type không hợp lệ" });

    const text = String(message || "").trim().slice(0, 200);
    if (!isChange && !text) return res.status(400).json({ error: "Nội dung trống" });

    // Throttle theo room, dùng transaction để 2 request song song không cùng lọt
    const metaRef = db().collection(ROOM_META).doc(roomCode);
    const field = isChange ? "lastChangeAt" : "lastManualAt";
    const limit = isChange ? CHANGE_THROTTLE_MS : MANUAL_THROTTLE_MS;
    const allowed = await db().runTransaction(async (tx) => {
      const last = (await tx.get(metaRef)).get(field)?.toMillis?.() || 0;
      if (Date.now() - last < limit) return false;
      tx.set(metaRef, { [field]: FieldValue.serverTimestamp() }, { merge: true });
      return true;
    });
    if (!allowed) {
      if (isChange) return res.status(200).json({ skipped: "throttled" });
      return res.status(429).json({ error: "Vừa gửi xong, đợi chút rồi gửi tiếp nhé" });
    }

    const subs = (await subsForRoom(roomCode))
      .filter((s) => s.data.deviceId !== deviceId)
      .filter((s) => !isChange || s.data.prefs?.changes !== false);

    const r = await sendToSubs(subs, isChange
      ? { title: `✏️ ${tripName}`, body: "Lịch trình vừa được cập nhật. Mở app để xem thay đổi mới nhất.", tag: `change-${roomCode}` }
      : { title: `📣 ${tripName}`, body: text, tag: `manual-${roomCode}-${Date.now()}` });
    return res.status(200).json(r);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
