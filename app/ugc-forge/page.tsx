"use client";

import { useMemo, useState } from "react";
import {
  Upload,
  Sparkles,
  Camera,
  Wand2,
  MessageCircle,
  Crown,
  Loader2,
  ImageIcon,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  UserRound,
  Package,
  Palette,
  Building2,
  Gem,
  Shirt,
  ShoppingBag,
  Smartphone,
  BadgeCheck,
  Download,
  Copy,
} from "lucide-react";

import {
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaWhatsapp,
} from "react-icons/fa";

const productTypes = [
  { id: "saree", title: "Saree", desc: "Ethnic drape branding", icon: Shirt },
  { id: "jewellery", title: "Jewellery", desc: "Luxury jewellery styling", icon: Gem },
  { id: "cosmetics", title: "Cosmetics", desc: "Beauty product UGC", icon: Sparkles },
  { id: "fashion", title: "Fashion", desc: "Clothing & accessories", icon: ShoppingBag },
  { id: "gadget", title: "Gadget", desc: "Tech/product promo", icon: Smartphone },
  { id: "other", title: "Other", desc: "Custom product shoot", icon: Package },
];

const poses = [
  {
    id: "holding product front pose",
    title: "Holding Product",
    desc: "Creator holding/displaying product clearly.",
    icon: Package,
  },
  {
    id: "premium standing model pose",
    title: "Premium Standing",
    desc: "Catalogue-style full/half body pose.",
    icon: UserRound,
  },
  {
    id: "mirror selfie influencer pose",
    title: "Mirror Selfie",
    desc: "Natural influencer-style lifestyle shot.",
    icon: Camera,
  },
  {
    id: "testimonial ad pose",
    title: "Testimonial",
    desc: "Trust-building review style UGC ad.",
    icon: MessageCircle,
  },
  {
    id: "luxury editorial pose",
    title: "Editorial Luxury",
    desc: "High-fashion campaign style image.",
    icon: Crown,
  },
  {
    id: "walking outdoor brand pose",
    title: "Outdoor Walk",
    desc: "Street/lifestyle brand-ready pose.",
    icon: Sparkles,
  },
];

const backgrounds = [
  "Luxury Studio",
  "Modern Apartment",
  "Indian Festive",
  "Cafe Lifestyle",
  "Premium Outdoor",
  "Clean White BG",
  "Dark Luxury",
  "Office Founder",
];

const beautyModes = [
  "Natural Beautify",
  "Soft Makeup",
  "Glam Makeup",
  "Editorial Skin",
  "Luxury Lighting",
  "No Extra Makeup",
];

const platforms = [
  { id: "instagram", label: "Instagram", icon: FaInstagram },
  { id: "youtube", label: "YouTube", icon: FaYoutube },
  { id: "linkedin", label: "LinkedIn", icon: FaLinkedin },
  { id: "whatsapp", label: "WhatsApp", icon: FaWhatsapp },
];

const safetyWords = [
  "nude",
  "nudity",
  "naked",
  "lingerie",
  "bikini",
  "transparent",
  "adult",
  "sexual",
  "erotic",
  "onlyfans",
  "underage",
  "minor",
  "celebrity",
  "superstar",
  "actor",
  "actress",
  "politician",
];

