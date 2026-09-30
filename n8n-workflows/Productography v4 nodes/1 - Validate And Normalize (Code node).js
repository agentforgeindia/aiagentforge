// ============================================================
// PRODUCTOGRAPHY — Validate & Normalize
// Detects single vs bulk and routes accordingly.
// Accepts:
//   Single: { generation_id, user_id, product_image_url, ...settings }
//   Bulk:   { generation_mode:'bulk', user_id, items:[...], shared_settings:{...} }
// ============================================================

const incoming = $json.body ?? $json;
const nestedShared = incoming.shared_settings || {};
const body = { ...incoming, ...nestedShared };

const clean = (v, fallback = "") =>
  v === undefined || v === null || String(v).trim() === "" ? fallback : String(v).trim();
const asBool = (v) => v === true || v === "true" || v === 1 || v === "1";

if (!body.user_id) throw new Error("user_id missing");

const rawMode = clean(body.generation_mode || body.mode).toLowerCase();
const hasItemsArray = Array.isArray(body.items) && body.items.length > 0;
const isBulk = rawMode === "bulk" || (hasItemsArray && body.items.length > 1);
const mode = isBulk ? "bulk" : "single";

// Brand details (logo stripped — overlay happens client-side via Canvas)
const brand = body.brand_details || body.company_details || {};
const brandDetails = {
  logo_url:     "",
  company_name: clean(brand.company_name || body.company_name),
  phone:        clean(brand.phone_number || brand.phone || body.company_phone),
  website:      clean(brand.website || body.company_website),
  address:      clean(brand.address || body.company_address),
};

const shared = {
  reference_scene_url: clean(body.reference_scene_url),
  model_photo_url: clean(body.model_photo_url || body.model_image_url),
  model_image_url: clean(body.model_image_url || body.model_photo_url),
  has_uploaded_model: Boolean(body.model_photo_url || body.model_image_url),
  product_category: clean(body.product_category || body.product_type, "Cosmetics"),
  model_usage:      clean(body.model_usage, "Without Model"),
  model_look:       clean(body.model_look || body.model_type, "Indian"),
  shoot_style:      clean(body.shoot_style, "Luxury Studio"),
  background_style: clean(body.background_style || body.background, "Plain White"),
  model_group:      clean(body.model_group),
  pose:             clean(body.pose, "Auto"),
  background_theme: clean(body.background_theme),
  studio_pose:      clean(body.studio_pose),
  studio_background: clean(body.studio_background),
  studio_set:       clean(body.studio_set),
  output_size:      clean(body.output_size, "1080x1080"),
  output_quality:   clean(body.output_quality || body.quality, "Premium"),
  brand_details:    brandDetails,
  af_watermark:     asBool(body.af_watermark ?? body.reserve_second_corner),
  reserve_second_corner: asBool(body.reserve_second_corner ?? body.af_watermark),
  custom_instruction: clean(body.custom_instruction),
  required_credits:   Number(body.required_credits || body.credits_required || 15),
  outputs_per_product: Number(body.outputs_per_product || 1),
};

if (mode === "single") {
  const sourceUrl = clean(
    body.product_image_url ||
    body.design_url ||
    body.input_image_url ||
    body.source_image_url ||
    body.image_url
  );
  const generationId = clean(body.generation_id);
  if (!generationId) throw new Error("generation_id missing for single mode");
  if (!sourceUrl) throw new Error("product_image_url missing for single mode");

  return [{
    json: {
      mode: "single",
      ack: {
        success: true,
        mode: "single",
        generation_id: generationId,
        message: "Productography generation accepted"
      },
      payload: {
        generation_id: generationId,
        user_id: clean(body.user_id),
        source_image_url: sourceUrl,
        product_code: clean(body.product_code || body.article_number),
        text_on_image: clean(body.text_on_image),
        ...shared
      },
      user_id: clean(body.user_id),
      generation_id: generationId,
      credit_cost: shared.required_credits
    }
  }];
}

// Bulk mode
let items = (body.items || []).map((item, idx) => ({
  generation_id: clean(item.generation_id || item.id) || `${body.batch_id || 'gen'}-${idx}`,
  source_image_url: clean(item.product_image_url || item.source_image_url || item.design_url || item.image_url),
  product_code: clean(item.product_code || item.article_number),
  text_on_image: clean(item.text_on_image),
})).filter(it => it.generation_id && it.source_image_url);

if (!items.length) throw new Error("Bulk items invalid — no generation_id or source_image_url");

return [{
  json: {
    mode: "bulk",
    ack: {
      success: true,
      mode: "bulk",
      batch_id: clean(body.batch_id) || null,
      generation_ids: items.map(it => it.generation_id),
      total_items: items.length,
      message: `Bulk productography generation accepted (${items.length} items)`
    },
    payload: {
      user_id: clean(body.user_id),
      batch_id: clean(body.batch_id) || null,
      items,
      shared_settings: shared
    },
    user_id: clean(body.user_id),
    generation_id: clean(body.batch_id) || (items[0] && items[0].generation_id) || null,
    credit_cost: shared.required_credits * items.length
  }
}];