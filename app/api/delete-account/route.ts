import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, anonKey);
  const admin = createClient(supabaseUrl, serviceKey);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
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