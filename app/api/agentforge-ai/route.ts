import { NextResponse } from "next/server";

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
  try {
    const body = await req.json();

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: body.message,
        page: body.page,
        history: body.history || [],
        source: "agentforge-website",
        context: getPageContext(body.page || ""),
      }),
    });

    const data = await response.json();

    console.log("N8N RESPONSE:", data);

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