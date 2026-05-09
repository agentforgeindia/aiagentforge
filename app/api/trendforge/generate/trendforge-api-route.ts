import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.user_id || !body?.image_url || !body?.trend_id || !body?.hidden_prompt) {
      return NextResponse.json(
        { success: false, error: "Missing required TrendForge generation fields." },
        { status: 400 },
      );
    }

    const webhookUrl =
      process.env.N8N_TRENDFORGE_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_N8N_TRENDFORGE_WEBHOOK ||
      process.env.NEXT_PUBLIC_N8N_GENERATE_WEBHOOK;

    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: "TrendForge webhook URL is not configured." },
        { status: 500 },
      );
    }

    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generation_type: "trendforge",
        user_id: body.user_id,
        image_url: body.image_url,
        trend_id: body.trend_id,
        trend_name: body.trend_name,
        trend_category: body.trend_category,
        hidden_prompt: body.hidden_prompt,
        credits: body.credits || 17,
      }),
    });

    const data = await n8nResponse.json().catch(() => ({}));

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || "n8n TrendForge workflow failed." },
        { status: n8nResponse.status },
      );
    }

    return NextResponse.json({
      success: true,
      image_url: data?.image_url || data?.output_url || data?.result?.image_url || "",
      output_url: data?.output_url || data?.image_url || "",
      generation_id: data?.generation_id || data?.id || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "TrendForge generation failed." },
      { status: 500 },
    );
  }
}
