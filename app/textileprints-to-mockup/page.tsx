"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";
import { useAuth } from "@/app/components/AuthProvider";
import { Sparkles } from "lucide-react";
import { canGenerate } from "@/lib/checkCredits";
import { shouldDeductCredits } from "@/lib/deductCredits";

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_PRODUCTION_WEBHOOK ||
  "/api/generate-mockup";

const isEmpireProfile = (profile: any) => {
  const planText = String(
    profile?.plan ||
      profile?.package ||
      profile?.current_plan ||
      profile?.subscription_plan ||
      profile?.plan_name ||
      "",
  ).toLowerCase();

  return Boolean(
    profile?.is_empire ||
      profile?.empire_pack ||
      profile?.has_empire ||
      planText.includes("empire"),
  );
};

type IconName =
  | "pattern"
  | "indianMale"
  | "indianFemale"
  | "westernMale"
  | "westernFemale"
  | "shirt"
  | "kurta"
  | "suit"
  | "dress"
  | "saree"
  | "tshirt"
  | "camera"
  | "outdoor"
  | "studio"
  | "whitebg"
  | "luxury"
  | "none"
  | "watch"
  | "sunglasses"
  | "bracelet"
  | "square"
  | "mobile"
  | "premium"
  | "ultra"
  | "frontPose"
  | "sidePose"
  | "backPose"
  | "autoPose";

    
const ICON_EMOJI: Record<IconName, string> = {
  pattern: "🎨",
  indianMale: "👳‍♂️",
  indianFemale: "💃",
  westernMale: "🤵",
  westernFemale: "👰",
  shirt: "👔",
  kurta: "👘",
  suit: "🧥",
  dress: "👗",
  saree: "🥻",
  tshirt: "👕",
  camera: "📸",
  outdoor: "🌅",
  studio: "💡",
  whitebg: "🖼️",
  luxury: "👑",
  none: "🚫",
  watch: "⌚",
  sunglasses: "🕶️",
  bracelet: "📿",
  square: "🟦",
  mobile: "📱",
  premium: "⭐",
  ultra: "💎",
  frontPose: "😊",
  sidePose: "🚶",
  backPose: "🔙",
  autoPose: "🎲",
};

