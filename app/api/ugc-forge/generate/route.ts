import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const webhookUrl = process.env.N8N_UGC_FORGE_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "N8N_UGC_FORGE_WEBHOOK_URL is missing" },
        { status: 500 }
      );
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

console.log("N8N STATUS:", response.status);
console.log("N8N RAW RESPONSE:", text);

let data: any = null;
try {
  data = text ? JSON.parse(text) : null;
} catch {
  data = { raw: text };
}

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "n8n webhook failed", details: data },
        { status: response.status }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "n8n returned empty response", status: response.status },
        { status: 500 }
      );
    }


    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "UGCForge generation failed" },
      { status: 500 }
    );
  }
}