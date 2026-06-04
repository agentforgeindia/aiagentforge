// ============================================================
// AgentForge — Shared LLM helper
// ============================================================
// Provider-flexible text completion used by the AI Assistant
// features (meeting summary, sales coach, WhatsApp reply).
//
// Prefers Claude (most capable) when ANTHROPIC_API_KEY is set,
// otherwise falls back to OpenAI (OPENAI_API_KEY — already
// configured on this project).
//
// Env vars consumed (server-side only):
//   ANTHROPIC_API_KEY   sk-ant-…       (optional, preferred)
//   ANTHROPIC_MODEL     default claude-sonnet-4-6
//   OPENAI_API_KEY      sk-…           (fallback)
//   OPENAI_MODEL        default gpt-4o-mini
// ============================================================

export type LLMResult =
  | { ok: true; text: string; provider: "anthropic" | "openai" }
  | { ok: false; error: string };

type LLMOptions = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

export async function callLLM(opts: LLMOptions): Promise<LLMResult> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (anthropicKey) return callAnthropic(anthropicKey, opts);
  if (openaiKey) return callOpenAI(openaiKey, opts);
  return { ok: false, error: "No LLM key configured (set ANTHROPIC_API_KEY or OPENAI_API_KEY)" };
}

// ── Claude (Anthropic Messages API) ──────────────────────────
async function callAnthropic(key: string, opts: LLMOptions): Promise<LLMResult> {
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.4,
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error?.message ?? `Anthropic HTTP ${res.status}` };
    }
    const text = (json?.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();
    if (!text) return { ok: false, error: "Empty response from Claude" };
    return { ok: true, text, provider: "anthropic" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Anthropic request failed" };
  }
}

// ── OpenAI (Chat Completions API) ────────────────────────────
async function callOpenAI(key: string, opts: LLMOptions): Promise<LLMResult> {
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.4,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error?.message ?? `OpenAI HTTP ${res.status}` };
    }
    const text = json?.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: "Empty response from OpenAI" };
    return { ok: true, text, provider: "openai" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "OpenAI request failed" };
  }
}
