"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

/* ===== DEMO IMAGES ===== */

// 👕 Shirt models
const shirtModels = [
  "https://images.unsplash.com/photo-1618354691373-d851c5c3a990",
  "https://images.unsplash.com/photo-1603252109303-2751441dd157",
  "https://images.unsplash.com/photo-1598033129183-c4f50c736f10",
  "https://images.unsplash.com/photo-1584865288642-42078afe6942",
  "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176",
];

// 📦 Product shots
const productShots = [
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad",
  "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  "https://images.unsplash.com/photo-1592878904946-b3cd09c8b33b",
  "https://images.unsplash.com/photo-1580910051074-3eb694886505",
];

// 💎 Jewellery
const jewelleryShots = [
  "https://images.unsplash.com/photo-1611652022419-a9419f74343d",
  "https://images.unsplash.com/photo-1608042314453-ae338d80c427",
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638",
  "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f",
];

const sampleImages = [...shirtModels, ...productShots, ...jewelleryShots];

export default function GalleryPage() {
  const { darkMode } = useTheme();
  const [images, setImages] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from("generations")
        .select("output_url")
        .eq("status", "completed")
        .not("output_url", "is", null)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setImages(data.map((item) => item.output_url));
      } else {
        setImages(sampleImages);
      }
    };

    fetchImages();
  }, []);

  return (
    <main
      className={`min-h-screen px-6 py-10 ${
        darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-black"
      }`}
    >
      <h1 className="text-3xl font-black mb-10 text-center">
        Best Creations Wall
      </h1>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {images.map((img, i) => (
  <div key={i}>
    {/* IMAGE */}
    <div
      onClick={() => setSelected(img)}
      className="cursor-pointer overflow-hidden rounded-2xl shadow hover:scale-[1.03] transition aspect-square"
    >
      <div className="relative w-full h-full">
        <img
          src={img}
          alt="AI Output"
          className="w-full h-full object-cover"
        />

        <div className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-black/60 text-white">
          AgentForge
        </div>
      </div>
    </div>

    {/* CTA */}
    {(i + 1) % 10 === 0 && (
      <div className="col-span-full flex justify-center py-10">
        <div className="rounded-3xl px-8 py-6 text-center shadow-lg bg-white border border-black/10">
          <h2 className="text-xl font-black mb-2">
            Want results like this?
          </h2>

          <a
            href="/login"
            className="inline-block mt-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-black text-white"
          >
            Login & Start Creation
          </a>
        </div>
      </div>
    )}
  </div>
))}
      </div>

      {/* POPUP */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <img
            src={selected}
            className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl"
          />
        </div>
      )}
    </main>
  );
}