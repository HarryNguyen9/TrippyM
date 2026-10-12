// ===== SO SÁNH 2 PHIÊN BẢN DỮ LIỆU CHUYẾN ĐI -> DANH SÁCH THAY ĐỔI DỄ ĐỌC =====
// Dùng cho thông báo "chuyến đi được cập nhật" (gửi kèm nội dung cụ thể thay vì câu chung chung).
// Thay đổi không đáng báo (tick checklist đồ, đổi ảnh bìa...) được bỏ qua.

const vnd = (n: number) => (n || 0).toLocaleString("vi-VN") + "đ";
const list = (v: any) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : []).filter(Boolean);

function activities(data: any) {
  const out = new Map<string, any>();
  for (const day of list(data?.days)) {
    for (const act of list(day.activities)) {
      if (!act.name) continue;
      out.set(String(act.id || `${day.date}|${act.time}|${act.name}`), { ...act, date: day.date });
    }
  }
  return out;
}

const payKey = (p: any) => `${p.desc}|${p.amount}|${p.payer}`;
const contributed = (m: any) => list(m.payments).reduce((s: number, v: any) => s + (Number(v) || 0), 0) || m.paid || 0;

export function describeTripChanges(oldData: any, newData: any): string[] {
  if (!oldData || !newData) return [];
  const out: string[] = [];

  // --- Tên chuyến đi ---
  if (oldData.trip?.name && newData.trip?.name && oldData.trip.name !== newData.trip.name) {
    out.push(`🏷️ Đổi tên chuyến đi: ${newData.trip.name}`);
  }

  // --- Ngày ---
  const oldDays = new Set(list(oldData.days).map((d: any) => d.date));
  const newDays = new Set(list(newData.days).map((d: any) => d.date));
  for (const d of newDays) if (!oldDays.has(d)) out.push(`📅 Thêm ngày ${d}`);
  for (const d of oldDays) if (!newDays.has(d)) out.push(`🗑️ Xoá ngày ${d}`);

  // --- Hoạt động ---
  const oldActs = activities(oldData), newActs = activities(newData);
  for (const [id, a] of newActs) {
    const o = oldActs.get(id);
    if (!o) {
      out.push(`➕ ${a.time || ""} ${a.name} (${a.date})`.replace(/\s+/g, " ").trim());
      continue;
    }
    const diffs: string[] = [];
    if (o.date !== a.date) diffs.push(`dời sang ${a.time || ""} ${a.date}`.replace(/\s+/g, " "));
    else if (o.time !== a.time) diffs.push(`đổi giờ ${o.time || "--"} → ${a.time || "--"}`);
    if (o.name !== a.name) diffs.push(`đổi tên từ "${o.name}"`);
    if ((o.location || "") !== (a.location || "")) diffs.push(a.location ? `địa điểm → ${a.location}` : "bỏ địa điểm");
    if ((o.note || "") !== (a.note || "")) diffs.push("sửa ghi chú");
    if (diffs.length) out.push(`✏️ ${a.name}: ${diffs.join(", ")}`);
  }
  for (const [id, o] of oldActs) {
    if (!newActs.has(id) && newDays.has(o.date)) out.push(`➖ Bỏ hoạt động: ${o.name} (${o.date})`);
  }

  // --- Chi tiêu (không có id -> so theo nội dung, cặp thêm/xoá cùng mô tả coi là "sửa") ---
  const real = (d: any) => list(d.payments).filter((p: any) => typeof p === "object");
  const oldPays = real(oldData), newPays = real(newData);
  const remaining = [...oldPays];
  const added: any[] = [];
  for (const p of newPays) {
    const i = remaining.findIndex((o) => payKey(o) === payKey(p));
    if (i >= 0) remaining.splice(i, 1); else added.push(p);
  }
  for (const p of added) {
    const i = remaining.findIndex((o) => o.desc === p.desc);
    if (i >= 0) {
      const o = remaining.splice(i, 1)[0];
      out.push(`💸 Sửa khoản chi: ${p.desc}${o.amount !== p.amount ? ` (${vnd(o.amount)} → ${vnd(p.amount)})` : ""}`);
    } else {
      out.push(`💸 Khoản chi mới: ${p.desc} ${vnd(p.amount)}${p.payer ? ` · ${p.payer} trả` : ""}`);
    }
  }
  for (const o of remaining) out.push(`🗑️ Xoá khoản chi: ${o.desc} ${vnd(o.amount)}`);

  // --- Thành viên & quỹ ---
  const oldMem = new Map(list(oldData.members).map((m: any) => [m.name, m]));
  const newMem = new Map(list(newData.members).map((m: any) => [m.name, m]));
  for (const [name, m] of newMem) {
    const o = oldMem.get(name);
    if (!o) { out.push(`👋 Thành viên mới: ${name}`); continue; }
    const delta = contributed(m) - contributed(o);
    if (delta > 0) out.push(`💰 ${name} đóng quỹ +${vnd(delta)}`);
    else if (delta < 0) out.push(`💰 Sửa tiền quỹ của ${name} (${vnd(delta)})`);
  }
  for (const name of oldMem.keys()) if (!newMem.has(name)) out.push(`👋 ${name} rời nhóm`);

  // --- Chuyến bay ---
  if (JSON.stringify(list(oldData.flights)) !== JSON.stringify(list(newData.flights))) out.push("✈️ Cập nhật thông tin chuyến bay");

  return out;
}
