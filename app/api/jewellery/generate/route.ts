import { NextRequest, NextResponse } from "next/server";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

const webhookUrl = process.env.N8N_JEWELLERY_WEBHOOK_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createGenerationRows(body: any) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase env for generation row creation.");
  }

  const rows =
    body.generation_mode === "single"
      ? [
          {
            id: body.generation_id,
            status: "pending",
          },
        ]
      : (body.items || []).map((item: any) => ({
          id: item.generation_id,
          status: "pending",
        }));

  const response = await fetch(`${supabaseUrl}/rest/v1/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
    cache: "no-store",
  });

  const rawText = await response.text();

  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = { raw: rawText };
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || rawText || "Failed to create generation rows.");
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    if (!webhookUrl) {
      return NextResponse.json(
        {
          error: "Missing env: N8N_JEWELLERY_WEBHOOK_URL",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body?.generation_mode) {
      return NextResponse.json(
        { error: "generation_mode is required" },
        { status: 400 }
      );
    }

    // Create pending rows first so frontend can poll the same generation id.
    await createGenerationRows(body);

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const rawText = await webhookResponse.text();

    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = { raw: rawText };
    }

    if (!webhookResponse.ok) {
      return NextResponse.json(
        {
          error: data?.error || data?.message || "n8n webhook request failed",
          details: data,
        },
        { status: webhookResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      mode: body.generation_mode,
      generation_id: body.generation_mode === "single" ? body.generation_id : undefined,
      generation_ids:
        body.generation_mode === "bulk"
          ? body.items?.map((item: any) => item.generation_id)
          : undefined,
      batch_id: body.generation_mode === "bulk" ? body.batch_id : undefined,
      message:
        body.generation_mode === "single"
          ? "Jewellery generation started."
          : "Bulk jewellery generation started.",
      webhook_response: data,
    });
  } catch (error) {
    console.error("JEWELLERY ROUTE ERROR:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
