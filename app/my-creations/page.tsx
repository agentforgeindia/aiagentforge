"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-16 md:py-24 lg:py-32">
          <div className="mb-8 text-center sm:mb-10">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold text-cyan-600 sm:mb-5 sm:px-5 sm:py-2 sm:text-sm">Your Work</div>
            <h2 className="text-3xl font-black sm:text-4xl md:text-5xl">My Creations</h2>
            <p className={`mt-3 text-sm sm:text-base ${muted}`}>All your AI-generated visuals in one place.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          ) : creations.length === 0 ? (
            <div className="relative mx-auto flex max-w-3xl flex-col items-center overflow-hidden rounded-[2rem] border border-cyan-200/40 bg-white/70 px-6 py-14 text-center shadow-xl shadow-cyan-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:px-10 sm:py-20">
              {/* Decorative glow */}
              <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

              {/* Floating mini doodles around the icon */}
              <div className="pointer-events-none absolute inset-0">
                <div className="float-slow absolute left-[8%] top-[10%] text-2xl opacity-60">✨</div>
                <div className="float-medium absolute right-[10%] top-[14%] text-3xl opacity-60">💎</div>
                <div className="float-fast absolute left-[15%] bottom-[18%] text-2xl opacity-55">⭐</div>
                <div className="float-medium absolute right-[16%] bottom-[22%] text-3xl opacity-60">🚀</div>
                <div className="float-slow absolute left-[42%] top-[6%] text-xl opacity-50">✦</div>
              </div>

              <div className="relative">
                <div className="relative mb-6">
                  {/* Pulse halo */}
                  <span className="absolute inset-0 -m-2 animate-ping rounded-[2rem] bg-cyan-400/20" />
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-2xl shadow-cyan-500/40 sm:h-32 sm:w-32">
                    <svg className="h-14 w-14 sm:h-16 sm:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-200">
                  ✨ Ready when you are
                </div>

                <h3 className="mt-3 text-2xl font-black leading-tight md:text-4xl">
                  Your future{" "}
                  <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                    catalogue starts here.
                  </span>
                </h3>

                <p className={`mx-auto mt-4 max-w-lg text-base leading-7 ${muted}`}>
                  Upload a design or product photo, pick a vibe, and premium AI visuals are ready in{" "}
                  <span className={`font-black ${darkMode ? "text-white/85" : "text-black/85"}`}>60 seconds</span>{" "}
                  — everything stays saved here, download anytime.
                </p>

                {/* Multi-CTA */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/textileprints-to-mockup"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/25 transition hover:scale-105 active:scale-95"
                  >
                    👕 Textile Mockup
                  </Link>
                  <Link
                    href="/jewellery-ai"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-amber-500/25 transition hover:scale-105 active:scale-95"
                  >
                    💎 Jewellery Shoot
                  </Link>
                  <Link
                    href="/productography-ai"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition hover:scale-105 active:scale-95"
                  >
                    📸 Productography
                  </Link>
                </div>

                <p className={`mt-5 text-xs ${muted}`}>
                  Need inspiration?{" "}
                  <Link href="/gallery" className="font-black text-cyan-600 hover:underline dark:text-cyan-300">
                    Browse the gallery →
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {creations.map((item) => {
                const displayImage = item.output_image_url || item.output_url || item.image_url || item.design_url;
                return (
                  <div key={item.id} className={`group relative overflow-hidden rounded-[2rem] border transition hover:shadow-2xl ${cardBg}`}>
                    <div 
                      className="aspect-[3/4] overflow-hidden bg-black/5 cursor-pointer"
                      onClick={() => item.status === "completed" && setSelectedImage(displayImage)}
                    >
                      <img
                        src={displayImage}
                        alt={`AI ${item.product_type || "catalogue"} visual generated with AgentForge AI on ${new Date(item.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-110"
                      />
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
                      <div className="mt-4 flex items-center justify-end gap-2">
                        {item.status === "completed" && (
                          <button
                            onClick={() => setSelectedImage(displayImage)}
                            title="Preview Image"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition hover:bg-blue-500 hover:text-white"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        )}
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
                          title="Download Image"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 transition hover:bg-cyan-500 hover:text-white"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Check out this AI mockup: ${displayImage}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Share on WhatsApp"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
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

      {/* Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md" onClick={() => setSelectedImage(null)}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:scale-110 active:scale-95"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={selectedImage} alt="AI-generated catalogue visual created with AgentForge AI — preview" className="mx-auto max-h-[90vh] w-auto max-w-full object-contain rounded-3xl" />
          </div>
        </div>
      )}
    </div>
  );
}
