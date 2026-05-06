"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_PRODUCTION_WEBHOOK ||
  "/api/generate-mockup";

type IconName =
  | "pattern"
  | "male"
  | "female"
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
  | "ultra";

function VisualIcon({ icon }: { icon: IconName }) {
  const common = "drop-shadow-sm";

  if (icon === "sunglasses") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <path d="M12 43h16c8 0 13 5 16 12h8c3-7 8-12 16-12h16c4 0 7 3 7 7v6c0 12-10 22-22 22h-3c-10 0-18-7-21-17h-8c-3 10-11 17-21 17h-3C17 78 7 68 7 56v-6c0-4 2-7 5-7Z" fill="#005b8f" />
        <path d="M14 51h19c4 0 7 3 7 7 0 9-7 16-16 16h-3c-9 0-16-7-16-16 0-4 4-7 9-7Zm49 0h19c5 0 9 3 9 7 0 9-7 16-16 16h-3c-9 0-16-7-16-16 0-4 3-7 7-7Z" fill="#ff982e" />
        <path d="M20 54c9 0 17 0 19 6-2 8-8 13-16 13h-2c-8 0-14-6-15-13 3-4 8-6 14-6Zm49 0c9 0 17 0 19 6-2 8-8 13-16 13h-2c-8 0-14-6-15-13 3-4 8-6 14-6Z" fill="#ffa83d" />
        <path d="M21 55c3-4 9-5 16-3 0 7-5 12-14 13-7 1-11-1-13-3 2-4 6-6 11-7Zm49 0c3-4 9-5 16-3 0 7-5 12-14 13-7 1-11-1-13-3 2-4 6-6 11-7Z" fill="#ffc65f" opacity=".75" />
        <path d="M3 48h10v11H3a5 5 0 0 1-5-5v-1a5 5 0 0 1 5-5Zm90 0h-10v11h10a5 5 0 0 0 5-5v-1a5 5 0 0 0-5-5Z" fill="#005b8f" />
      </svg>
    );
  }

  if (icon === "saree" || icon === "dress") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <circle cx="49" cy="14" r="9" fill="#0e7490" />
        <path d="M43 26c-11 10-17 25-22 45 18 7 42 7 60 0-5-20-12-35-23-45-4 3-10 3-15 0Z" fill="url(#gSaree)" />
        <path d="M53 27c-2 16-6 30-20 46 11 3 25 2 36-1-3-14-7-29-16-45Z" fill="#fff" opacity=".45" />
        <path d="M30 50c12-2 27-10 35-22" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
        <defs><linearGradient id="gSaree" x1="18" y1="23" x2="80" y2="76"><stop stopColor="#22d3ee"/><stop offset=".5" stopColor="#60a5fa"/><stop offset="1" stopColor="#a78bfa"/></linearGradient></defs>
      </svg>
    );
  }

  if (icon === "watch") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <path d="M37 6h22l-3 22H40L37 6Zm3 62h16l3 22H37l3-22Z" fill="#0e7490" />
        <circle cx="48" cy="48" r="24" fill="#0891b2" />
        <circle cx="48" cy="48" r="18" fill="#ecfeff" />
        <path d="M48 37v13l10 6" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "bracelet") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <circle cx="48" cy="48" r="30" fill="none" stroke="#0891b2" strokeWidth="8" />
        {[18,30,42,54,66,78].map((x, i) => (
          <circle key={x} cx={x} cy={48 + (i % 2 ? 24 : -24)} r="7" fill={i % 2 ? "#60a5fa" : "#f59e0b"} />
        ))}
      </svg>
    );
  }

  if (icon === "mobile" || icon === "square") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        {icon === "mobile" ? <rect x="30" y="8" width="36" height="80" rx="9" fill="#0e7490" /> : <rect x="18" y="18" width="60" height="60" rx="14" fill="#0e7490" />}
        {icon === "mobile" ? <rect x="34" y="18" width="28" height="58" rx="5" fill="#cffafe" /> : <rect x="28" y="28" width="40" height="40" rx="8" fill="#cffafe" />}
        <circle cx="48" cy="80" r="3" fill="#fff" />
      </svg>
    );
  }

  if (icon === "camera" || icon === "outdoor" || icon === "studio" || icon === "whitebg" || icon === "luxury") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <rect x="18" y="30" width="60" height="42" rx="12" fill="#075985" />
        <rect x="30" y="22" width="22" height="12" rx="5" fill="#0891b2" />
        <circle cx="48" cy="51" r="15" fill="#e0f2fe" />
        <circle cx="48" cy="51" r="9" fill="#38bdf8" />
        {icon === "luxury" && <path d="M72 21l4 8 9 2-7 6 2 9-8-5-8 5 2-9-7-6 9-2 4-8Z" fill="#f59e0b" />}
        {icon === "outdoor" && <circle cx="24" cy="22" r="9" fill="#facc15" />}
        {icon === "whitebg" && <rect x="21" y="33" width="54" height="36" rx="9" fill="#fff" opacity=".55" />}
      </svg>
    );
  }

  if (icon === "premium" || icon === "ultra") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <path d="M48 10l10 24 26 2-20 17 7 25-23-14-23 14 7-25-20-17 26-2 10-24Z" fill="url(#gStar)" />
        <path d="M48 23l6 15 16 1-12 10 4 16-14-9-14 9 4-16-12-10 16-1 6-15Z" fill="#fff" opacity=".45" />
        <defs><linearGradient id="gStar" x1="16" y1="13" x2="75" y2="77"><stop stopColor="#22d3ee"/><stop offset=".55" stopColor="#3b82f6"/><stop offset="1" stopColor="#a855f7"/></linearGradient></defs>
      </svg>
    );
  }

  if (icon === "none") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <circle cx="48" cy="48" r="32" fill="#e0f2fe" stroke="#0891b2" strokeWidth="7" />
        <path d="M29 29l38 38" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
      <path d="M32 16h32l6 20 10 8-8 14 4 26H20l4-26-8-14 10-8 6-20Z" fill="url(#gCloth)" />
      <path d="M34 18c6 8 22 8 28 0" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".65" />
      {(icon === "male" || icon === "female") && <circle cx="48" cy="13" r="9" fill="#0e7490" />}
      <defs><linearGradient id="gCloth" x1="16" y1="16" x2="80" y2="84"><stop stopColor="#22d3ee"/><stop offset=".5" stopColor="#3b82f6"/><stop offset="1" stopColor="#a78bfa"/></linearGradient></defs>
    </svg>
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
  if (key.includes("female")) return "female";
  if (key.includes("male")) return "male";
  if (key.includes("outdoor")) return "outdoor";
  if (key.includes("studio")) return "studio";
  if (key.includes("white")) return "whitebg";
  if (key.includes("luxury")) return "luxury";
  if (key.includes("none")) return "none";
  if (key.includes("1920") || key.includes("mobile")) return "mobile";
  if (key.includes("1080")) return "square";
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

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const { darkMode } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [showResult, setShowResult] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [user, setUser] = useState({
    name: "User",
    email: "",
    image: "",
  });

  const [modelType, setModelType] = useState("Indian Male");
  const [product, setProduct] = useState("Shirt");
  const [shootStyle, setShootStyle] = useState("Outdoor Premium");
  const [accessories, setAccessories] = useState<string[]>(["None"]);
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [quality, setQuality] = useState("Premium");
  const [customInstruction, setCustomInstruction] = useState("");
  const [designNumber, setDesignNumber] = useState("NA");
  const [showPromptBox, setShowPromptBox] = useState(false);
  const [showTextBox, setShowTextBox] = useState(false);
  const [factIndex, setFactIndex] = useState(0);

  const credits = 5;

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

  const agents = [
    { title: "TextilePrints to Mockup AI", link: "/textileprints-to-mockup" },
    { title: "Jewellery AI", link: "/jewellery-ai" },
    { title: "Productography AI", link: "/productography-ai" },
  ];

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const authUser = data.session?.user;

        if (!mounted) return;

        if (authUser) {
          setUser({
            name:
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              authUser.email?.split("@")[0] ||
              "User",
            email: authUser.email || "",
            image: authUser.user_metadata?.avatar_url || "",
          });
        } else {
          setUser({ name: "User", email: "", image: "" });
        }
      } catch (err) {
        console.error("Error loading user:", err);
      }
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const authUser = session?.user;

        if (authUser) {
          
          setUser({
            name:
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              authUser.email?.split("@")[0] ||
              "User",
            email: authUser.email || "",
            image: authUser.user_metadata?.avatar_url || "",
          });
        } else {
          
          setUser({ name: "User", email: "", image: "" });
        }
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      setFactIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setFactIndex((current) => (current + 1) % textileFacts.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [loading, textileFacts.length]);

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
    setDesignNumber(s.designNumber || "NA");
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
        designNumber,
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
    designNumber,
    showPromptBox,
    showTextBox,
    darkMode,
  ]);

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

  const extractDesignNumberFromName = (fileName: string) => {
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    const match = cleanName.match(
      /(?:design|article|art|code|pattern|pat|d|a)?[-_\s]*([A-Z0-9]{2,}[-_][A-Z0-9]{2,}|[A-Z]{1,4}\d{2,}|\d{3,})/i,
    );
    return match?.[1]?.toUpperCase().replace(/_/g, "-") || "";
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload image file only.");
      return;
    }

    setUploading(true);
    setResult("");
    setGenerationId("");

    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
      const filePath = `textile-designs/${Date.now()}-${safeFileName}`;

      const { error } = await supabase.storage
        .from("designs")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error details:", error);
        alert(`Image upload failed: ${error.message}. Please check if the 'designs' bucket exists and has public 'insert' policy.`);
        return;
      }

      const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      const detectedDesignNumber = extractDesignNumberFromName(file.name);
      const finalDesignNumber = detectedDesignNumber || "NA";
      const { data: sessionData } = await supabase.auth.getSession();

      const { data: generation, error: generationError } = await supabase
        .from("generations")
        .insert([
          {
            user_id: sessionData.session?.user?.id || null,
            design_url: publicUrl,
            input_image_url: publicUrl,
            model_type: modelType,
            product_type: product,
            shoot_style: shootStyle,
            accessories: accessories.join(", "),
            output_size: outputSize,
            quality,
            article_number: finalDesignNumber === "NA" ? null : finalDesignNumber,
            custom_instruction: customInstruction || null,
            status: "pending",
          },
        ])
        .select("id")
        .single();

      if (generationError) {
        console.error("Generation insert error:", generationError);
        alert(`Generation record failed: ${generationError.message}`);
        return;
      }

      setImage(publicUrl);
      setGenerationId(generation.id);
      setUploadedFileName(file.name);

      if (detectedDesignNumber) {
        setDesignNumber(detectedDesignNumber);
        setShowTextBox(true);
      } else {
        setDesignNumber("NA");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const pollGenerationResult = async (id: string) => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
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

    throw new Error("Generation is taking too long. Please check My Creations or try again.");
  };

  const handleGenerate = async () => {
    if (!image) {
      alert("Please upload textile design first.");
      return;
    }

    if (!generationId) {
      alert("Upload is not saved in Supabase yet. Please upload the textile design again.");
      return;
    }

    setLoading(true);
    setResult("");

    const newGenId = crypto.randomUUID();
    setGenerationId(newGenId);

    const payload = {
      generation_id: newGenId,
      design_url: image,
      model_type: modelType,
      product_type: product,
      shoot_style: shootStyle,
      accessories: accessories.join(", "),
      output_size: outputSize,
      quality,
      design_number: designNumber === "NA" ? "" : designNumber,
      text_on_image: designNumber === "NA" ? "" : designNumber,
      article_number: designNumber === "NA" ? "" : designNumber,
      custom_instruction: customInstruction,
    };

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { error: updateError } = await supabase
        .from("generations")
        .insert({
          id: newGenId,
          user_id: sessionData.session?.user?.id || null,
          design_url: image,
          input_image_url: image,
          model_type: modelType,
          product_type: product,
          shoot_style: shootStyle,
          accessories: accessories.join(", "),
          output_size: outputSize,
          quality,
          article_number: designNumber === "NA" ? null : designNumber,
          custom_instruction: customInstruction || null,
          status: "pending",
        });

      if (updateError) {
        console.error("Generation insert error:", updateError);
        throw new Error(`Generation insert failed: ${updateError.message}`);
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
      const immediateImage = data?.image_url || data?.output_image_url || data?.image || data?.url;
      const finalImage = immediateImage || (await pollGenerationResult(generationId));

      setResult(finalImage);
      setShowResult(true);
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
    if (!result) return;

    if (navigator.share) {
      await navigator.share({
        title: "TextilePrints to Mockup AI",
        text: "Generated with AgentForge",
        url: result,
      });
    } else {
      await navigator.clipboard.writeText(result);
      alert("Image link copied.");
    }
  };

  const whatsappLink = result
    ? `https://wa.me/?text=${encodeURIComponent(`Generated with AgentForge\n${result}`)}`
    : "#";

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
  const avatarInitial = (user.name || user.email || "U").slice(0, 1).toUpperCase();


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

            <h2 className="max-w-3xl text-5xl font-black leading-tight tracking-tight lg:text-7xl">
              Upload Pattern.
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Get Mockup.
              </span>
              Sell Faster.
            </h2>

            <p className={`mt-6 max-w-xl text-lg leading-8 ${muted}`}>
              Upload your textile design and generate a realistic fashion model
              mockup for catalogues, ads, and client previews.
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
            className={`rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl ${card}`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={`flex min-h-80 items-center justify-center rounded-[1.5rem] border p-6 ${darkMode ? "border-white/10 bg-black/25" : "border-black/10 bg-[#fffaf0]"}`}
              >
                <div className="text-center">
                  <div className="mx-auto mb-4 h-28 w-28 rounded-3xl bg-[repeating-linear-gradient(45deg,#22d3ee_0px,#22d3ee_8px,#facc15_8px,#facc15_16px,#a78bfa_16px,#a78bfa_24px)]" />
                  <p className="font-semibold">Textile Pattern</p>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Upload textile design / pattern
                  </p>
                </div>
              </div>

              <div className="flex min-h-80 items-center justify-center rounded-[1.5rem] border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-purple-500/20 p-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-44 w-28 rounded-full bg-gradient-to-b from-cyan-200 via-blue-400 to-purple-500 shadow-lg shadow-cyan-400/30" />
                  <p className="font-semibold">Model Mockup</p>
                  <p className={`mt-1 text-sm ${muted}`}>AI fashion output</p>
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
                Upload your textile design/pattern, choose generation options, and create a premium model mockup.
              </p>
            </div>

            <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <label
                  className={`flex min-h-[430px] cursor-pointer items-center justify-center rounded-[1.5rem] border-2 border-dashed p-6 text-center ${darkMode ? "border-white/15 bg-black/20" : "border-black/15 bg-[#fffaf0]"}`}
                >
                  {image ? (
                    <img
                      src={image}
                      alt="Uploaded textile design or pattern"
                      className="max-h-[360px] rounded-2xl object-contain"
                    />
                  ) : (
                    <div>
                      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-300 to-blue-400 text-white shadow-lg shadow-cyan-400/25">
                        <VisualIcon icon="pattern" />
                      </div>
                      <p className="text-lg font-semibold">Upload Textile Design / Pattern</p>
                      <p className={`mt-2 text-sm ${muted}`}>
                        PNG, JPG, JPEG, WEBP
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>

                {uploadedFileName && (
                  <p className="mt-3 truncate text-sm font-semibold text-emerald-600">
                    Uploaded: {uploadedFileName}
                  </p>
                )}

                {uploading && (
                  <div className="mt-4 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-4 text-sm font-semibold text-cyan-700">
                    Your textile design is uploading. You can select generation options meanwhile.
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
                      <span>🔢 Text on Image / Design Number</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${darkMode ? "bg-white/10" : "bg-cyan-50 text-cyan-800"}`}
                      >
                        {showTextBox ? "Hide" : "Open"}
                      </span>
                    </button>

                    <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-black ${darkMode ? "border-white/10 bg-black/25 text-white/70" : "border-black/10 bg-cyan-50 text-cyan-900"}`}>
                      Fixed design code: {designNumber || "NA"}
                    </div>

                    {showTextBox && (
                      <div className="mt-4 grid gap-3">
                        <input
                          value={designNumber === "NA" ? "" : designNumber}
                          onChange={(e) => {
                            const value = e.target.value.trim().toUpperCase();
                            setDesignNumber(value || "NA");
                          }}
                          placeholder="Design / Article / Pattern number e.g. D-1045"
                          className={`w-full rounded-2xl border p-4 text-sm font-semibold outline-none ${inputClass}`}
                        />
                        <p className={`text-xs leading-5 ${muted}`}>
                          If no number is needed, keep this empty. AgentForge will treat it as NA and no code will be placed on the output.
                        </p>
                      </div>
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
                      <span>✍️ Optional Prompt</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${darkMode ? "bg-white/10" : "bg-cyan-50 text-cyan-800"}`}
                      >
                        {showPromptBox ? "Hide" : "Open"}
                      </span>
                    </button>

                    {showPromptBox && (
                      <div className="mt-4 grid gap-3">
                        <textarea
                          value={customInstruction}
                          onChange={(e) => setCustomInstruction(e.target.value)}
                          placeholder="Optional prompt: premium outdoor background, clean collar, exact pattern continuity, sunglasses, wrist watch, luxury catalogue feel..."
                          className={`min-h-28 w-full rounded-2xl border p-4 text-sm outline-none ${inputClass}`}
                        />
                        <p className={`text-xs leading-5 ${muted}`}>
                          Use this only when you want extra creative direction. Normal generation works without it.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-3 text-base font-black">Model Type</h4>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      "Indian Male",
                      "European Male",
                      "UAE Male",
                      "Indian Female",
                    ].map((item) => (
                      <OptionCard
                        key={item}
                        title={item}
                        icon={optionIcon(item)}
                        active={modelType === item}
                        onClick={() => setModelType(item)}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-base font-black">Product</h4>
                  <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                    {[
                      "Shirt",
                      "Kurta",
                      "Suit",
                      "Dress",
                      "Saree",
                      "T-Shirt",
                    ].map((item) => (
                      <OptionCard
                        key={item}
                        title={item}
                        icon={optionIcon(item)}
                        active={product === item}
                        onClick={() => setProduct(item)}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-base font-black">Shoot Style</h4>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      "Outdoor Premium",
                      "Studio Catalogue",
                      "White BG",
                      "Luxury Indoor",
                    ].map((item) => (
                      <OptionCard
                        key={item}
                        title={item}
                        icon={optionIcon(item)}
                        active={shootStyle === item}
                        onClick={() => setShootStyle(item)}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-base font-black">Accessories</h4>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      { title: "None" },
                      { title: "Wrist Watch" },
                      { title: "Sunglasses" },
                      { title: "Bracelet" },
                    ].map((item) => (
                      <OptionCard
                        key={item.title}
                        title={item.title}
                        icon={optionIcon(item.title)}
                        active={accessories.includes(item.title)}
                        onClick={() => toggleAccessory(item.title)}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-base font-black">Output Size</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          title: "1080×1080 Square",
                          value: "1080x1080",
                        },
                        {
                          title: "1080×1920 Mobile Status",
                          value: "1080x1920",
                        },
                      ].map((item) => (
                        <OptionCard
                          key={item.value}
                          title={item.title}
                          icon={optionIcon(item.title)}
                          active={outputSize === item.value}
                          onClick={() => setOutputSize(item.value)}
                          darkMode={darkMode}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-base font-black">Quality</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {["Premium", "Ultra Realistic"].map((item) => (
                        <OptionCard
                          key={item}
                          title={item}
                          icon={optionIcon(item)}
                          active={quality === item}
                          onClick={() => setQuality(item)}
                          darkMode={darkMode}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={uploading || loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 py-5 text-base font-black text-black shadow-xl shadow-cyan-500/25 transition active:scale-[0.99] disabled:opacity-60"
                >
                  {uploading
                    ? "Uploading..."
                    : loading
                      ? "Generating..."
                      : "Generate Model Mockup"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Upload", "Upload your textile design or pattern."],
              [
                "Generate",
                "AI converts your design into a realistic model mockup.",
              ],
              [
                "Done",
                "Your output is ready to download, share, or send to clients.",
              ],
            ].map(([title, desc], index) => (
              <div
                key={title}
                className={`rounded-[2rem] border p-7 text-center backdrop-blur-xl ${card}`}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-xl font-black text-black">
                  {index + 1}
                </div>
                <h4 className="text-2xl font-black">{title}</h4>
                <p className={`mt-3 ${muted}`}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      <button
        type="button"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xl font-black text-white shadow-2xl shadow-cyan-500/40 transition hover:scale-105"
        aria-label="Open AI Chatbot"
      >
        AI
      </button>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-[2rem] border p-6 text-center shadow-2xl ${darkMode ? "border-white/10 bg-[#0b1220] text-white" : "border-black/10 bg-white text-black"}`}
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-300 to-blue-500 text-4xl shadow-xl shadow-cyan-400/30">
              🧵
            </div>
            <h3 className="text-2xl font-black">
              Generating Your Textile Mockup
            </h3>
            <p className={`mt-2 text-sm ${muted}`}>
              Please wait while AI prepares a premium model preview.
            </p>

            <div
              className={`mt-5 rounded-2xl border p-5 text-left ${darkMode ? "border-white/10 bg-white/[0.05]" : "border-cyan-100 bg-cyan-50/80"}`}
            >
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500">
                Textile Insight
              </p>
              <h4 className="mt-2 text-lg font-black">
                {textileFacts[factIndex].title}
              </h4>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>
                {textileFacts[factIndex].text}
              </p>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/10">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
            </div>
          </div>
        </div>
      )}

      {showResult && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 text-black shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">Mockup Ready</h3>
                <p className="text-sm text-black/50">
                  Download or share your output.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResult(false)}
                className="rounded-full bg-black/10 px-4 py-2 font-black"
              >
                ✕
              </button>
            </div>

            <img
              src={result}
              alt="Generated mockup"
              className="w-full rounded-2xl border border-black/10"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <a
                href={result}
                download
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-black px-4 py-4 text-center font-black text-white"
              >
                Download
              </a>
              <button
                type="button"
                onClick={handleNativeShare}
                className="rounded-2xl bg-cyan-500 px-4 py-4 font-black text-black"
              >
                Share
              </button>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-green-500 px-4 py-4 text-center font-black text-white"
              >
                WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  alert("Image link copied.");
                }}
                className="rounded-2xl bg-black/10 px-4 py-4 font-black"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
