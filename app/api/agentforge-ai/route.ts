import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rateLimit";
import { n8nHeaders } from "@/lib/generationRows";

export const runtime = "nodejs";

// Public chat widget — visitors use it before signing up, so there is
// no login check. Instead: a per-visitor rate limit and hard caps on
// what is forwarded, so it cannot be used to run up the AI bill.
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_ITEMS = 20;

type ChatTurn = { role: string; content: string };

function cleanHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => {
      const turn = (item ?? {}) as Record<string, unknown>;
      const text = turn.content ?? turn.text ?? turn.message;
      return {
        role: turn.role === "assistant" || turn.role === "bot" ? "assistant" : "user",
        content: typeof text === "string" ? text.slice(0, MAX_MESSAGE_CHARS) : "",
      };
    })
    .filter((turn) => turn.content.length > 0);
}

function getPageContext(page: string): string {
  if (page.includes("/academy")) return "academy";
  if (page.includes("/jewellery")) return "jewellery";
  if (page.includes("/textileprints") || page.includes("/textile")) return "textile";
  if (page.includes("/productography")) return "productography";
  if (page.includes("/social-ads")) return "social_ads";
  if (page.includes("/trendforge")) return "trendforge";
  if (page.includes("/pricing")) return "pricing";
  if (page.includes("/billing")) return "billing";
  if (page.includes("/ugc")) return "ugc";
  return "general";
}

export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "agentforge-ai", limit: 20, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ message: "Please type a message." }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        { message: `Please keep your message under ${MAX_MESSAGE_CHARS} characters.` },
        { status: 400 },
      );
    }
    const page = typeof body?.page === "string" ? body.page.slice(0, 200) : "";

    const webhookUrl =
      process.env.N8N_AGENTFORGE_AI_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        {
          message:
            "AgentForge AI webhook is not configured.",
        },
        { status: 500 }
      );
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: n8nHeaders(),
      body: JSON.stringify({
        message,
        page,
        history: cleanHistory(body?.history),
        source: "agentforge-website",
        context: getPageContext(page),
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const data = await response.json();


    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "AgentForge AI Error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "AgentForge AI is temporarily unavailable.",
        recommendedPlan: null,
        actions: [],
        suggestions: [
          "Textile business",
          "Jewellery business",
          "Product seller",
        ],
      },
      { status: 500 }
    );
  }
}