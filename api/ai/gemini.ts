// POST /api/ai/gemini
// body: { task, model, prompt }
//   task   "suggest"   -> gợi ý món ngon / địa điểm hot (JSON array)
//          "itinerary" -> AI tự động lập lịch trình (JSON array)
//   model  1 trong GEMINI_MODELS
//   prompt chuỗi, tối đa MAX_PROMPT ký tự
// trả về: { text } (nội dung text mà Gemini trả về) hoặc { error }
import { GEMINI_MODELS, isForeignOrigin, readJsonBody, scrubError } from "../_lib/ai.js";

const TASKS: Record<string, { temperature: number }> = {
  suggest: { temperature: 0.8 },
  itinerary: { temperature: 0.9 },
};
const MAX_PROMPT = 8000;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isForeignOrigin(req)) return res.status(403).json({ error: "Forbidden" });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(503).json({ error: "Máy chủ chưa cấu hình GEMINI_API_KEY", code: "no_key" });

  const { task, model, prompt } = readJsonBody(req);
  const cfg = TASKS[task];
  if (!cfg) return res.status(400).json({ error: "task không hợp lệ" });
  if (!GEMINI_MODELS.has(model)) return res.status(400).json({ error: "Model không được hỗ trợ" });
  if (typeof prompt !== "string" || !prompt.trim()) return res.status(400).json({ error: "Thiếu prompt" });
  if (prompt.length > MAX_PROMPT) return res.status(413).json({ error: "Prompt quá dài" });

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: cfg.temperature, maxOutputTokens: 8192 },
      }),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status === 429 ? 429 : 502).json({ error: scrubError(data?.error?.message || `Lỗi HTTP ${r.status}`, apiKey) });
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ text });
  } catch (e: any) {
    console.error("[ai/gemini]", scrubError(e?.message, apiKey));
    return res.status(502).json({ error: scrubError(e?.message, apiKey) });
  }
}
