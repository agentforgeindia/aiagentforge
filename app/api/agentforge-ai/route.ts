import { NextResponse } from "next/server";

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