// ===== GỘP DỮ LIỆU 3 PHÍA (chống ghi đè khi nhiều người sửa cùng lúc) =====
// base   = bản lần cuối khớp với server (trước khi mình sửa)
// local  = bản trên máy (đã có thay đổi của mình)
// remote = bản mới nhất trên server (có thể đã có thay đổi của người khác)
// Kết quả = remote + những gì MÌNH đã đổi so với base. Hai bên đổi cùng 1 chỗ -> bản trên máy thắng.
//
// Danh sách (ngày, hoạt động, khoản chi, thành viên...) được ghép theo TỪNG MÓN (khoá theo id / ngày / tên),
// nên 2 người cùng thêm khoản chi thì giữ cả 2, người này xoá món A người kia sửa món B vẫn đúng.
// Firebase không lưu mảng/đối tượng rỗng và null, nên các giá trị "rỗng" được coi là bằng nhau.

type Json = any;

const isObj = (v: Json) => v !== null && typeof v === "object" && !Array.isArray(v);
const isEmpty = (v: Json) =>
  v === undefined || v === null || (Array.isArray(v) && v.length === 0) || (isObj(v) && Object.keys(v).length === 0);

export function deepEqual(a: Json, b: Json): boolean {
  if (isEmpty(a) && isEmpty(b)) return true;
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    const x = toArray(a), y = toArray(b);
    if (x.length !== y.length) return false;
    return x.every((v, i) => deepEqual(v, y[i]));
  }
  if (isObj(a) && isObj(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) if (!deepEqual(a[k], b[k])) return false;
    return true;
  }
  return false;
}

// Firebase trả mảng thưa (có lỗ) thành object {0:..., 2:...}
function toArray(v: Json): Json[] {
  if (Array.isArray(v)) return v;
  if (isObj(v) && Object.keys(v).every((k) => /^\d+$/.test(k))) {
    return Object.keys(v).sort((a, b) => +a - +b).map((k) => v[k]);
  }
  return [];
}
const looksLikeArray = (v: Json) => Array.isArray(v) || (isObj(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => /^\d+$/.test(k)));

function stableStringify(v: Json): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (isObj(v)) return `{${Object.keys(v).sort().filter((k) => !isEmpty(v[k])).map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}

// Khoá nhận diện 1 món trong danh sách
function itemKey(item: Json): string {
  if (item === null || item === undefined) return "∅";
  if (!isObj(item)) return "p:" + JSON.stringify(item);
  if (item.id !== undefined && item.id !== null && item.id !== "") return "id:" + item.id;
  if (typeof item.date === "string" && ("activities" in item || "title" in item)) return "day:" + item.date;
  if (typeof item.name === "string" && ("payments" in item || "avatarSeed" in item || "paid" in item)) return "mem:" + item.name;
  return "json:" + stableStringify(item);
}

// Gắn khoá kèm số thứ tự xuất hiện để phân biệt các món trùng nhau
function keyed(arr: Json[]) {
  const seen = new Map<string, number>();
  return arr.map((item) => {
    const k = itemKey(item);
    const n = seen.get(k) || 0;
    seen.set(k, n + 1);
    return { key: n ? `${k}#${n}` : k, item };
  });
}

const isPrimitiveList = (...arrs: Json[][]) => arrs.every((a) => a.every((v) => v === null || typeof v !== "object"));

