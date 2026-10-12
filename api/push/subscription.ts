// POST   /api/push/subscription  -> lưu/cập nhật token FCM của thiết bị cho room hiện tại
// DELETE /api/push/subscription  -> xoá token (tắt thông báo / rời phòng)
import { db, FieldValue, hashId, readBody, SUBS } from "../_lib/push.js";

const LEAD_OPTIONS = [10, 15, 30, 60, 120];

export default async function handler(req: any, res: any) {
  try {
    const body = readBody(req);
    const token = String(body.token || "");
    if (!token || token.length > 4096) return res.status(400).json({ error: "token không hợp lệ" });
    const ref = db().collection(SUBS).doc(hashId(token));

    if (req.method === "DELETE") {
      await ref.delete();
      return res.status(200).json({ ok: true });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const roomCode = String(body.roomCode || "").trim();
    if (!roomCode || roomCode.length > 100 || /[.#$\[\]\/]/.test(roomCode)) {
      return res.status(400).json({ error: "roomCode không hợp lệ" });
    }
    const prefs = body.prefs || {};
    const lead = Number(prefs.leadMinutes);
    let tz = String(body.tz || "Asia/Ho_Chi_Minh");
    try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); } catch { tz = "Asia/Ho_Chi_Minh"; }

    await ref.set({
      token,
      deviceId: String(body.deviceId || "").slice(0, 100),
      roomCode,
      tz,
      prefs: {
        changes: prefs.changes !== false,
        reminders: prefs.reminders !== false,
        leadMinutes: LEAD_OPTIONS.includes(lead) ? lead : 30,
      },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
