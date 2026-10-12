// Khoản chi chờ duyệt + SOS của nhóm (lưu ở Firestore project push, viewer cũng dùng được).
// GET  /api/push/group?room=CODE&deviceId=ID  -> { pending: [...], sos: [...], claims: [{ member, mine }] }
// POST /api/push/group { action, room, ... }
//   submit  { member, desc, amount, category?, participants?, actId? }  viewer gửi khoản chi chờ duyệt
//   approve { id, editorKey }  /  reject { id, editorKey }               editor duyệt / từ chối
//   cancel  { id, member }                                               người gửi tự huỷ
//   sos     { member, message, lat?, lng?, deviceId }                    báo khẩn cho cả nhóm
//   safe    { member, deviceId }                                         "Mình ổn rồi" - tắt SOS
//   claim   { member, previous?, deviceId }                              chọn "Tôi là ai" (1 người - 1 máy)
//   release { member, deviceId, editorKey? }                             bỏ chọn; Editor gỡ được cho máy khác
import {
  CLAIMS, db, EXPENSES, fetchRoom, hashId, isEditorKeyValid, memberNames, readBody, sendToSubs, SOS, subsForRoom, vnd,
} from "../_lib/push.js";

const SOS_ACTIVE_MS = 3 * 60 * 60 * 1000;
const CLAIM_KEEP_MS = 60 * 864e5;
const SOS_THROTTLE_MS = 30 * 1000;
const CATEGORIES = ["food", "transport", "hotel", "fun", "other"];

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const q = req.method === "GET" ? req.query || {} : readBody(req);
    const room = String(q.room || "").trim();
    if (!room) return res.status(400).json({ error: "Thiếu room" });

    if (req.method === "GET") {
      const [pendingSnap, sosSnap, claimSnap] = await Promise.all([
        db().collection(EXPENSES).where("room", "==", room).get(),
        db().collection(SOS).where("room", "==", room).get(),
        db().collection(CLAIMS).where("room", "==", room).get(),
      ]);
      // Không trả deviceId của máy khác ra ngoài, chỉ báo claim nào là của máy đang hỏi
      const myDevice = String(q.deviceId || "");
      const claims = claimSnap.docs.map((d) => ({ member: d.get("member"), mine: !!myDevice && d.get("deviceId") === myDevice }));
      const pending = pendingSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => a.at - b.at)
        .map(({ expireAt, room: _r, ...rest }: any) => rest);
      const sos = sosSnap.docs.map((d) => d.data())
        .filter((s: any) => Date.now() - s.at < SOS_ACTIVE_MS)
        .map(({ expireAt, room: _r, ...rest }: any) => rest);
      return res.status(200).json({ pending, sos, claims });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const roomData = await fetchRoom(room);
    if (!roomData) return res.status(404).json({ error: "Không tìm thấy chuyến đi" });
    const names = memberNames(roomData);
    const tripName = roomData.trip?.name || "Chuyến đi";
    const member = String(q.member || "");
    const action = String(q.action || "");

    // ---------- Khoản chi chờ duyệt ----------
    if (action === "submit") {
      if (!names.includes(member)) return res.status(400).json({ error: "Chọn \"Tôi là ai\" trước khi gửi khoản chi" });
      if (roomData.trip?.isFinished) return res.status(400).json({ error: "Chuyến đi đã kết thúc" });
      const desc = String(q.desc || "").trim().slice(0, 100);
      const amount = Math.round(Number(q.amount));
      if (!desc) return res.status(400).json({ error: "Nhập nội dung khoản chi" });
      if (!(amount > 0 && amount < 1e11)) return res.status(400).json({ error: "Số tiền không hợp lệ" });
      const participants = (Array.isArray(q.participants) ? q.participants : []).filter((n: any) => names.includes(n));

      const ref = db().collection(EXPENSES).doc();
      const item = {
        room, member, desc, amount,
        category: CATEGORIES.includes(q.category) ? q.category : "other",
        participants: participants.length ? participants : names,
        actId: String(q.actId || "").slice(0, 200),
        at: Date.now(),
        expireAt: new Date(Date.now() + 30 * 864e5),
      };
      await ref.set(item);

      const editors = (await subsForRoom(room)).filter((s) => s.data.isEditor && s.data.memberName !== member);
      await sendToSubs(editors, {
        title: `🧾 ${tripName} · Chờ duyệt`,
        body: `${member} gửi khoản chi: ${desc} ${vnd(amount)}. Mở app để duyệt nhé.`,
        tag: `pending-${room}`,
      });
      return res.status(200).json({ ok: true, id: ref.id });
    }

    if (action === "approve" || action === "reject" || action === "cancel") {
      const ref = db().collection(EXPENSES).doc(String(q.id || "_"));
      const snap = await ref.get();
      if (!snap.exists || snap.get("room") !== room) return res.status(404).json({ error: "Khoản chi không còn (có thể đã được xử lý)" });
      const item: any = snap.data();

      if (action === "cancel") {
        if (item.member !== member) return res.status(403).json({ error: "Chỉ người gửi mới huỷ được" });
        await ref.delete();
        return res.status(200).json({ ok: true });
      }
      if (!isEditorKeyValid(roomData, q.editorKey)) return res.status(403).json({ error: "Sai mã Editor" });
      await ref.delete();

      const submitterSubs = (await subsForRoom(room)).filter((s) => s.data.memberName === item.member);
      await sendToSubs(submitterSubs, action === "approve"
        ? { title: `✅ ${tripName}`, body: `Khoản chi "${item.desc}" ${vnd(item.amount)} đã được duyệt.`, tag: `pending-res-${snap.id}` }
        : { title: `❌ ${tripName}`, body: `Khoản chi "${item.desc}" ${vnd(item.amount)} bị từ chối. Hỏi Editor để biết thêm nhé.`, tag: `pending-res-${snap.id}` });

      const { expireAt, room: _r, ...rest } = item;
      return res.status(200).json({ ok: true, item: { id: snap.id, ...rest } });
    }

    // ---------- "Tôi là ai": mỗi thành viên chỉ 1 máy ----------
    if (action === "claim" || action === "release") {
      const deviceId = String(q.deviceId || "");
      if (!deviceId) return res.status(400).json({ error: "Thiếu deviceId" });
      const claimRef = (name: string) => db().collection(CLAIMS).doc(hashId(`${room}|${name}`));

      if (action === "release") {
        const ref = claimRef(member);
        const snap = await ref.get();
        if (!snap.exists) return res.status(200).json({ ok: true });
        if (snap.get("deviceId") !== deviceId && !isEditorKeyValid(roomData, q.editorKey)) {
          return res.status(403).json({ error: "Chỉ máy đã chọn hoặc Editor mới bỏ chọn được" });
        }
        await ref.delete();
        return res.status(200).json({ ok: true });
      }

      if (!names.includes(member)) return res.status(400).json({ error: "Không có thành viên này trong chuyến đi" });
      const ref = claimRef(member);
      const ok = await db().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists && snap.get("deviceId") !== deviceId) return false;
        tx.set(ref, { room, member, deviceId, at: Date.now(), expireAt: new Date(Date.now() + CLAIM_KEEP_MS) });
        return true;
      });
      if (!ok) return res.status(409).json({ error: `${member} đã được máy khác chọn. Nếu đó là bạn (đổi máy), nhờ Editor bấm "Gỡ" nhé.` });

      // Đổi sang người khác -> nhả người cũ của máy này
      const previous = String(q.previous || "");
      if (previous && previous !== member) {
        const prevRef = claimRef(previous);
        const prev = await prevRef.get();
        if (prev.exists && prev.get("deviceId") === deviceId) await prevRef.delete();
      }
      return res.status(200).json({ ok: true });
    }

    // ---------- SOS ----------
    if (action === "sos" || action === "safe") {
      if (!names.includes(member)) return res.status(400).json({ error: "Chọn \"Tôi là ai\" trước khi gửi SOS" });
      const ref = db().collection(SOS).doc(hashId(`${room}|${member}`));
      const others = (await subsForRoom(room)).filter((s) => s.data.deviceId !== q.deviceId);

      if (action === "safe") {
        const snap = await ref.get();
        await ref.delete();
        if (snap.exists) await sendToSubs(others, { title: `✅ ${tripName}`, body: `${member} báo đã ổn rồi, mọi người yên tâm nhé!`, tag: `sos-${member}` });
        return res.status(200).json({ ok: true });
      }

      const prev = await ref.get();
      if (prev.exists && Date.now() - (prev.get("at") || 0) < SOS_THROTTLE_MS) {
        return res.status(429).json({ error: "Vừa gửi SOS xong, đợi 30 giây rồi gửi lại" });
      }
      const message = String(q.message || "Mình cần giúp đỡ!").trim().slice(0, 200);
      const lat = Number(q.lat), lng = Number(q.lng);
      const hasLoc = q.lat != null && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
      const entry: any = { room, member, message, at: Date.now(), expireAt: new Date(Date.now() + SOS_ACTIVE_MS) };
      if (hasLoc) { entry.lat = Math.round(lat * 1e5) / 1e5; entry.lng = Math.round(lng * 1e5) / 1e5; }
      await ref.set(entry);

      const r = await sendToSubs(others, {
        title: `🆘 ${member} cần giúp! · ${tripName}`,
        body: message + (hasLoc ? "\nBấm để mở vị trí trên bản đồ" : ""),
        url: hasLoc ? `https://www.google.com/maps?q=${entry.lat},${entry.lng}` : "/",
        tag: `sos-${member}`,
      });
      return res.status(200).json({ ok: true, sent: r.sent });
    }

    return res.status(400).json({ error: "action không hợp lệ" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
