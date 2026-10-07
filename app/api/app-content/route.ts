// GET /api/app-content  (PUBLIC)
// Live banners and offers for the Android app screens.
// Managed from Admin → App Content → Banners & Offers.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  APP_CONTENT_COLUMNS,
  APP_CONTENT_MAX,
  appContentStatus,
  type AppContentItem,
} from "@/lib/appContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = AppContentItem & { is_active: boolean };

export async function GET() {
  const empty = { ok: true, banners: [] as AppContentItem[], offers: [] as AppContentItem[] };
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json(empty);

    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db
      .from("app_content")
      .select(`${APP_CONTENT_COLUMNS}, is_active`)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;

    const now = Date.now();
    const live = ((data as Row[] | null) ?? [])
      .filter((row) => appContentStatus(row, now) === "live")
      .map((row): AppContentItem => {
        const item: Partial<Row> = { ...row };
        delete item.is_active;
        return item as AppContentItem;
      });

    return NextResponse.json({
      ok: true,
      banners: live.filter((item) => item.kind === "banner").slice(0, APP_CONTENT_MAX.banner),
      offers: live.filter((item) => item.kind === "offer").slice(0, APP_CONTENT_MAX.offer),
    });
  } catch {
    // The app home must never break because of this.
    return NextResponse.json(empty);
  }
}
