// POST /api/ai/openrouter
// body: { task, model, messages }
//   task     "chat" | "member-summary" | "packing" | "reality-check"
//   model    1 trong OPENROUTER_MODELS
//   messages [{ role: "system" | "user" | "assistant", content: string }]
// trả về: { content } hoặc { error }
// Việc thử lần lượt các model dự phòng vẫn do client làm (mỗi lần thử = 1 request tới đây).
import { isForeignOrigin, OPENROUTER_MODELS, readJsonBody, scrubError } from "../_lib/ai.js";

const TASK_TITLES: Record<string, string> = {
  chat: "Trippy - AI Chat",
  "member-summary": "Trippy - AI Member Summary",
  packing: "Trippy - AI Packing List",
  "reality-check": "Trippy - AI Itinerary Reality Check",
};
const ROLES = new Set(["system", "user", "assistant"]);
const MAX_MESSAGES = 24;      // app giữ tối đa 20 lượt chat + 1 system prompt
const MAX_MESSAGE_CHARS = 12000;
const MAX_TOTAL_CHARS = 40000;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isForeignOrigin(req)) return res.status(403).json({ error: "Forbidden" });

  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey) return res.status(503).json({ error: "Máy chủ chưa cấu hình OPENROUTER_API_KEY", code: "no_key" });

  const { task, model, messages } = readJsonBody(req);
  const title = TASK_TITLES[task];
  if (!title) return res.status(400).json({ error: "task không hợp lệ" });
  if (!OPENROUTER_MODELS.has(model)) return res.status(400).json({ error: "Model không được hỗ trợ" });
  if (!Array.isArray(messages) || !messages.length || messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: "messages không hợp lệ" });
  }
  // Chỉ "chat" mới có nhiều lượt; các tác vụ còn lại app luôn gửi đúng 1 tin nhắn user.
  if (task !== "chat" && messages.length !== 1) return res.status(400).json({ error: "messages không hợp lệ" });

  let total = 0;
  const clean: { role: string; content: string }[] = [];
  for (const m of messages) {
    if (!m || !ROLES.has(m.role) || typeof m.content !== "string") return res.status(400).json({ error: "messages không hợp lệ" });
    if (m.content.length > MAX_MESSAGE_CHARS) return res.status(413).json({ error: "Tin nhắn quá dài" });
    total += m.content.length;
    clean.push({ role: m.role, content: m.content });
  }
  if (total > MAX_TOTAL_CHARS) return res.status(413).json({ error: "Nội dung quá dài" });

  const proto = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(host ? { "HTTP-Referer": `${proto}://${host}` } : {}),
        "X-Title": title,
      },
      body: JSON.stringify({ model, messages: clean, max_tokens: 8000 }),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status === 429 ? 429 : 502).json({ error: scrubError(data?.error?.message || `Lỗi HTTP ${r.status}`, apiKey) });
    }
    const content = String(data?.choices?.[0]?.message?.content || "").trim();
    return res.status(200).json({ content });
  } catch (e: any) {
    console.error("[ai/openrouter]", scrubError(e?.message, apiKey));
    return res.status(502).json({ error: scrubError(e?.message, apiKey) });
  }
}
