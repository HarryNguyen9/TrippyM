// ===== AI PROXY - SERVER HELPERS =====
// Khoá AI chỉ nằm ở server (Vercel Functions), KHÔNG có tiền tố VITE_ nên không bao giờ bị nhúng vào bundle JS.
//
// Biến môi trường (Vercel -> Project Settings -> Environment Variables, chọn Type: Secret):
//   GEMINI_API_KEY      khoá Google AI Studio (gợi ý món ngon/địa điểm, AI lập lịch trình)
//   OPENROUTER_API_KEY  khoá OpenRouter (chat AI, packing checklist, tóm tắt quỹ, soi lịch trình)
//
// Proxy KHÔNG nhận yêu cầu tuỳ ý: chỉ các "task" app đang dùng, chỉ model trong danh sách dưới đây
// (phải khớp các <option> trong index.html + OPENROUTER_FALLBACK_POOL trong src/main.ts), có giới hạn độ dài.

// Google đã tắt gemini-2.0-* và đang khai tử gemini-2.5-* (xem https://ai.google.dev/gemini-api/docs/deprecations).
// Phải khớp GEMINI_MODELS trong src/main.ts và <select id="settingGeminiModel"> trong index.html.
export const GEMINI_MODELS = new Set([
  "gemini-3.6-flash",
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
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

// Các tác vụ AI app đang dùng. Mỗi tác vụ gọi được qua CẢ 2 proxy (Gemini <-> OpenRouter dự phòng cho nhau).
//   json  = kết quả phải là JSON (Gemini bật responseMimeType JSON)
//   multi = được gửi nhiều tin nhắn (lịch sử chat); các tác vụ khác luôn đúng 1 tin nhắn user
export const AI_TASKS: Record<string, { title: string; json: boolean; temperature?: number; multi?: boolean }> = {
  suggest: { title: "Trippy - AI Suggest", json: true, temperature: 0.8 },
  itinerary: { title: "Trippy - AI Itinerary", json: true, temperature: 0.9 },
  chat: { title: "Trippy - AI Chat", json: false, multi: true },
  "member-summary": { title: "Trippy - AI Member Summary", json: false },
  packing: { title: "Trippy - AI Packing List", json: false },
  "reality-check": { title: "Trippy - AI Itinerary Reality Check", json: false },
};

const ROLES = new Set(["system", "user", "assistant"]);
const MAX_MESSAGES = 24;      // app giữ tối đa 20 lượt chat + 1 system prompt
const MAX_MESSAGE_CHARS = 12000;
const MAX_TOTAL_CHARS = 40000;

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Kiểm tra messages theo tác vụ. Trả về { messages } đã làm sạch hoặc { status, error }.
export function validateMessages(task: string, messages: unknown):
  { messages: ChatMessage[] } | { status: number; error: string } {
  const cfg = AI_TASKS[task];
  if (!cfg) return { status: 400, error: "task không hợp lệ" };
  if (!Array.isArray(messages) || !messages.length || messages.length > MAX_MESSAGES) {
    return { status: 400, error: "messages không hợp lệ" };
  }
  if (!cfg.multi && (messages.length !== 1 || messages[0]?.role !== "user")) {
    return { status: 400, error: "messages không hợp lệ" };
  }
  let total = 0;
  const clean: ChatMessage[] = [];
  for (const m of messages as any[]) {
    if (!m || !ROLES.has(m.role) || typeof m.content !== "string" || !m.content.trim()) {
      return { status: 400, error: "messages không hợp lệ" };
    }
    if (m.content.length > MAX_MESSAGE_CHARS) return { status: 413, error: "Tin nhắn quá dài" };
    total += m.content.length;
    clean.push({ role: m.role, content: m.content });
  }
  if (total > MAX_TOTAL_CHARS) return { status: 413, error: "Nội dung quá dài" };
  return { messages: clean };
}

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
