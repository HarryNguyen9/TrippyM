// POST   /api/push/subscription  -> lưu/cập nhật Web Push subscription của thiết bị cho room hiện tại
// DELETE /api/push/subscription  -> xoá subscription (tắt thông báo / rời phòng)
// body: { subscription: { endpoint, keys: { p256dh, auth } }, roomCode, deviceId, tz, prefs }
import { db, fetchRoom, FieldValue, hashId, isEditorKeyValid, readBody, SUBS } from "../_lib/push.js";

const LEAD_OPTIONS = [10, 15, 30, 60, 120];

export default async function handler(req: any, res: any) {
  try {
    const body = readBody(req);
    const sub = body.subscription || {};
    const endpoint = String(sub.endpoint || "");
    if (!/^https:\/\//.test(endpoint) || endpoint.length > 2048) return res.status(400).json({ error: "subscription không hợp lệ" });
    const ref = db().collection(SUBS).doc(hashId(endpoint));

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

    const keys = { p256dh: String(sub.keys?.p256dh || ""), auth: String(sub.keys?.auth || "") };
    if (!keys.p256dh || !keys.auth) return res.status(400).json({ error: "subscription thiếu keys" });

    const room = await fetchRoom(roomCode).catch(() => null);
    const isEditor = !!room && isEditorKeyValid(room, body.editorKey);

    await ref.set({
      endpoint,
      isEditor,
      keys,
      deviceId: String(body.deviceId || "").slice(0, 100),
      memberName: String(body.memberName || "").slice(0, 100),
      roomCode,
      tz,
      prefs: {
        changes: prefs.changes !== false,
        reminders: prefs.reminders !== false,
        leadMinutes: LEAD_OPTIONS.includes(lead) ? lead : 30,
        morning: prefs.morning !== false,
      },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