function mergeArray(bRaw: Json, lRaw: Json, rRaw: Json): Json[] {
  const b = toArray(bRaw), l = toArray(lRaw), r = toArray(rRaw);

  // Danh sách giá trị đơn (VD: các lần đóng quỹ [500000, 200000], tên người tham gia):
  // ghép theo kiểu "túi" - giữ của server, bỏ những gì mình xoá, thêm những gì mình thêm.
  if (isPrimitiveList(b, l, r)) {
    const count = (arr: Json[]) => arr.reduce((m, v) => m.set(JSON.stringify(v), (m.get(JSON.stringify(v)) || 0) + 1), new Map());
    const cb = count(b), cl = count(l);
    const result = [...r];
    for (const [k, n] of cb) {
      const removed = n - (cl.get(k) || 0);
      for (let i = 0; i < removed; i++) {
        const idx = result.findIndex((v) => JSON.stringify(v) === k);
        if (idx >= 0) result.splice(idx, 1);
      }
    }
    for (const [k, n] of cl) {
      const added = n - (cb.get(k) || 0);
      for (let i = 0; i < added; i++) result.push(JSON.parse(k));
    }
    return result;
  }

  const kb = new Map(keyed(b).map((x) => [x.key, x.item]));
  const kl = keyed(l);
  const klMap = new Map(kl.map((x) => [x.key, x.item]));
  const kr = keyed(r);
  const krMap = new Map(kr.map((x) => [x.key, x.item]));

  const result: Json[] = [];
  for (const { key, item: rItem } of kr) {
    const inBase = kb.has(key), inLocal = klMap.has(key);
    if (inLocal) {
      result.push(mergeValue(kb.get(key), klMap.get(key), rItem));
    } else if (inBase) {
      // Mình đã xoá. Nếu người khác vừa sửa món này thì giữ lại (không làm mất thay đổi của họ).
      if (!deepEqual(rItem, kb.get(key))) result.push(rItem);
    } else {
      result.push(rItem); // người khác thêm
    }
  }
  for (const { key, item: lItem } of kl) {
    if (krMap.has(key)) continue;
    if (!kb.has(key)) result.push(lItem); // mình thêm
    else if (!deepEqual(lItem, kb.get(key))) result.push(lItem); // người khác xoá nhưng mình vừa sửa -> giữ
  }
  return result;
}

function mergeObject(b: Json, l: Json, r: Json): Json {
  const out: Json = {};
  const keys = new Set([...Object.keys(b || {}), ...Object.keys(l || {}), ...Object.keys(r || {})]);
  for (const k of keys) {
    const v = mergeValue(b?.[k], l?.[k], r?.[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function mergeValue(b: Json, l: Json, r: Json): Json {
  if (deepEqual(l, b)) return r;      // mình không đổi
  if (deepEqual(r, b)) return l;      // người khác không đổi
  if (deepEqual(l, r)) return l;      // cả hai đổi giống nhau
  if (looksLikeArray(l) || looksLikeArray(r)) return mergeArray(b, l, r);
  if (isObj(l) && isObj(r)) return mergeObject(isObj(b) ? b : {}, l, r);
  return l;                           // xung đột thật ở 1 giá trị -> bản trên máy thắng
}

export function mergeTrip(base: Json, local: Json, remote: Json): Json {
  if (!remote) return local;
  if (!base) return local;
  return mergeValue(base, local, remote);
}

// Gắn id cho khoản chi / đồ mang theo / chuyến bay chưa có id, để lần sau ghép đúng từng món
export function ensureItemIds(data: Json) {
  if (!data) return;
  const gen = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  for (const [field, prefix] of [["payments", "pm"], ["packingList", "pk"], ["flights", "fl"]] as const) {
    const arr = data[field];
    if (!Array.isArray(arr)) continue;
    arr.forEach((it: Json) => { if (isObj(it) && !it.id) it.id = gen(prefix); });
  }
}

// ===== HOÀN TÁC XOÁ =====
// Thêm lại những món có trong `before` mà không còn trong `current` (đúng vị trí cũ), đệ quy vào các
// danh sách con (VD: hoạt động trong ngày). Chỉ THÊM LẠI, không hoàn tác các thay đổi khác.
export function restoreDeleted(before: Json, current: Json): Json {
  if (looksLikeArray(before)) {
    const b = toArray(before), c = [...toArray(current)];
    if (isPrimitiveList(b, c)) {
      const left = [...c];
      b.forEach((v, i) => {
        const idx = left.findIndex((x) => JSON.stringify(x) === JSON.stringify(v));
        if (idx >= 0) left.splice(idx, 1);
        else c.splice(Math.min(i, c.length), 0, v);
      });
      return c;
    }
    const curKeys = keyed(c).map((x) => x.key);
    const result = [...c];
    keyed(b).forEach(({ key, item }, i) => {
      const at = curKeys.indexOf(key);
      if (at < 0) {
        result.splice(Math.min(i, result.length), 0, item);
        curKeys.splice(Math.min(i, curKeys.length), 0, key);
      } else {
        result[at] = restoreDeleted(item, result[at]);
      }
    });
    return result;
  }
  if (isObj(before) && isObj(current)) {
    const out = { ...current };
    for (const k of Object.keys(before)) {
      if (looksLikeArray(before[k]) || isObj(before[k])) out[k] = restoreDeleted(before[k], current[k] ?? (looksLikeArray(before[k]) ? [] : {}));
    }
    return out;
  }
  return current === undefined ? before : current;
}
