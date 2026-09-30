// ============================================================
// VALIDATE & NORMALIZE (v6) — supports the current /jewellery-ai page payload
// Frontend bhejta hai (via app/api/jewellery/generate/route.ts):
//   { generation_mode, generation_id, user_id, required_credits,
//     source_image_url, batch_id, items[], shared_settings }
// ============================================================

const incoming = $json.body ?? $json;
const nestedPayload = incoming.payload || {};
const nestedShared  = incoming.shared_settings || nestedPayload.shared_settings || {};

const body = {
  ...incoming,
  ...nestedPayload,
  ...nestedShared,
  items: incoming.items || nestedPayload.items || [],
  shared_settings: nestedShared,
};

const clean = (v, fallback = "") =>
  v === undefined || v === null || String(v).trim() === "" ? fallback : String(v).trim();
const asBool  = (v) => v === true || v === "true" || v === 1 || v === "1";
const asArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);

// ---- MODE ----
let mode = clean(body.mode || body.generation_mode).toLowerCase();
if (!mode) mode = (Array.isArray(body.items) && body.items.length > 1) ? "bulk" : "single";
if (mode !== "single" && mode !== "bulk") throw new Error("invalid mode: " + mode);

// ---- IDs ----
if (!body.user_id) throw new Error("user_id missing");
const generationId = clean(body.generation_id || nestedPayload.generation_id);
if (!generationId) throw new Error("generation_id missing");

// ---- SOURCE IMAGE ----
const sourceUrl = clean(
  body.source_image_url ||
  body.product_image_url ||
  body.jewellery_image_url ||
  body.image_url ||
  body.design_url
);

// ---- BRAND (only fields user has toggled ON come pre-filtered from frontend) ----
const brand = body.company_details || body.brand_details || {};
const brandDetails = {
  logo_url:     clean(brand.logo_url     || body.company_logo_url || body.logo_url),
  company_name: clean(brand.company_name || body.company_name     || body.brand_name),
  website:      clean(brand.website      || body.company_website  || body.website),
  phone:        clean(brand.phone        || body.company_phone    || body.phone || body.whatsapp),
  address:      clean(brand.address      || body.company_address  || body.address),
};
const hasAnyBrandText = Boolean(brandDetails.company_name || brandDetails.website || brandDetails.phone || brandDetails.address);

// ---- MORE JEWELLERY ----
const moreJewellery = asArray(body.more_jewellery || body.moreJewellery)
  .map(String).map(s => s.trim()).filter(Boolean);

// ---- NORMALIZED SHARED SETTINGS ----
const normalized = {
  source_image_url:   sourceUrl,
  model_image_url:    clean(body.model_image_url || body.model_photo_url),
  reference_scene_url: clean(body.reference_scene_url),
  has_uploaded_scene: Boolean(body.reference_scene_url),
  has_uploaded_model: asBool(body.has_uploaded_model) || Boolean(body.model_image_url) || Boolean(body.model_photo_url),

  jewellery_type:    clean(body.jewellery_type, "Ring"),
  more_jewellery:    moreJewellery,
  custom_jewellery:  clean(body.custom_jewellery),

  output_type:       clean(body.output_type, "Studio Professional"),
  shoot_style:       clean(body.shoot_style, "Studio Professional"),
  outdoor_background: clean(body.outdoor_background),
  studio_pose:        clean(body.studio_pose),
  // v6: Studio Professional jewellery set (name + resolved set description)
  studio_background:  clean(body.studio_background),
  studio_set:         clean(body.studio_set),

  model_type:        clean(body.model_type, "No Model"),
  // v6: Female / Male tabs on the page ("" for No Model)
  model_gender:      clean(body.model_gender),
  // v6: No Model sends an empty pose — keep it empty (no human in frame)
  pose:              String(body.model_type || "").toLowerCase().includes("no model") ? "" : clean(body.pose, "Auto Pose"),
  model_look:        clean(body.model_look, "Indian Model"),
  face_expression:   clean(body.face_expression, "Soft Smile"),

  accessories:       clean(body.accessories, "No Accessories"),
  camera_angle:      clean(body.camera_angle, "Auto Angle"),
  output_size:       clean(body.output_size, "Square 1080x1080"),
  output_quality:    clean(body.output_quality || body.quality, "Premium"),

  jewellery_notes:   clean(body.jewellery_notes || body.jewellery_details),
  // Hidden hard rules from the frontend — pipe-separated string.
  style_directives:  String(body.style_directives || "").trim(),
  model_notes:       clean(body.model_notes),
  custom_instruction: clean(body.custom_instruction),

  brand_details:     brandDetails,
  has_brand_text:    hasAnyBrandText,
  af_watermark:      asBool(body.af_watermark ?? body.watermark_required ?? body.is_free_account ?? body.free_account),
  reserve_second_corner: asBool(body.af_watermark ?? body.watermark_required ?? body.is_free_account ?? body.free_account),
  // bottom strip reserve only when frontend ne kuch brand text toggle ON kiya hai
  reserve_bottom_strip: hasAnyBrandText,

  plan:              clean(body.plan, "starter").toLowerCase(),
  required_credits:  Number(body.required_credits || 0),
  outputs_per_product: Number(body.outputs_per_product || 1),
};

if (mode === "single") {
  if (!sourceUrl) throw new Error("source_image_url missing for single mode");
  return [{
    json: {
      mode: "single",
      ack: {
        success: true,
        mode: "single",
        generation_id: generationId,
        message: "Jewellery generation accepted"
      },
      payload: {
        generation_id: generationId,
        user_id: clean(body.user_id),
        batch_id: clean(body.batch_id) || `jewellery-${Date.now()}`,
        ...normalized
      }
    }
  }];
}

// mode === "bulk"
let items = Array.isArray(body.items) ? body.items : [];
if (!items.length) {
  if (!sourceUrl) throw new Error("bulk items missing");
  items = [{ generation_id: generationId, source_image_url: sourceUrl, original_name: clean(body.original_name || "jewellery-image") }];
}
items = items.map((item, index) => ({
  generation_id: clean(item.generation_id || item.id) || (index === 0 ? generationId : ""),
  source_image_url: clean(item.source_image_url || item.product_image_url || item.image_url || sourceUrl),
  original_name: clean(item.original_name || item.name || `jewellery-${index + 1}`),
})).filter(it => it.generation_id && it.source_image_url);

if (!items.length) throw new Error("bulk items invalid — no generation_id or source_image_url");

return [{
  json: {
    mode: "bulk",
    ack: {
      success: true,
      mode: "bulk",
      batch_id: clean(body.batch_id) || null,
      generation_ids: items.map(it => it.generation_id),
      message: "Bulk jewellery generation accepted"
    },
    payload: {
      generation_id: generationId,
      user_id: clean(body.user_id),
      batch_id: clean(body.batch_id) || null,
      items,
      shared_settings: normalized
    }
  }
}];