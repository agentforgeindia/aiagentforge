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
        <section className="mx-auto max-w-7xl px-5 py-24 md:py-32">
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
                    <div 
                      className="aspect-[3/4] overflow-hidden bg-black/5 cursor-pointer"
                      onClick={() => item.status === "completed" && setSelectedImage(displayImage)}
                    >
                      <img src={displayImage} alt={item.product_type || "Creation"} className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-110" />
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
            <img src={selectedImage} alt="Preview" className="w-full aspect-[3/4] object-cover object-top rounded-3xl" />
          </div>
        </div>
      )}
    </div>
  );
}
