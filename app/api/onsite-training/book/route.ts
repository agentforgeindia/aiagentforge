// POST /api/onsite-training/book  (PUBLIC)
// A textile business books a free on-site AI training visit — only 3 fixed
// dates/cities are open (7 Jul Pune, 8 Jul Satara, 9 Jul Kolhapur). Stores
// the request (+ any showroom/product photos) and opens a support task
// (type = 'demo') so the team confirms on WhatsApp/call.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB per photo
const MAX_PHOTOS = 6;
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_DATES = new Set(["2026-07-07", "2026-07-08", "2026-07-09"]);

function rand() {
  return Math.random().toString(36).slice(2, 8);
}

async function uploadPhoto(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("Each photo must be under 12 MB.");
  if (file.type && !ALLOWED.includes(file.type)) throw new Error("Only PNG/JPG/WEBP photos are allowed.");
  const safe = (file.name || "photo").replace(/[^a-zA-Z0-9.-]/g, "-").slice(-40);
  const path = `onsite-training/${Date.now()}-${rand()}-${safe}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await db.storage.from("designs").upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return db.storage.from("designs").getPublicUrl(path).data.publicUrl;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const companyName = String(form.get("company_name") || "").trim();
    const contactPerson = String(form.get("contact_person") || "").trim();
    const mobile = String(form.get("mobile") || "").trim();
    const email = String(form.get("email") || "").trim();
    const city = String(form.get("city") || "").trim();
    const address = String(form.get("address") || "").trim();
    const industryType = String(form.get("industry_type") || "").trim();
    const staffCount = String(form.get("staff_count") || "").trim();
    const notes = String(form.get("notes") || "").trim();
    const preferredDate = String(form.get("preferred_date") || "").trim();
    const preferredTime = String(form.get("preferred_time") || "").trim();
    const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

    const mobileDigits = mobile.replace(/\D/g, "");

    if (!companyName) return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    if (!contactPerson) return NextResponse.json({ error: "Contact person is required." }, { status: 400 });
    if (mobileDigits.length < 8 || mobileDigits.length > 15)
      return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
    if (!city) return NextResponse.json({ error: "Please choose a city visit date." }, { status: 400 });
    if (!ALLOWED_DATES.has(preferredDate))
      return NextResponse.json({ error: "Please choose one of the available visit dates." }, { status: 400 });
    if (!preferredTime) return NextResponse.json({ error: "Please pick a preferred time." }, { status: 400 });
    if (photos.length > MAX_PHOTOS)
      return NextResponse.json({ error: `You can upload up to ${MAX_PHOTOS} photos.` }, { status: 400 });

    const photoUrls: string[] = [];
    for (const photo of photos) {
      photoUrls.push(await uploadPhoto(photo));
    }

    const { data: task } = await db
      .from("tasks")
      .insert({
        title: `On-site training request — ${companyName} (${city})`,
        description: [
          `Contact: ${contactPerson}`,
          `Mobile: ${mobile}`,
          `Email: ${email || "—"}`,
          `City: ${city}`,
          `Address: ${address || "—"}`,
          `Industry: ${industryType || "—"}`,
          `Staff attending: ${staffCount || "—"}`,
          `Visit date/time: ${preferredDate} · ${preferredTime}`,
          photoUrls.length ? `Photos: ${photoUrls.join(", ")}` : "",
          notes ? `Notes: ${notes}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        type: "demo",
        status: "pending",
        priority: "high",
      })
      .select("id")
      .single();

    const { error } = await db.from("onsite_training_bookings").insert({
      company_name: companyName,
      contact_person: contactPerson,
      mobile,
      email: email || null,
      city,
      address: address || null,
      industry_type: industryType || null,
      staff_count: staffCount || null,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      photo_urls: photoUrls.length ? photoUrls : null,
      notes: notes || null,
      task_id: task?.id ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not submit. Please try again." }, { status: 400 });
  }
}
