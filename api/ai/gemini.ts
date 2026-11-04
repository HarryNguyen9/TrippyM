// POST /api/ai/gemini
// body: { task, model, messages }
//   task     1 trong AI_TASKS (api/_lib/ai.ts): "suggest", "itinerary" là việc chính của Gemini;
//            "chat", "member-summary", "packing", "reality-check" là dự phòng khi OpenRouter lỗi / hết lượt
//   model    1 trong GEMINI_MODELS
//   messages [{ role: "system" | "user" | "assistant", content: string }] (chỉ "chat" được nhiều tin)
// trả về: { text } (nội dung text mà Gemini trả về) hoặc { error }
import { AI_TASKS, GEMINI_MODELS, isForeignOrigin, readJsonBody, scrubError, validateMessages } from "../_lib/ai.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isForeignOrigin(req)) return res.status(403).json({ error: "Forbidden" });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(503).json({ error: "Máy chủ chưa cấu hình GEMINI_API_KEY", code: "no_key" });

  const { task, model, messages } = readJsonBody(req);
  if (!GEMINI_MODELS.has(model)) return res.status(400).json({ error: "Model không được hỗ trợ" });
  const v = validateMessages(task, messages);
  if ("error" in v) return res.status(v.status).json({ error: v.error });
  const cfg = AI_TASKS[task];

  // Gemini: system prompt đi riêng (systemInstruction), vai "assistant" gọi là "model"
  const system = v.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = v.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  if (!contents.length) return res.status(400).json({ error: "messages không hợp lệ" });

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents,
        generationConfig: {
          ...(cfg.json ? { responseMimeType: "application/json" } : {}),
          ...(cfg.temperature !== undefined ? { temperature: cfg.temperature } : {}),
          maxOutputTokens: 8192,
        },
      }),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status === 429 ? 429 : 502).json({ error: scrubError(data?.error?.message || `Lỗi HTTP ${r.status}`, apiKey) });
    }
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.filter((p: any) => typeof p?.text === "string" && !p.thought).map((p: any) => p.text).join("");
    return res.status(200).json({ text });
  } catch (e: any) {
    console.error("[ai/gemini]", scrubError(e?.message, apiKey));
    return res.status(502).json({ error: scrubError(e?.message, apiKey) });
  }
}