export default function UGCForgePage() {
  const [selectedProduct, setSelectedProduct] = useState("saree");
  const [selectedPose, setSelectedPose] = useState("holding product front pose");
  const [platform, setPlatform] = useState("instagram");
  const [brandName, setBrandName] = useState("AgentForge");
  const [tone, setTone] = useState("premium viral");
  const [language, setLanguage] = useState("hinglish");
  const [creatorImageUrl, setCreatorImageUrl] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [background, setBackground] = useState("Luxury Studio");
  const [beautyMode, setBeautyMode] = useState("Natural Beautify");
  const [customInstruction, setCustomInstruction] = useState("");
  const [hasRights, setHasRights] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const selectedProductLabel = useMemo(() => {
    return productTypes.find((item) => item.id === selectedProduct)?.title || "Product";
  }, [selectedProduct]);

  function hasUnsafeInstruction() {
    const text = `${customInstruction} ${tone} ${background} ${beautyMode}`.toLowerCase();
    return safetyWords.some((word) => text.includes(word));
  }

  async function handleGenerate() {
    if (!creatorImageUrl.trim()) {
      alert("Creator/model photo URL add karo pehle.");
      return;
    }

    if (!productImageUrl.trim()) {
      alert("Product photo URL add karo pehle.");
      return;
    }

    if (!hasRights) {
      alert("Please confirm karo ki creator image use karne ki permission aapke paas hai.");
      return;
    }

    if (hasUnsafeInstruction()) {
      setResult({
        success: false,
        status: "blocked",
        output_url: "",
        hook: "Request blocked for safety.",
        caption:
          "Nudity, adult styling, celebrity/public figure misuse, or unsafe identity use is not supported.",
        cta: "Please use an owned/consented creator photo and safe branding instructions.",
        message: "Unsafe request detected.",
      });
      return;
    }

    const generationId = crypto.randomUUID();

    setLoading(true);
    setResult({
      success: true,
      status: "processing",
      generation_id: generationId,
      output_url: "",
      hook: "Preserving face identity and preparing brand shoot...",
      caption: "Creating premium UGC visual with your product...",
      cta: "Preparing platform-ready output...",
      message: "UGC Studio generation started.",
    });

    try {
      const res = await fetch("/api/ugc-forge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generation_id: generationId,
          creator_image_url: creatorImageUrl,
          product_image_url: productImageUrl,
          brand_name: brandName,
          product_type: selectedProduct,
          pose: selectedPose,
          background,
          beauty_mode: beautyMode,
          language,
          tone,
          platform,
          identity_rule:
            "Preserve the same creator face and identity. Do not change face, age, ethnicity, or facial structure. Beautify only with natural makeup, clean skin, premium lighting.",
          safety_rule:
            "Block nudity, sexualized styling, minors, celebrity/public figure misuse, political figure misuse, and non-consensual identity use.",
          custom_instruction: customInstruction,
        }),
      });

      const text = await res.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (!res.ok && data?.error !== "n8n returned empty response") {
        throw new Error(data?.error || "Generation failed");
      }

      setResult({
        success: true,
        status: data?.status || "processing",
        generation_id: data?.generation_id || generationId,
        output_url: data?.output_url || data?.image_url || "",
        hook:
          data?.hook ||
          `${selectedProductLabel} brand shoot ready without real photoshoot.`,
        caption:
          data?.caption ||
          `Upload your photo + product and generate premium AI UGC branding content with preserved face identity.`,
        cta: data?.cta || "Create your AI brand shoot with AgentForge.",
        message:
          data?.message ||
          "Generation request sent. If backend is still processing, output will appear after completion.",
      });
    } catch (error: any) {
      setResult({
        success: false,
        status: "failed",
        output_url: "",
        hook: "Generation request could not complete.",
        caption: error?.message || "Something went wrong.",
        cta: "Please check n8n execution and try again.",
        message: error?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-white">
      <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.20),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0),rgba(14,165,233,0.05))]" />

        <div className="mx-auto max-w-7xl">
          <div className="mb-8 rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-600 dark:text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  New Agent · UGC Studio AI
                </div>

                <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Your Face. Your Product. AI Brand Shoot in Seconds.
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                  Upload creator/model photo and product photo. Choose pose, background and beauty style. AgentForge creates premium UGC-style branding content while keeping the same face identity.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                    2 Uploads → 1 Brand Shoot
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
                    Same Face Preserved
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
                    Safe UGC Guardrails
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/60 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-1 shadow-2xl shadow-blue-500/20 dark:border-white/10">
                <div className="rounded-[1.8rem] bg-white/95 p-5 dark:bg-slate-950/90">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Live Preview</p>
                      <h3 className="text-xl font-black">UGC Brand Shoot</h3>
                    </div>
                    <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-500">
                      <Wand2 className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="aspect-[9/12] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5">
                    {result?.output_url ? (
                      <img src={result.output_url} alt="UGC Generated Output" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                        <div className="mb-5 grid grid-cols-2 gap-3">
                          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-cyan-400/50 bg-cyan-400/10 text-cyan-500">
                            <UserRound className="h-9 w-9" />
                          </div>
                          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-purple-400/50 bg-purple-400/10 text-purple-500">
                            <Package className="h-9 w-9" />
                          </div>
                        </div>
                        <p className="text-lg font-black">Creator + Product Preview</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {result?.message || "Generated branding image will appear here after processing."}
                        </p>
                      </div>
                    )}
                  </div>

                  {result && (
                    <div className={`mt-4 rounded-2xl border p-4 ${result.success === false ? "border-red-400/30 bg-red-400/10" : "border-emerald-400/30 bg-emerald-400/10"}`}>
                      <div className={`flex items-center gap-2 text-sm font-black ${result.success === false ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>
                        {result.success === false ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {result.status === "processing" ? "Generation Started" : result.success === false ? "Request Blocked / Failed" : "Generated Successfully"}
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{result.hook}</p>
                    </div>
                  )}

                  {result?.output_url && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <a href={result.output_url} download className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                        <Download className="h-4 w-4" /> Download
                      </a>
                      <button onClick={() => navigator.clipboard?.writeText(result.output_url)} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black dark:border-white/10 dark:bg-white/5">
                        <Copy className="h-4 w-4" /> Copy Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
              <h2 className="text-2xl font-black">1. Upload Creator & Product</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Creator ka face same rahega. Product ko branding scene mein naturally integrate kiya jayega.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold">
                    <UserRound className="h-4 w-4 text-cyan-500" /> Creator / Model Photo URL
                  </label>
                  <div className="flex gap-3">
                    <input value={creatorImageUrl} onChange={(e) => setCreatorImageUrl(e.target.value)} placeholder="https://creator-photo-url..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-cyan-400/30 focus:ring-4 dark:border-white/10 dark:bg-white/5" />
                    <button type="button" className="rounded-2xl bg-slate-900 px-4 text-white dark:bg-white dark:text-slate-950">
                      <Upload className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Rule: face change nahi hoga, sirf beautify + lighting upgrade.</p>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold">
                    <Package className="h-4 w-4 text-purple-500" /> Product Photo URL
                  </label>
                  <div className="flex gap-3">
                    <input value={productImageUrl} onChange={(e) => setProductImageUrl(e.target.value)} placeholder="https://product-photo-url..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-cyan-400/30 focus:ring-4 dark:border-white/10 dark:bg-white/5" />
                    <button type="button" className="rounded-2xl bg-slate-900 px-4 text-white dark:bg-white dark:text-slate-950">
                      <Upload className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">Brand Name</label>
                  <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-cyan-400/30 focus:ring-4 dark:border-white/10 dark:bg-white/5" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5">
                      <option value="hinglish">Hinglish</option>
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                      <option value="punjabi">Punjabi</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">Tone</label>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5">
                      <option value="premium viral">Premium Viral</option>
                      <option value="luxury">Luxury</option>
                      <option value="emotional">Emotional</option>
                      <option value="funny relatable">Funny Relatable</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                </div>

                <label className="flex gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm text-slate-700 dark:text-slate-200">
                  <input type="checkbox" checked={hasRights} onChange={(e) => setHasRights(e.target.checked)} className="mt-1 h-4 w-4" />
                  <span>
                    I confirm that I own this creator image or have permission to use it. Celebrity/public figure misuse, nudity and unsafe content will be blocked.
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                <h2 className="text-2xl font-black">2. Select Product Type</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Product ke hisaab se styling, pose and prompt better banega.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {productTypes.map((item) => {
                    const Icon = item.icon;
                    const active = selectedProduct === item.id;
                    return (
                      <button key={item.id} type="button" onClick={() => setSelectedProduct(item.id)} className={`rounded-3xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-xl ${active ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"}`}>
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-black">{item.title}</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                <h2 className="text-2xl font-black">3. Choose Pose</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Creator apni marzi se model ban sakta hai — but face identity same rahegi.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {poses.map((item) => {
                    const Icon = item.icon;
                    const active = selectedPose === item.id;
                    return (
                      <button key={item.id} type="button" onClick={() => setSelectedPose(item.id)} className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${active ? "border-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"}`}>
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-black">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                  <h2 className="flex items-center gap-2 text-xl font-black"><Building2 className="h-5 w-5 text-cyan-500" /> Background</h2>
                  <select value={background} onChange={(e) => setBackground(e.target.value)} className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5">
                    {backgrounds.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                  <h2 className="flex items-center gap-2 text-xl font-black"><Palette className="h-5 w-5 text-purple-500" /> Beauty Mode</h2>
                  <select value={beautyMode} onChange={(e) => setBeautyMode(e.target.value)} className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5">
                    {beautyModes.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                <h2 className="text-2xl font-black">4. Platform & Instructions</h2>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {platforms.map((item) => {
                    const Icon = item.icon;
                    const active = platform === item.id;
                    return (
                      <button key={item.id} type="button" onClick={() => setPlatform(item.id)} className={`rounded-2xl border px-4 py-4 text-sm font-bold transition ${active ? "border-blue-400 bg-blue-400/10 text-blue-600 dark:text-blue-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}>
                        <Icon className="mx-auto mb-2 h-5 w-5" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-bold">Custom Instruction</label>
                  <textarea value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)} placeholder="Example: saree ko premium festive background mein showcase karo, creator ka face same rahe, soft makeup and luxury lighting..." rows={4} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-cyan-400/30 focus:ring-4 dark:border-white/10 dark:bg-white/5" />
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-cyan-700 dark:text-cyan-300">
                    <ShieldCheck className="h-4 w-4" /> Safety & Identity Rules Active
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Same face preserved. No nudity. No celebrity/public figure misuse. No unsafe or non-consensual generation.
                  </p>
                </div>

                <button onClick={handleGenerate} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-blue-500/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Generating UGC Brand Shoot...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" /> Generate UGC Brand Shoot
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {result && (
            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
              <h2 className="text-2xl font-black">Generated Copy</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                  <p className="flex items-center gap-2 text-sm font-bold text-cyan-500"><BadgeCheck className="h-4 w-4" /> Hook</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{result.hook}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                  <p className="text-sm font-bold text-blue-500">Caption</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{result.caption}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                  <p className="text-sm font-bold text-purple-500">CTA</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{result.cta}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
