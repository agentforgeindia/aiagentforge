import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "No auth token found" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const admin = createClient(supabaseUrl, serviceKey);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "User not logged in" }, { status: 401 });
  }

  const userId = user.id;

  await admin.from("generations").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}