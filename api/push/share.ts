// Link chia sẻ lịch trình cho người ngoài nhóm (chỉ xem, KHÔNG kèm tiền / thành viên / mã Editor).
// GET  /api/push/share?id=SHARE_ID                      -> lịch trình mới nhất của chuyến đi (đã lọc)
// POST /api/push/share { action: "create", room, editorKey } -> { id } (đã có thì trả lại id cũ)
// POST /api/push/share { action: "revoke", room, editorKey } -> tắt chia sẻ, link cũ hết hiệu lực
// Link dùng mã chia sẻ ngẫu nhiên (không phải mã phòng) nên người nhận không vào được phòng.
import { randomBytes } from "node:crypto";
import { db, fetchRoom, isEditorKeyValid, readBody } from "../_lib/push.js";

const SHARES = "itinerary_shares";
const list = (v: any) => (Array.isArray(v) ? v : Object.values(v || {})).filter(Boolean) as any[];

// Chỉ giữ thông tin lịch trình: tên chuyến, địa điểm, ngày, hoạt động (giờ, tên, địa điểm, ghi chú)
function publicItinerary(room: any) {
  return {
    trip: { name: room?.trip?.name || "Chuyến đi", location: room?.trip?.location || "", vibe: room?.trip?.vibe || "" },
    days: list(room?.days).map((d) => ({
      date: String(d.date || ""),
      title: String(d.title || ""),
      activities: list(d.activities)
        .filter((a) => a?.name)
        .map((a) => ({ time: String(a.time || ""), name: String(a.name), location: String(a.location || ""), note: String(a.note || "") }))
        .sort((a, b) => (a.time || "99").localeCompare(b.time || "99")),
    })),
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const id = String(req.query?.id || "");
      if (!/^[a-zA-Z0-9_-]{8,40}$/.test(id)) return res.status(400).json({ error: "Link không hợp lệ" });
      const snap = await db().collection(SHARES).doc(id).get();
      if (!snap.exists) return res.status(404).json({ error: "Link đã hết hiệu lực hoặc không tồn tại" });
      const room = await fetchRoom(snap.get("room"));
      if (!room) return res.status(404).json({ error: "Chuyến đi không còn tồn tại" });
      return res.status(200).json(publicItinerary(room));
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { action, room, editorKey } = readBody(req);
    if (!room || typeof room !== "string") return res.status(400).json({ error: "Thiếu room" });
    const roomData = await fetchRoom(room);
    if (!roomData) return res.status(404).json({ error: "Không tìm thấy chuyến đi" });
    if (!isEditorKeyValid(roomData, editorKey)) return res.status(403).json({ error: "Chỉ Editor mới chia sẻ được" });

    const existing = await db().collection(SHARES).where("room", "==", room).get();

    if (action === "revoke") {
      await Promise.all(existing.docs.map((d) => d.ref.delete()));
      return res.status(200).json({ ok: true });
    }
    if (action === "create") {
      if (!existing.empty) return res.status(200).json({ id: existing.docs[0].id });
      const id = randomBytes(9).toString("base64url"); // 12 ký tự, khó đoán
      await db().collection(SHARES).doc(id).set({ room, at: Date.now() });
      return res.status(200).json({ id });
    }
    return res.status(400).json({ error: "action không hợp lệ" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
