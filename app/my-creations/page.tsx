"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

interface Creation {
  id: string;
  design_url: string;
  output_image_url?: string;
  output_url?: string;
  image_url?: string;
  status: string;
  product_type?: string;
  created_at: string;
}

export default function MyCreationsPage() {
  const { darkMode } = useTheme();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCreations() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;

        if (!userId) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("generations")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCreations(data || []);
      } catch (err) {
        console.error("Error loading creations:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCreations();
  }, []);

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const cardBg = darkMode ? "bg-white/5 border-white/10" : "bg-white border-black/10";

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />
      <div className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`} style={{ backgroundImage: "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)", backgroundSize: "34px 34px" }} />

      <div className="relative z-10">
        <section className="mx-auto max-w-7xl px-5 py-14 md:py-20">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-600">Your Work</div>
            <h2 className="text-4xl font-black md:text-5xl">My Creations</h2>
            <p className={`mt-3 ${muted}`}>All your AI-generated visuals in one place.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          ) : creations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-8">
                <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-xl">
                  <svg className={`h-16 w-16 ${darkMode ? "text-white/25" : "text-black/20"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-black md:text-3xl">No creations yet</h3>
              <p className={`mx-auto mt-4 max-w-md text-base leading-7 ${muted}`}>
                Start by uploading a design and generating your first AI mockup. Your creations will appear here.
              </p>
              <Link href="/textileprints-to-mockup" className="mt-8 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-cyan-500/25 transition hover:scale-105">
                Start Creating
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {creations.map((item) => {
                const displayImage = item.output_image_url || item.output_url || item.image_url || item.design_url;
                return (
                  <div key={item.id} className={`group relative overflow-hidden rounded-[2rem] border transition hover:shadow-2xl ${cardBg}`}>
                    <div className="aspect-square overflow-hidden bg-black/5">
                      <img src={displayImage} alt={item.product_type || "Creation"} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      {item.status === "pending" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                          <div className="flex flex-col items-center">
                            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Processing</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold uppercase tracking-wider text-cyan-500">{item.product_type || "Mockup"}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className={`mt-1 text-xs ${muted}`}>
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(displayImage);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `mockup-${item.id}.png`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (err) {
                              window.open(displayImage, "_blank");
                            }
                          }}
                          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 py-2.5 text-[10px] font-black text-cyan-600 transition hover:bg-cyan-500 hover:text-white"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 7.5L12 12m0 0l4.5-4.5M12 12V3" />
                          </svg>
                          DOWNLOAD
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Check out this AI mockup: ${displayImage}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2.5 text-[10px] font-black text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
                        >
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                          SHARE
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
