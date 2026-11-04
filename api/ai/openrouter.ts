// POST /api/ai/openrouter
// body: { task, model, messages }
//   task     1 trong AI_TASKS (api/_lib/ai.ts): "chat", "member-summary", "packing", "reality-check" là việc
//            chính của OpenRouter; "suggest", "itinerary" là dự phòng khi Gemini lỗi / hết lượt
//   model    1 trong OPENROUTER_MODELS
//   messages [{ role: "system" | "user" | "assistant", content: string }] (chỉ "chat" được nhiều tin)
// trả về: { content } hoặc { error }
// Việc thử lần lượt các model dự phòng vẫn do client làm (mỗi lần thử = 1 request tới đây).
import { AI_TASKS, isForeignOrigin, OPENROUTER_MODELS, readJsonBody, scrubError, validateMessages } from "../_lib/ai.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isForeignOrigin(req)) return res.status(403).json({ error: "Forbidden" });

  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey) return res.status(503).json({ error: "Máy chủ chưa cấu hình OPENROUTER_API_KEY", code: "no_key" });

  const { task, model, messages } = readJsonBody(req);
  if (!OPENROUTER_MODELS.has(model)) return res.status(400).json({ error: "Model không được hỗ trợ" });
  const v = validateMessages(task, messages);
  if ("error" in v) return res.status(v.status).json({ error: v.error });
  const cfg = AI_TASKS[task];

  const proto = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(host ? { "HTTP-Referer": `${proto}://${host}` } : {}),
        "X-Title": cfg.title,
      },
      body: JSON.stringify({
        model,
        messages: v.messages,
        max_tokens: 8000,
        ...(cfg.temperature !== undefined ? { temperature: cfg.temperature } : {}),
      }),
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
