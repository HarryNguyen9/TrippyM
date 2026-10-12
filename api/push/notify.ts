// POST /api/push/notify
// body: { type, roomCode, deviceId, editorKey?, ... }
//   change -> { changes: string[] } báo cả nhóm nội dung vừa sửa (editor gọi sau khi autoSync xong)
//   manual -> { message } editor gửi 1 tin nhắn tới cả nhóm
//   debt   -> { targets: [{ member, amount }] } editor nhắc từng người đang nợ nhóm
//   test   -> { endpoint } gửi thử 1 thông báo tới chính thiết bị đang bật
import {
  db, fetchRoom, FieldValue, hashId, isEditorKeyValid, readBody, ROOM_META, sendToSubs, SUBS, subsForRoom,
} from "../_lib/push.js";

const THROTTLE_MS: Record<string, number> = {
  change: 60 * 1000, // client đã gom các lần sửa; bị chặn thì client giữ lại thay đổi và gửi lại sau
  manual: 20 * 1000,
  debt: 60 * 1000,
};

const vnd = (n: number) => Math.round(n || 0).toLocaleString("vi-VN") + "đ";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { type, roomCode, deviceId, editorKey, message, endpoint, changes, targets } = readBody(req);

    if (type === "test") {
      const snap = await db().collection(SUBS).doc(hashId(String(endpoint || ""))).get();
      if (!snap.exists) return res.status(404).json({ error: "Thiết bị chưa đăng ký nhận thông báo" });
      const r = await sendToSubs([{ id: snap.id, data: snap.data() as any }], {
        title: "🔔 Trippy", body: "Thông báo đã hoạt động trên thiết bị này!", tag: "test",
      });
      return res.status(200).json(r);
    }

    if (!THROTTLE_MS[type]) return res.status(400).json({ error: "type không hợp lệ" });
    if (!roomCode || typeof roomCode !== "string") return res.status(400).json({ error: "Thiếu roomCode" });
    const room = await fetchRoom(roomCode);
    if (!room) return res.status(404).json({ error: "Không tìm thấy chuyến đi" });
    if (!isEditorKeyValid(room, editorKey)) return res.status(403).json({ error: "Sai mã Editor" });
    const tripName = room.trip?.name || "Chuyến đi";

    // Kiểm tra dữ liệu trước khi tốn lượt throttle
    const lines = (Array.isArray(changes) ? changes : []).map((c) => String(c).slice(0, 150)).filter(Boolean).slice(0, 30);
    const text = String(message || "").trim().slice(0, 200);
    const debts = (Array.isArray(targets) ? targets : [])
      .map((t) => ({ member: String(t?.member || ""), amount: Number(t?.amount) || 0 }))
      .filter((t) => t.member && t.amount > 0)
      .slice(0, 50);
    if (type === "change" && !lines.length) return res.status(400).json({ error: "Không có thay đổi" });
    if (type === "manual" && !text) return res.status(400).json({ error: "Nội dung trống" });
    if (type === "debt" && !debts.length) return res.status(400).json({ error: "Không có ai đang nợ" });

    // Throttle theo room + loại, dùng transaction để 2 request song song không cùng lọt
    const metaRef = db().collection(ROOM_META).doc(roomCode);
    const field = `last_${type}_at`;
    const limit = THROTTLE_MS[type];
    const waitMs = await db().runTransaction(async (tx) => {
      const last = (await tx.get(metaRef)).get(field)?.toMillis?.() || 0;
      const wait = last + limit - Date.now();
      if (wait > 0) return wait;
      tx.set(metaRef, { [field]: FieldValue.serverTimestamp() }, { merge: true });
      return 0;
    });
    if (waitMs > 0) {
      if (type === "change") return res.status(200).json({ skipped: "throttled", retryAfterMs: waitMs });
      return res.status(429).json({ error: `Vừa gửi xong, đợi ${Math.ceil(waitMs / 1000)} giây rồi gửi tiếp nhé` });
    }

    const allSubs = await subsForRoom(roomCode);
    const roomSubs = allSubs.filter((s) => s.data.deviceId !== deviceId);

    if (type === "debt") {
      let sent = 0;
      const noDevice: string[] = [];
      for (const { member, amount } of debts) {
        // Nhắc nợ gửi theo tên -> không loại máy người bấm (Editor cũng có thể là người đang nợ)
        const subs = allSubs.filter((s) => s.data.memberName === member);
        if (!subs.length) { noDevice.push(member); continue; }
        const r = await sendToSubs(subs, {
          title: `💰 ${tripName}`,
          body: `${member} ơi, bạn đang nợ nhóm ${vnd(amount)}. Mở app xem chi tiết và chuyển cho quỹ nhé!`,
          tag: `debt-${roomCode}`,
        });
        sent += r.sent;
      }
      return res.status(200).json({ sent, noDevice });
    }

    if (type === "change") {
      const shown = lines.slice(0, 3);
      const more = lines.length - shown.length;
      const r = await sendToSubs(roomSubs.filter((s) => s.data.prefs?.changes !== false), {
        title: `✏️ ${tripName}`,
        body: shown.join("\n") + (more > 0 ? `\n… và ${more} thay đổi khác` : ""),
        tag: `change-${roomCode}`,
      });
      return res.status(200).json(r);
    }

    const r = await sendToSubs(roomSubs, { title: `📣 ${tripName}`, body: text, tag: `manual-${roomCode}-${Date.now()}` });
    return res.status(200).json(r);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