function VisualIcon({ icon }: { icon: IconName }) {
  return (
    <span
      className="flex h-11 w-11 items-center justify-center text-4xl leading-none drop-shadow-sm"
      aria-hidden="true"
      style={{ fontFamily: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif' }}
    >
      {ICON_EMOJI[icon] || "🎨"}
    </span>
  );
}

function optionIcon(title: string): IconName {
  const key = title.toLowerCase();
  if (key.includes("sunglasses")) return "sunglasses";
  if (key.includes("watch")) return "watch";
  if (key.includes("bracelet")) return "bracelet";
  if (key.includes("saree")) return "saree";
  if (key.includes("dress")) return "dress";
  if (key.includes("kurta")) return "kurta";
  if (key.includes("suit")) return "suit";
  if (key.includes("t-shirt")) return "tshirt";
  if (key.includes("shirt")) return "shirt";
  if (key.includes("indian female")) return "indianFemale";
  if (key.includes("indian male")) return "indianMale";
  if (key.includes("western female")) return "westernFemale";
  if (key.includes("western male")) return "westernMale";
  if (key.includes("female")) return "westernFemale";
  if (key.includes("male")) return "westernMale";
  if (key.includes("outdoor")) return "outdoor";
  if (key.includes("studio")) return "studio";
  if (key.includes("white")) return "whitebg";
  if (key.includes("luxury")) return "luxury";
  if (key.includes("none")) return "none";
  if (key.includes("9:16") || key.includes("1920") || key.includes("mobile")) return "mobile";
  if (key.includes("1:1") || key.includes("1080") || key.includes("square")) return "square";
  if (key.includes("ultra")) return "ultra";
  if (key.includes("premium")) return "premium";
  return "pattern";
}

function OptionCard({
  title,
  active,
  icon,
  onClick,
  darkMode,
}: {
  title: string;
  active: boolean;
  icon?: IconName;
  onClick: () => void;
  darkMode: boolean;
}) {
  const finalIcon = icon || optionIcon(title);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[108px] flex-col items-center justify-center rounded-3xl border p-3 transition active:scale-[0.98] ${
        active
          ? "border-[#24b8ff] bg-gradient-to-br from-cyan-100 to-blue-100 shadow-lg shadow-cyan-500/15"
          : darkMode
            ? "border-white/10 bg-white/[0.04] hover:border-[#24b8ff]/70"
            : "border-black/10 bg-white/85 hover:border-[#24b8ff]/70 hover:shadow-lg hover:shadow-cyan-500/10"
      }`}
    >
      <div
        className={`mb-2 flex h-16 w-16 items-center justify-center rounded-3xl ${
          active
            ? "bg-white shadow-lg shadow-cyan-400/25"
            : darkMode
              ? "bg-white/10"
              : "bg-[#eefaff] shadow-sm"
        }`}
      >
        <VisualIcon icon={finalIcon} />
      </div>

      <p
        className={`text-center text-xs font-bold leading-4 ${active ? "text-[#0077b6]" : darkMode ? "text-white/70" : "text-black/70"}`}
      >
        {title}
      </p>
    </button>
  );
}

type GenStatus = "uploading" | "ocr" | "ready" | "generating" | "done" | "failed";

type GenItem = {
  id: string;
  fileName: string;
  url: string;
  designNumber: string;
  status: GenStatus;
  resultUrl?: string;
  error?: string;
};

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);

const extractDesignNumberFromName = (fileName: string) => {
  const cleanName = fileName.replace(/\.[^/.]+$/, "");
  const match = cleanName.match(
    /(?:design|article|art|code|pattern|pat|d|a)?[-_\s]*([A-Z0-9]{2,}[-_][A-Z0-9]{2,}|[A-Z]{1,4}\d{2,}|\d{3,})/i,
  );
  return match?.[1]?.toUpperCase().replace(/_/g, "-") || "";
};

const extractDesignNumberFromText = (text: string): string => {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ");
  const patterns = [
    /\b([A-Z]{1,4}[-_]\d{2,6})\b/,
    /\b([A-Z]{1,4}\d{2,6})\b/,
    /\b(\d{4,8})\b/,
    /\b([A-Z0-9]{3,}[-_][A-Z0-9]{2,})\b/,
  ];
  for (const p of patterns) {
    const m = cleaned.toUpperCase().match(p);
    if (m) return m[1].replace(/_/g, "-");
  }
  return "";
};

export default function Home() {
  const { darkMode } = useTheme();
  const { user: authUser, credits: userCredits, refreshProfile } = useAuth();

  const user = {
    name: authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || authUser?.email?.split("@")[0] || "User",
    email: authUser?.email,
  };

  const [profile, setProfile] = useState<any>(null);
  const isEmpireUser = isEmpireProfile(profile);

  const [items, setItems] = useState<GenItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [modelType, setModelType] = useState("Indian Male");
  const [product, setProduct] = useState("Shirt");
  const [shootStyle, setShootStyle] = useState("Outdoor Premium");
  const [accessories, setAccessories] = useState<string[]>(["None"]);
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [quality, setQuality] = useState("Premium");
  const [customInstruction, setCustomInstruction] = useState("");

  const [customModelType, setCustomModelType] = useState("");
  const [customProduct, setCustomProduct] = useState("");
  const [customShootStyle, setCustomShootStyle] = useState("");
  const [customAccessory, setCustomAccessory] = useState("");
  const [customOutputSize, setCustomOutputSize] = useState("");
  const [customQuality, setCustomQuality] = useState("");

  const [watermarkPosition, setWatermarkPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  >("bottom-right");
  const [watermarkColor, setWatermarkColor] = useState<"white" | "black">("white");
  const [pose, setPose] = useState("Auto");
  const [customPose, setCustomPose] = useState("");

  const [showPromptBox, setShowPromptBox] = useState(false);
  const [showTextBox, setShowTextBox] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [cancelVisible, setCancelVisible] = useState(true);
  const cancelRef = useRef(false);

  const activeItem =
    items.find((it) => it.id === activeId) || items.find((it) => it.resultUrl) || items[0] || null;
  const previewImage = activeItem?.url || null;
  const previewResult = activeItem?.resultUrl || null;
  const showResult = !!previewResult;
  const readyItems = items.filter((it) => it.status === "ready" || it.status === "done");

  const textileFacts = [
    {
      title: "Premium catalogues sell faster",
      text: "Clean model mockups help buyers understand fabric fall, scale, and final garment feel before sampling.",
    },
    {
      title: "Design code discipline",
      text: "A visible article or pattern number on every output reduces confusion between sellers, factories, and clients.",
    },
    {
      title: "Square + Status format",
      text: "1080×1080 works best for product grids. 1080×1920 works best for WhatsApp status, Instagram stories, and quick buyer approvals.",
    },
    {
      title: "Pattern continuity matters",
      text: "For shirts and kurtas, placket alignment, border placement, and repeat scale make the mockup look premium instead of random.",
    },
    {
      title: "Client preview psychology",
      text: "When the buyer sees fabric on a model, decision time drops because imagination becomes visual proof.",
    },
  ];

  useEffect(() => {
    if (!loading) {
      setFactIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setFactIndex((current) => (current + 1) % textileFacts.length);
    }, 4500);

    setCancelVisible(true);
    const timer = window.setTimeout(() => {
      setCancelVisible(false);
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [loading, textileFacts.length]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!authUser?.id) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (!mounted) return;

      if (error) {
        console.error("Profile load error:", error);
        setProfile(null);
        return;
      }

      setProfile(data);
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [authUser?.id]);

  useEffect(() => {
    const saved = localStorage.getItem("motif_mockup_settings");
    if (!saved) return;

    const s = JSON.parse(saved);
    setModelType(s.modelType || "Indian Male");
    setProduct(s.product || "Shirt");
    setShootStyle(s.shootStyle || "Outdoor Premium");
    setAccessories(Array.isArray(s.accessories) ? s.accessories : ["None"]);
    setOutputSize(s.outputSize || "1080x1080");
    setQuality(s.quality || "Premium");
    setCustomInstruction(s.customInstruction || "");
    setCustomModelType(s.customModelType || "");
    setCustomProduct(s.customProduct || "");
    setCustomShootStyle(s.customShootStyle || "");
    setCustomAccessory(s.customAccessory || "");
    setCustomOutputSize(s.customOutputSize || "");
    setCustomQuality(s.customQuality || "");
    setWatermarkPosition(s.watermarkPosition || "bottom-right");
    setWatermarkColor(s.watermarkColor || "white");
    setPose(s.pose || "Auto");
    setCustomPose(s.customPose || "");
    setShowPromptBox(s.showPromptBox || false);
    setShowTextBox(s.showTextBox || false);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "motif_mockup_settings",
      JSON.stringify({
        modelType,
        product,
        shootStyle,
        accessories,
        outputSize,
        quality,
        customInstruction,
        customModelType,
        customProduct,
        customShootStyle,
        customAccessory,
        customOutputSize,
        customQuality,
        watermarkPosition,
        watermarkColor,
        pose,
        customPose,
        showPromptBox,
        showTextBox,
        darkMode,
      }),
    );
  }, [
    modelType,
    product,
    shootStyle,
    accessories,
    outputSize,
    quality,
    customInstruction,
    customModelType,
    customProduct,
    customShootStyle,
    customAccessory,
    customOutputSize,
    customQuality,
    watermarkPosition,
    watermarkColor,
    pose,
    customPose,
    showPromptBox,
    showTextBox,
    darkMode,
  ]);

  const getRequiredCredits = () => {
    if ((customQuality.trim() || quality) === "Ultra HD") return 20;
    if ((customOutputSize.trim() || outputSize) === "1080x1920") return 17;
    return 15;
  };

  const requiredCredits = getRequiredCredits();
  const totalCreditsNeeded = requiredCredits * Math.max(readyItems.length, 1);

  const toggleAccessory = (item: string) => {
    if (item === "None") {
      setAccessories(["None"]);
      return;
    }

    const clean = accessories.filter((x) => x !== "None");

    if (clean.includes(item)) {
      const updated = clean.filter((x) => x !== item);
      setAccessories(updated.length ? updated : ["None"]);
    } else {
      setAccessories([...clean, item]);
    }
  };

  const resolveAccessories = () => {
    const base = accessories.filter((a) => a !== "None");
    const extra = customAccessory
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const merged = [...base, ...extra];
    return merged.length ? merged.join(", ") : "None";
  };

  const runOcrOnFile = async (file: File): Promise<string> => {
    try {
      const mod: any = await import("tesseract.js");
      const Tesseract = mod.default || mod;
      const { data } = await Tesseract.recognize(file, "eng");
      return extractDesignNumberFromText(data?.text || "");
    } catch (err) {
      console.warn("OCR failed:", err);
      return "";
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const filePath = `textile-designs/${Date.now()}-${newId().slice(0, 6)}-${safeFileName}`;

    const { error } = await supabase.storage.from("designs").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (files.length > 1 && !isEmpireUser) {
      alert("Bulk generation is available only with the Empire Pack. Please upload one design at a time or upgrade to Empire Pack for bulk creation.");
      if (e.target) e.target.value = "";
      return;
    }

    const invalid = files.find((f) => !f.type.startsWith("image/"));
    if (invalid) {
      alert("Please upload image files only.");
      return;
    }

    setUploading(true);

    for (const file of files) {
      const id = newId();
      const initial: GenItem = {
        id,
        fileName: file.name,
        url: "",
        designNumber: "",
        status: "uploading",
      };
      setItems((prev) => [...prev, initial]);
      setActiveId((curr) => curr || id);

      try {
        const url = await uploadFile(file);
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, url, status: "ocr" } : it)),
        );

        let detected = extractDesignNumberFromName(file.name);
        if (!detected) {
          detected = await runOcrOnFile(file);
        }

        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, designNumber: detected, status: "ready" } : it,
          ),
        );

        if (detected) setShowTextBox(true);
      } catch (err: any) {
        console.error("Upload error:", err);
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, status: "failed", error: err?.message || "Upload failed" }
              : it,
          ),
        );
      }
    }

    setUploading(false);
    if (e.target) e.target.value = "";
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setActiveId((curr) => (curr === id ? null : curr));
  };

  const updateItemDesignNumber = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, designNumber: value.toUpperCase() } : it)),
    );
  };

  const pollGenerationResult = async (id: string) => {
    for (let attempt = 0; attempt < 36; attempt += 1) {
      if (cancelRef.current) return null;

      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Polling error:", error);
      }

      const row = data as any;
      const finalImage = row?.output_image_url || row?.output_url || row?.image_url;

      if (row?.status === "completed" && finalImage) {
        return finalImage as string;
      }

      if (row?.status === "failed") {
        throw new Error("Generation failed in n8n.");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }

    throw new Error(
      "Generation is taking longer than expected. Please keep this page open and check n8n execution if needed.",
    );
  };

  const generateOne = async (item: GenItem, userId: string): Promise<void> => {
    const generationId = newId();
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: "generating" } : it)),
    );

    const resolvedModelType = customModelType.trim() || modelType;
    const resolvedProduct = customProduct.trim() || product;
    const resolvedShootStyle = customShootStyle.trim() || shootStyle;
    const resolvedOutputSize = customOutputSize.trim() || outputSize;
    const resolvedQuality = customQuality.trim() || quality;
    const resolvedAccessories = resolveAccessories();

    const payload = {
      generation_id: generationId,
      design_url: item.url,
      model_type: resolvedModelType,
      product_type: resolvedProduct,
      shoot_style: resolvedShootStyle,
      accessories: resolvedAccessories,
      output_size: resolvedOutputSize,
      quality: resolvedQuality,
      design_number: item.designNumber.trim(),
      text_on_image: item.designNumber.trim(),
      article_number: item.designNumber.trim(),
      watermark_position: watermarkPosition,
      watermark_color: watermarkColor,
      custom_instruction: customInstruction,
    };

    const { error: dbError } = await supabase.from("generations").insert([
      {
        id: generationId,
        user_id: userId,
        design_url: item.url,
        input_image_url: item.url,
        model_type: resolvedModelType,
        product_type: resolvedProduct,
        shoot_style: resolvedShootStyle,
        accessories: resolvedAccessories,
        output_size: resolvedOutputSize,
        quality: resolvedQuality,
        model_pose: pose,
        article_number: item.designNumber.trim() || null,
        custom_instruction: customInstruction || null,
        status: "pending",
      },
    ]);

    if (dbError) {
      throw new Error(`Database record failed: ${dbError.message}`);
    }

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`n8n error ${response.status}: ${text}`);
    }

    const data = text ? JSON.parse(text) : {};
    const immediateImage =
      data?.image_url || data?.output_image_url || data?.image || data?.url;
    const finalImage = immediateImage || (await pollGenerationResult(generationId));

    if (!finalImage && cancelRef.current) return;

    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, resultUrl: finalImage || "", status: "done" } : it,
      ),
    );
    setActiveId(item.id);
  };

  const handleGenerate = async () => {
    const queue = items.filter((it) => it.status === "ready");
    if (!queue.length) {
      alert("Please upload at least one textile design first.");
      return;
    }

    const userId = authUser?.id;
    if (!userId) {
      alert("Please login to generate mockups.");
      return;
    }

    setLoading(true);
    cancelRef.current = false;

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const needed = requiredCredits * queue.length;

      if (queue.length > 1 && !isEmpireProfile(profile)) {
        alert("Bulk generation is available only with the Empire Pack. Please upgrade to Empire Pack to generate multiple textile mockups together.");
        setLoading(false);
        return;
      }

// Unlimited users bypass
if (
  profileError ||
  !profile ||
  !canGenerate(profile, needed)
) {
  alert(
    `You don't have enough credits (${needed} required for ${queue.length} mockup${queue.length > 1 ? "s" : ""}). Please recharge to continue.`,
  );

  setLoading(false);
  return;
}

// Deduct only for normal users
if (shouldDeductCredits(profile)) {

  const { error: deductError } = await supabase
    .from("profiles")
    .update({
      credits: (profile.credits || 0) - needed,
    })
    .eq("id", userId);

  if (!deductError) {
    refreshProfile();
  }
}

      for (const item of queue) {
        if (cancelRef.current) break;
        try {
          await generateOne(item, userId);
        } catch (err: any) {
          console.error("Generate error for", item.id, err);
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: "failed", error: err?.message || "Generation failed" }
                : it,
            ),
          );
        }
      }
    } catch (error: any) {
      console.error("Webhook error:", error);
      alert(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfile(false);
  };

  const handleNativeShare = async () => {
    if (!previewResult) return;

    if (navigator.share) {
      await navigator.share({
        title: "TextilePrints to Mockup AI",
        text: "Generated with AgentForge",
        url: previewResult,
      });
    } else {
      await navigator.clipboard.writeText(previewResult);
      alert("Image link copied.");
    }
  };

  const whatsappLink = previewResult
    ? `https://wa.me/?text=${encodeURIComponent(`Generated with AgentForge\n${previewResult}`)}`
    : "#";

  const handleDownloadResult = async () => {
    if (!previewResult) return;

    try {
      const response = await fetch(previewResult);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `agentforge-mockup-${activeItem?.id || Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      window.open(previewResult, "_blank", "noopener,noreferrer");
    }
  };

  const pageBg = darkMode
    ? "bg-[#070b14] text-white"
    : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/75 shadow-black/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const inputClass = darkMode
    ? "border-white/10 bg-black/30 text-white placeholder:text-white/35"
    : "border-black/10 bg-white text-black placeholder:text-black/40";

  const statusLabel: Record<GenStatus, string> = {
    uploading: "Uploading...",
    ocr: "Reading code...",
    ready: "Ready",
    generating: "Generating...",
    done: "Done",
    failed: "Failed",
  };

  const statusColor: Record<GenStatus, string> = {
    uploading: "bg-amber-500/15 text-amber-700",
    ocr: "bg-amber-500/15 text-amber-700",
    ready: "bg-emerald-500/15 text-emerald-700",
    generating: "bg-blue-500/15 text-blue-700",
    done: "bg-emerald-500/20 text-emerald-800",
    failed: "bg-rose-500/15 text-rose-700",
  };

  const renderCustomInput = (
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <div className="mt-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${inputClass}`}
      />
    </div>
  );

  return (
    <main className={`relative min-h-screen overflow-hidden ${pageBg}`}>
      <div
        className={`absolute inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.16]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div
        className={`absolute inset-0 ${
          darkMode
            ? "bg-[radial-gradient(circle_at_top_left,#00d4ff22,transparent_34%),radial-gradient(circle_at_top_right,#7c3cff22,transparent_34%)]"
            : "bg-[radial-gradient(circle_at_top_left,#06b6d433,transparent_34%),radial-gradient(circle_at_top_right,#fde04766,transparent_34%)]"
        }`}
      />

      <div className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div>
            <div
              className={`mb-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${darkMode ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border border-cyan-700/20 bg-cyan-500/15 text-cyan-900"}`}
            >
              Textile design to premium model mockup
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight lg:text-7xl">
            AI Textile Mockup Generator
            <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
             Upload Design. Get Mockup.
            </span>
             Sell Faster.
            </h1>

            <p className={`mt-6 max-w-xl text-lg leading-8 ${muted}`}>
              Generate catalogue-ready textile mockups, AI fashion model photos, kurti mockups, saree mockups, shirt mockups, and client preview images without stitching samples or expensive photoshoots.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#try"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-4 font-black text-black shadow-xl shadow-cyan-500/25 transition hover:scale-105"
              >
                Start Generating
              </a>
              <Link
                href="/gallery"
                className={`rounded-full px-7 py-4 font-black ${darkMode ? "bg-white/10 text-white" : "bg-white text-black"}`}
              >
                View Gallery
              </Link>
            </div>
          </div>

          <div
            className={`sticky top-24 self-start rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl ${card}`}
          >
            <div className="grid gap-4 sm:grid-cols-2">

              <div
                className={`flex min-h-80 items-center justify-center rounded-[1.5rem] border p-6 ${
                  darkMode
                    ? "border-white/10 bg-black/25"
                    : "border-black/10 bg-[#fffaf0]"
                }`}
              >
                <div className="text-center">
  {previewImage?.startsWith("blob:") || previewImage?.startsWith("http") ? (
    <img
      src={previewImage}
      alt="Uploaded textile pattern preview"
      className="mx-auto mb-4 h-36 w-36 rounded-3xl object-cover shadow-lg"
    />
  ) : (
    <img
      src="/banner-design.png"
      alt="Textile design pattern upload preview for AI mockup generation"
      className="mx-auto mb-4 h-36 w-36 rounded-3xl object-cover shadow-lg"
    />
  )}

  <p className="font-semibold">Textile Pattern</p>


                  <p className={`mt-1 text-sm ${muted}`}>
                    {previewImage
                      ? "Uploaded design preview"
                      : "Upload textile design / pattern"}
                  </p>
                </div>
              </div>

              <div className="flex min-h-80 items-center justify-center rounded-[1.5rem] border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-purple-500/20 p-6">
                <div className="text-center">
                  {previewResult && previewResult.startsWith("http") ? (
  <img
    src={previewResult}
    alt="Generated model mockup preview"
    className="mx-auto mb-4 h-48 w-36 rounded-3xl object-cover shadow-lg shadow-cyan-400/30"
  />
) : (
  <img
    src="/banner-design-output.png"
    alt="AI generated textile fashion model mockup preview"
    className="mx-auto mb-4 h-48 w-36 rounded-3xl object-cover shadow-lg shadow-cyan-400/30"
  />
)}

                  <p className="font-semibold">Model Mockup</p>

                  <p className={`mt-1 text-sm ${muted}`}>
                    {previewResult
                      ? "Latest AI fashion output"
                      : "AI fashion output"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="try" className="mx-auto max-w-7xl px-5 py-8">
          <div
            className={`rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl lg:p-7 ${card}`}
          >
            <div className="mb-6">
              <h3 className="text-3xl font-black">Create Your Mockup</h3>
              <p className={`mt-2 ${muted}`}>
                Upload one textile design on normal packs. Bulk creation is unlocked for Empire Pack users only.
              </p>
              <div
                className={`mt-4 inline-flex rounded-full px-4 py-2 text-xs font-black ${
                  isEmpireUser
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-600"
                    : "border border-amber-400/30 bg-amber-400/10 text-amber-600"
                }`}
              >
                {isEmpireUser ? "Empire Pack Active — Bulk Unlocked" : "Bulk Locked — Upgrade to Empire Pack"}
              </div>
            </div>

            <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <label
                  className={`flex min-h-[260px] cursor-pointer items-center justify-center rounded-[1.5rem] border-2 border-dashed p-6 text-center ${darkMode ? "border-white/15 bg-black/20" : "border-black/15 bg-[#fffaf0]"}`}
                >
                  <div>
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-300 to-blue-400 text-white shadow-lg shadow-cyan-400/25">
                      <VisualIcon icon="pattern" />
                    </div>
                    <p className="text-lg font-semibold">
                      {isEmpireUser ? "Upload Textile Design(s)" : "Upload Textile Design"}
                    </p>
                    <p className={`mt-2 text-sm ${muted}`}>
                      {isEmpireUser
                        ? "Select one or multiple files — PNG, JPG, JPEG, WEBP"
                        : "Normal packs support one design at a time — upgrade to Empire Pack for bulk creation"}
                    </p>
                    <p className="mt-2 text-xs font-bold text-cyan-600">
                      Design code on the image is auto-detected via OCR
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple={isEmpireUser}
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>

                {uploading && (
                  <div className="mt-4 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-4 text-sm font-semibold text-cyan-700">
                    Uploading & reading codes from your designs...
                  </div>
                )}

                {items.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-cyan-600">
                        Queue ({items.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setItems([])}
                        className={`text-xs font-bold ${muted} hover:text-rose-500`}
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
                      {items.map((it) => (
                        <div
                          key={it.id}
                          onClick={() => setActiveId(it.id)}
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-2 transition ${
                            activeId === it.id
                              ? "border-cyan-400 bg-cyan-400/10"
                              : darkMode
                                ? "border-white/10 bg-white/[0.04]"
                                : "border-black/10 bg-white/80"
                          }`}
                        >
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-black/10">
                            {it.url ? (
                              <img src={it.url} alt={`AI textile mockup result for ${it.fileName}`} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-black/40">...</div>
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-xs font-bold">{it.fileName}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusColor[it.status]}`}>
                                {statusLabel[it.status]}
                              </span>
                              <input
                                value={it.designNumber}
                                onChange={(e) => updateItemDesignNumber(it.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Code"
                                className={`min-w-0 flex-1 rounded-md border px-2 py-0.5 text-[11px] font-black outline-none ${inputClass}`}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(it.id);
                            }}
                            className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-black text-rose-500 hover:bg-rose-500/10"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                                <div className="mt-4 grid gap-4">
                  <div
                    className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setShowTextBox(!showTextBox)}
                      className="flex w-full items-center justify-between gap-3 text-left font-black"
                    >
                      <span>🔢 Text on Image / Watermark</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${darkMode ? "bg-white/10" : "bg-cyan-50 text-cyan-800"}`}
                      >
                        {showTextBox ? "Hide" : "Open"}
                      </span>
                    </button>

                    <p className={`mt-3 text-xs ${muted}`}>
                      Auto-detected codes from each uploaded image are shown in the queue above and will be printed on each mockup.
                    </p>

                    {showTextBox && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-cyan-600">
                            Watermark Position
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {(
                              [
                                ["top-left", "TL"],
                                ["top-right", "TR"],
                                ["center", "Mid"],
                                ["bottom-left", "BL"],
                                ["bottom-right", "BR"],
                              ] as const
                            ).map(([val, label]) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setWatermarkPosition(val)}
                                className={`rounded-xl border py-2 text-xs font-black transition ${
                                  watermarkPosition === val
                                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-700"
                                    : darkMode
                                      ? "border-white/10 bg-white/[0.04]"
                                      : "border-black/10 bg-white"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-cyan-600">
                            Watermark Color
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {(["white", "black"] as const).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setWatermarkColor(c)}
                                className={`rounded-xl border py-2 text-xs font-black capitalize transition ${
                                  watermarkColor === c
                                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-700"
                                    : darkMode
                                      ? "border-white/10 bg-white/[0.04]"
                                      : "border-black/10 bg-white"
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"}`}
                  >
                    <p className="font-black">🧍 Model Pose</p>
                    <p className={`mt-1 text-xs ${muted}`}>
                      How should the model face the camera?
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(
                        [
                          { title: "Front Face", icon: "frontPose" },
                          { title: "Side Pose", icon: "sidePose" },
                          { title: "Back", icon: "backPose" },
                          { title: "Auto", icon: "autoPose" },
                        ] as { title: string; icon: IconName }[]
                      ).map(({ title, icon }) => (
                        <OptionCard
                          key={title}
                          title={title}
                          icon={icon}
                          active={!customPose.trim() && pose === title}
                          onClick={() => {
                            setPose(title);
                            setCustomPose("");
                          }}
                          darkMode={darkMode}
                        />
                      ))}
                    </div>
                    {renderCustomInput(
                      "Or type your own pose — e.g. 'Hands on hips', 'Looking up', 'Sitting'",
                      customPose,
                      setCustomPose,
                    )}
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setShowPromptBox(!showPromptBox)}
                      className="flex w-full items-center justify-between gap-3 text-left font-black"
                    >
                      <span>📝 Custom Instruction (Optional)</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${darkMode ? "bg-white/10" : "bg-cyan-50 text-cyan-800"}`}
                      >
                        {showPromptBox ? "Hide" : "Open"}
                      </span>
                    </button>

                    {showPromptBox && (
                      <textarea
                        value={customInstruction}
                        onChange={(e) => setCustomInstruction(e.target.value)}
                        placeholder="Add specific instructions like 'Smiling model', 'Darker background', etc."
                        className={`mt-4 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-cyan-400 ${inputClass}`}
                        rows={3}
                      />
                    )}
                  </div>
                
                  
                  
                </div>
              </div>

              <div className="space-y-7">
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-black uppercase tracking-widest text-cyan-600">
                      1. Select Model Type
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {["Indian Male", "Indian Female", "Western Male", "Western Female"].map(
                      (item) => (
                        <OptionCard
                          key={item}
                          title={item}
                          active={!customModelType.trim() && modelType === item}
                          onClick={() => {
                            setModelType(item);
                            setCustomModelType("");
                          }}
                          darkMode={darkMode}
                        />
                      ),
                    )}
                  </div>
                  {renderCustomInput(
                    "Or type your own — e.g. 'African Male', 'Petite Indian Female'",
                    customModelType,
                    setCustomModelType,
                  )}
                </section>

                <section>
                  <h4 className="mb-4 font-black uppercase tracking-widest text-cyan-600">
                    2. Select Product Type
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {["Shirt", "Kurta", "Suit", "Dress", "Saree"].map((item) => (
                      <OptionCard
                        key={item}
                        title={item}
                        active={!customProduct.trim() && product === item}
                        onClick={() => {
                          setProduct(item);
                          setCustomProduct("");
                        }}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                  {renderCustomInput(
                    "Or type your own — e.g. 'Lehenga', 'Blazer', 'Crop Top'",
                    customProduct,
                    setCustomProduct,
                  )}
                </section>

                <section>
                  <h4 className="mb-4 font-black uppercase tracking-widest text-cyan-600">
                    3. Select Shoot Style
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      "Outdoor Premium",
                      "Studio Professional",
                      "White Background",
                      "Luxury Editorial",
                    ].map((item) => (
                      <OptionCard
                        key={item}
                        title={item}
                        active={!customShootStyle.trim() && shootStyle === item}
                        onClick={() => {
                          setShootStyle(item);
                          setCustomShootStyle("");
                        }}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                  {renderCustomInput(
                    "Or type your own — e.g. 'Beach sunset', 'Vintage room'",
                    customShootStyle,
                    setCustomShootStyle,
                  )}
                </section>

                <section>
                  <h4 className="mb-4 font-black uppercase tracking-widest text-cyan-600">
                    4. Accessories (Multi-select)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {["None", "Sunglasses", "Watch", "Bracelet"].map((item) => (
                      <OptionCard
                        key={item}
                        title={item}
                        active={accessories.includes(item)}
                        onClick={() => toggleAccessory(item)}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                  {renderCustomInput(
                    "Or add extras (comma-separated) — e.g. 'Earrings, Necklace, Handbag'",
                    customAccessory,
                    setCustomAccessory,
                  )}
                </section>

                <section>
                  <h4 className="mb-4 font-black uppercase tracking-widest text-cyan-600">
                    5. Output & Quality
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Select Size
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {["Square (1:1)", "Mobile (9:16)"].map((item) => (
                          <OptionCard
                            key={item}
                            title={item}
                            active={
                              !customOutputSize.trim() &&
                              outputSize ===
                                (item.includes("1:1") ? "1080x1080" : "1080x1920")
                            }
                            onClick={() => {
                              setOutputSize(item.includes("1:1") ? "1080x1080" : "1080x1920");
                              setCustomOutputSize("");
                            }}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>
                      {renderCustomInput(
                        "Or type — e.g. '4:5', '2048x2048'",
                        customOutputSize,
                        setCustomOutputSize,
                      )}
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Select Quality
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {["Premium", "Ultra HD"].map((item) => (
                          <OptionCard
                            key={item}
                            title={item}
                            active={!customQuality.trim() && quality === item}
                            onClick={() => {
                              setQuality(item);
                              setCustomQuality("");
                            }}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>
                      {renderCustomInput(
                        "Or type — e.g. '4K Cinematic'",
                        customQuality,
                        setCustomQuality,
                      )}
                    </div>
                  </div>
                </section>

                <div className="pt-4">
                  <button
                    disabled={loading || uploading || readyItems.length === 0}
                    onClick={handleGenerate}
                    className={`flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 py-5 text-lg font-black text-black shadow-xl shadow-cyan-500/25 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50`}
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                        <span>Generating {readyItems.length} Mockup{readyItems.length > 1 ? "s" : ""}...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span>
                          {readyItems.length > 1 && !isEmpireUser
                            ? "Upgrade to Empire Pack for Bulk"
                            : readyItems.length > 1
                              ? `Generate ${readyItems.length} Mockups (${totalCreditsNeeded} Credits)`
                              : `Start Royal Generation (${requiredCredits} Credits)`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {showResult && (
          <section className="mx-auto max-w-7xl px-5 pb-20">
            <div
              className={`overflow-hidden rounded-[2.5rem] border shadow-2xl backdrop-blur-xl ${card}`}
            >
              <div className="grid lg:grid-cols-2">
                <div className="flex items-center justify-center bg-black/5 p-8">
                  {previewResult ? (
                    <img
                      src={previewResult}
                      alt="Final AI textile mockup generated using AgentForge"
                      className="max-h-[600px] rounded-3xl shadow-2xl transition hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-[400px] w-full flex-col items-center justify-center text-center">
                      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
                      <p className="font-bold">Finalizing your masterpiece...</p>
                    </div>
                  )}
                </div>

                <div className="p-8 lg:p-12">
                  <div className="mb-8">
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-600">
                      Success
                    </span>
                    <h3 className="mt-2 text-4xl font-black">Generation Complete</h3>
                    <p className={`mt-4 text-lg leading-relaxed ${muted}`}>
                      Your premium model mockup is ready. You can now download it or
                      share it directly with your clients.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      onClick={handleDownloadResult}
                      className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-105 active:scale-95"
                    >
                      <span>Download HD</span>
                    </button>
                    <button
                      onClick={handleNativeShare}
                      className="flex items-center justify-center gap-3 rounded-2xl bg-blue-500 px-6 py-4 font-black text-white shadow-lg shadow-blue-500/20 transition hover:scale-105 active:scale-95"
                    >
                      <span>Share Now</span>
                    </button>
                  </div>

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 font-black text-white shadow-lg shadow-green-500/20 transition hover:scale-105 active:scale-95"
                  >
                    <span>Share on WhatsApp</span>
                  </a>

                  {items.filter((it) => it.resultUrl).length > 1 && (
                    <div className="mt-8">
                      <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-cyan-600">
                        All Generated Mockups
                      </p>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {items
                          .filter((it) => it.resultUrl)
                          .map((it) => (
                            <button
                              key={it.id}
                              type="button"
                              onClick={() => setActiveId(it.id)}
                              className={`overflow-hidden rounded-xl border-2 transition ${
                                activeId === it.id
                                  ? "border-cyan-400 shadow-lg shadow-cyan-400/30"
                                  : "border-transparent"
                              }`}
                            >
                              {it.resultUrl ? (
  <img
    src={it.resultUrl}
    alt={`Generated AI mockup ${it.fileName}`}
    className="aspect-square w-full object-cover"
  />
) : (
  <div className="flex aspect-square w-full items-center justify-center text-xs text-black/50">
    Loading...
  </div>
)}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-12 rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-8">
                    <p className="text-[11px] font-black uppercase tracking-widest text-cyan-600">
                      Pro Tip
                    </p>
                    <p className="mt-3 font-bold leading-relaxed">
                      "High-res source images with clean backgrounds lead to the most royal and crisp model outputs."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="mx-auto max-w-lg p-6 text-center text-white">
            <div className="relative mx-auto mb-10 h-32 w-32">
  <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-20" />
  <div className="absolute -inset-3 animate-pulse rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 opacity-40 blur-2xl" />
  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-2xl ring-4 ring-cyan-400/60">
    <img
      src="/logo-new.jpg"
      alt="AgentForge"
      className="h-full w-full object-cover"
      style={{ animation: "afLogoFloat 2.4s ease-in-out infinite" }}
    />
  </div>
  <style>{`
    @keyframes afLogoFloat {
      0%, 100% { transform: scale(1) rotate(-4deg); }
      50%      { transform: scale(1.1) rotate(4deg); }
    }
  `}</style>
</div>

            <h3 className="text-3xl font-black">AI is Crafting...</h3>
            <p className="mt-4 text-white/70">
              Generating your royal fashion mockup. Please do not refresh.
            </p>

            <div className="mt-10 space-y-6">
              <div className="overflow-hidden rounded-2xl bg-white/10 p-6 text-left backdrop-blur-md transition-all">
                <p className="text-[11px] font-black uppercase tracking-widest text-cyan-400">
                  {textileFacts[factIndex].title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/90">
                  {textileFacts[factIndex].text}
                </p>
              </div>

              {cancelVisible && (
                <button
                  onClick={() => {
                    cancelRef.current = true;
                    setLoading(false);
                  }}
                  className="text-xs font-black uppercase tracking-widest text-white/30 hover:text-rose-400 transition"
                >
                  Cancel Generation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}