// ===== AI PROXY - SERVER HELPERS =====
// Khoá AI chỉ nằm ở server (Vercel Functions), KHÔNG có tiền tố VITE_ nên không bao giờ bị nhúng vào bundle JS.
//
// Biến môi trường (Vercel -> Project Settings -> Environment Variables, chọn Type: Secret):
//   GEMINI_API_KEY      khoá Google AI Studio (gợi ý món ngon/địa điểm, AI lập lịch trình)
//   OPENROUTER_API_KEY  khoá OpenRouter (chat AI, packing checklist, tóm tắt quỹ, soi lịch trình)
//
// Proxy KHÔNG nhận yêu cầu tuỳ ý: chỉ các "task" app đang dùng, chỉ model trong danh sách dưới đây
// (phải khớp các <option> trong index.html + OPENROUTER_FALLBACK_POOL trong src/main.ts), có giới hạn độ dài.

export const GEMINI_MODELS = new Set([
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-flash-latest",
  "gemini-pro-latest",
]);

export const OPENROUTER_MODELS = new Set([
  // Packing / tóm tắt quỹ / soi lịch trình
  "deepseek/deepseek-chat",
  "deepseek/deepseek-chat-v3.1",
  "deepseek/deepseek-r1",
  "deepseek/deepseek-r1:free",
  // Chat AI
  "qwen/qwen-2.5-72b-instruct",
  "qwen/qwen-2.5-7b-instruct",
  "qwen/qwen3-32b",
  "qwen/qwen-plus",
  // Dự phòng
  "meta-llama/llama-3.1-8b-instruct",
]);

export function readJsonBody(req: any) {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body || {};
}

// Chặn trang web KHÁC gọi ké từ trình duyệt (header Origin do trình duyệt tự gắn, trang khác không giả được).
// Không chặn được script gọi thẳng bằng curl — vì vậy vẫn cần giới hạn task/model/độ dài + hạn mức chi tiêu ở nhà cung cấp.
export function isForeignOrigin(req: any) {
  const origin = req.headers?.origin;
  if (!origin) return false;
  try {
    const host = new URL(origin).host;
    const reqHost = String(req.headers["x-forwarded-host"] || req.headers.host || "");
    return host !== reqHost;
  } catch {
    return true;
  }
}

// Gỡ khoá khỏi chuỗi lỗi (phòng khi nhà cung cấp trả lại URL/khoá trong message).
export function scrubError(msg: unknown, ...secrets: (string | undefined)[]) {
  let s = String(msg || "Lỗi không xác định").slice(0, 300);
  for (const k of secrets) if (k) s = s.split(k).join("***");
  return s;
}
