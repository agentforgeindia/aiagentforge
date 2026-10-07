// /api/admin/app-content — manage the banners and offers shown in the app.
//
//   GET     list everything                        (content.view)
//   POST    create — multipart form, image optional (content.publish)
//   PATCH   edit — multipart form with "id"         (content.publish)
//           or JSON { id, is_active }  → pause / resume
//           or JSON { kind, order: [ids] } → new order
//   DELETE  ?id=…                                   (content.delete)
//
// Permissions are checked on the server (lib/adminAuth.ts), not only
// by hiding buttons on the page. Every change is written to the audit log.

import { NextResponse } from "next/server";

import { auditAdminAction, requireAdminPermission, type AdminCaller } from "@/lib/adminAuth";
import {
  APP_CONTENT_ADMIN_COLUMNS,
  APP_CONTENT_LIMITS,
  cleanAppLink,
  type AppContentAudience,
  type AppContentKind,
} from "@/lib/appContent";
import { MAX_HERO_BYTES, validateImageFile } from "@/lib/uploadValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "post-images";
const FOLDER = "app-content";

const KINDS: AppContentKind[] = ["banner", "offer"];
const AUDIENCES: AppContentAudience[] = ["all", "guests", "members"];
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

type Fields = {
  title: string;
  body: string | null;
  badge: string | null;
  cta_label: string | null;
  link: string | null;
  show_text: boolean;
  audience: AppContentAudience;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

function optional(value: string, max: number, label: string): string | null | Error {
  if (!value) return null;
  if (value.length > max) return new Error(`${label} can be at most ${max} characters.`);
  return value;
}

function dateOrNull(value: string, label: string): string | null | Error {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return new Error(`${label} is not a valid date.`);
  return new Date(time).toISOString();
}

/** Reads and validates the text fields of the editor form. */
function readFields(form: FormData): Fields | Error {
  const title = text(form, "title");
  if (!title) return new Error("Title is required.");
  if (title.length > APP_CONTENT_LIMITS.title) return new Error(`Title can be at most ${APP_CONTENT_LIMITS.title} characters.`);

  const body = optional(text(form, "body"), APP_CONTENT_LIMITS.body, "Text");
  if (body instanceof Error) return body;
  const badge = optional(text(form, "badge"), APP_CONTENT_LIMITS.badge, "Highlight");
  if (badge instanceof Error) return badge;
  const cta = optional(text(form, "cta_label"), APP_CONTENT_LIMITS.cta, "Button text");
  if (cta instanceof Error) return cta;

  const link = cleanAppLink(form.get("link"));
  if (link === false) return new Error("Link must be a page like /billing or a full https:// address.");

  const audience = text(form, "audience") || "all";
  if (!AUDIENCES.includes(audience as AppContentAudience)) return new Error("Choose who should see this.");

  const starts = dateOrNull(text(form, "starts_at"), "Start date");
  if (starts instanceof Error) return starts;
  const ends = dateOrNull(text(form, "ends_at"), "End date");
  if (ends instanceof Error) return ends;
  if (starts && ends && new Date(ends).getTime() <= new Date(starts).getTime()) {
    return new Error("End date must be after the start date.");
  }

  return {
    title,
    body,
    badge,
    cta_label: cta,
    link,
    show_text: text(form, "show_text") !== "false",
    audience: audience as AppContentAudience,
    starts_at: starts,
    ends_at: ends,
    is_active: text(form, "is_active") !== "false",
  };
}

async function uploadImage(admin: AdminCaller, file: File): Promise<string | Error> {
  const check = validateImageFile(file, MAX_HERO_BYTES);
  if (!check.ok) return new Error(check.reason);
  const ext = EXT_BY_MIME[file.type.toLowerCase()] ?? "jpg";
  const path = `${FOLDER}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await admin.db.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) return new Error(`Image upload failed: ${error.message}`);
  return admin.db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Removes a replaced/deleted picture from storage — only ones this module uploaded. */
async function removeImage(admin: AdminCaller, imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;
  const marker = `/object/public/${BUCKET}/${FOLDER}/`;
  const at = imageUrl.indexOf(marker);
  if (at < 0) return;
  const name = imageUrl.slice(at + marker.length).split("?")[0];
  if (!name || name.includes("/") || name.includes("..")) return;
  try {
    await admin.db.storage.from(BUCKET).remove([`${FOLDER}/${name}`]);
  } catch {
    /* a leftover file is harmless */
  }
}

const pickedFile = (form: FormData): File | null => {
  const file = form.get("image");
  return file instanceof File && file.size > 0 ? file : null;
};

// ───────────────────────── GET ─────────────────────────
export async function GET(req: Request) {
  const admin = await requireAdminPermission(req, "content.view");
  if (admin instanceof Response) return admin;

  const { data, error } = await admin.db
    .from("app_content")
    .select(APP_CONTENT_ADMIN_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    // 42P01 / PGRST205 = the table has not been created yet.
    const missing = error.code === "42P01" || error.code === "PGRST205";
    return NextResponse.json(
      { error: missing ? "The app_content table is missing. Run sql/app-content.sql in Supabase once." : error.message, setupNeeded: missing },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, items: data ?? [] });
}

// ───────────────────────── POST (create) ─────────────────────────
export async function POST(req: Request) {
  const admin = await requireAdminPermission(req, "content.publish");
  if (admin instanceof Response) return admin;

  const form = await req.formData().catch(() => null);
  if (!form) return bad("Send the form again.");

  const kind = text(form, "kind") as AppContentKind;
  if (!KINDS.includes(kind)) return bad("Choose banner or offer.");

  const fields = readFields(form);
  if (fields instanceof Error) return bad(fields.message);

  const file = pickedFile(form);
  if (kind === "banner" && !file && !fields.show_text) {
    return bad("Add a picture, or keep the text switched on.");
  }

  let imageUrl: string | null = null;
  if (file) {
    const uploaded = await uploadImage(admin, file);
    if (uploaded instanceof Error) return bad(uploaded.message);
    imageUrl = uploaded;
  }

  // New items go to the top of their list.
  const { data: first } = await admin.db
    .from("app_content")
    .select("sort_order")
    .eq("kind", kind)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  const sortOrder = (typeof first?.sort_order === "number" ? first.sort_order : 0) - 1;

  const { data, error } = await admin.db
    .from("app_content")
    .insert({ kind, ...fields, image_url: imageUrl, sort_order: sortOrder, created_by: admin.email })
    .select(APP_CONTENT_ADMIN_COLUMNS)
    .single();

  if (error) {
    await removeImage(admin, imageUrl);
    return bad(error.message, 500);
  }
  await auditAdminAction(admin, `app_content.${kind}_created`, { type: "app_content", id: data.id }, { title: fields.title });
  return NextResponse.json({ ok: true, item: data });
}

// ───────────────────────── PATCH (edit / pause / reorder) ─────────────────────────
export async function PATCH(req: Request) {
  const admin = await requireAdminPermission(req, "content.publish");
  if (admin instanceof Response) return admin;

  const ctype = req.headers.get("content-type") || "";

  // Quick actions: pause / resume, and reorder.
  if (ctype.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { id?: unknown; is_active?: unknown; kind?: unknown; order?: unknown };

    if (Array.isArray(body.order)) {
      const kind = String(body.kind ?? "") as AppContentKind;
      const ids = body.order.map((id) => String(id)).slice(0, 300);
      if (!KINDS.includes(kind) || ids.length === 0) return bad("Nothing to reorder.");
      const results = await Promise.all(
        ids.map((id, index) =>
          admin.db.from("app_content").update({ sort_order: index, updated_at: new Date().toISOString() }).eq("id", id).eq("kind", kind),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) return bad(failed.error.message, 500);
      await auditAdminAction(admin, `app_content.${kind}_reordered`, { type: "app_content" }, { count: ids.length });
      return NextResponse.json({ ok: true });
    }

    const id = String(body.id ?? "");
    if (!id || typeof body.is_active !== "boolean") return bad("id and is_active are required.");
    const { data, error } = await admin.db
      .from("app_content")
      .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(APP_CONTENT_ADMIN_COLUMNS)
      .maybeSingle();
    if (error) return bad(error.message, 500);
    if (!data) return bad("This item no longer exists.", 404);
    await auditAdminAction(admin, body.is_active ? "app_content.resumed" : "app_content.paused", { type: "app_content", id }, { title: data.title });
    return NextResponse.json({ ok: true, item: data });
  }

  // Full edit from the editor form.
  const form = await req.formData().catch(() => null);
  if (!form) return bad("Send the form again.");
  const id = text(form, "id");
  if (!id) return bad("id is required.");

  const { data: current } = await admin.db.from("app_content").select("id, kind, image_url").eq("id", id).maybeSingle();
  if (!current) return bad("This item no longer exists.", 404);

  const fields = readFields(form);
  if (fields instanceof Error) return bad(fields.message);

  const file = pickedFile(form);
  const removeCurrent = text(form, "remove_image") === "true";
  const willHaveImage = !!file || (!!current.image_url && !removeCurrent);
  if (current.kind === "banner" && !willHaveImage && !fields.show_text) {
    return bad("Add a picture, or keep the text switched on.");
  }

  let imageUrl: string | null = current.image_url;
  if (file) {
    const uploaded = await uploadImage(admin, file);
    if (uploaded instanceof Error) return bad(uploaded.message);
    imageUrl = uploaded;
  } else if (removeCurrent) {
    imageUrl = null;
  }

  const { data, error } = await admin.db
    .from("app_content")
    .update({ ...fields, image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(APP_CONTENT_ADMIN_COLUMNS)
    .single();

  if (error) {
    if (file) await removeImage(admin, imageUrl);
    return bad(error.message, 500);
  }
  if (imageUrl !== current.image_url) await removeImage(admin, current.image_url);
  await auditAdminAction(admin, `app_content.${current.kind}_edited`, { type: "app_content", id }, { title: fields.title });
  return NextResponse.json({ ok: true, item: data });
}

// ───────────────────────── DELETE ─────────────────────────
export async function DELETE(req: Request) {
  const admin = await requireAdminPermission(req, "content.delete");
  if (admin instanceof Response) return admin;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("id is required.");

  const { data: current } = await admin.db.from("app_content").select("id, kind, title, image_url").eq("id", id).maybeSingle();
  if (!current) return NextResponse.json({ ok: true });

  const { error } = await admin.db.from("app_content").delete().eq("id", id);
  if (error) return bad(error.message, 500);

  await removeImage(admin, current.image_url);
  await auditAdminAction(admin, `app_content.${current.kind}_deleted`, { type: "app_content", id }, { title: current.title });
  return NextResponse.json({ ok: true });
}
