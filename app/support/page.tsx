"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const agents = [
  {
    title: "TextilePrints to Mockup AI",
    desc: "Convert textile prints into premium fashion mockups.",
    link: "/textileprints-to-mockup",
  },
  {
    title: "Jewellery AI",
    desc: "Create model shoots and product photos for jewellery.",
    link: "/jewellery-ai",
  },
  {
    title: "ProductShot AI",
    desc: "Turn product photos into ad-ready visuals.",
    link: "/productshot-ai",
  },
];

const quickHelp = [
  ["Generate Mockups", "Upload your design and create model-based images."],
  ["Credits", "Credits are visible only after login and used per generation."],
  ["Design Code", "Add article numbers or textile codes on output images."],
  ["Better Output", "Use clear, straight, high-quality design images."],
  ["Billing", "Choose a plan based on your monthly usage."],
  ["Usage Rights", "Use generated visuals for ads, catalogues, and social media."],
];

const tutorials = [
  {
    title: "How to Upload a Textile Design",
    desc: "Learn the correct upload process for clean AI output.",
    youtubeUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID_1",
  },
  {
    title: "How to Generate AI Mockups",
    desc: "Select style, add details, and create your first output.",
    youtubeUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID_2",
  },
  {
    title: "How to Add Article Number",
    desc: "Show your design identity on the final mockup.",
    youtubeUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID_3",
  },
];

const bestPractices = [
  "Upload clear, high-resolution textile images",
  "Use front-facing flat design images",
  "Avoid blurred or folded fabric photos",
  "Keep the full pattern visible in the image",
  "Use proper lighting in reference images",
  "Keep design alignment straight before uploading",
];

const faqs = [
  ["What image format should I upload?", "You can upload JPG, PNG, JPEG, or WEBP images. High-resolution images are recommended."],
  ["How long does image generation take?", "Usually 10–30 seconds depending on image size and server load."],
  ["Will my textile design change?", "The system is designed to preserve your uploaded design as closely as possible."],
  ["Can I add my article/design code?", "Yes. You can mention the article number in your prompt or enable it in generation settings."],
  ["Can I use generated images commercially?", "Yes. You can use generated images for catalogues, ads, social media, and sales."],
  ["What if output is not correct?", "Try again with a clearer input image, better lighting, or more specific instructions."],
];

export default function SupportPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Replace with real Supabase auth/session later.
  const isLoggedIn = false;
  const credits = 5;

  useEffect(() => {
    const savedTheme = localStorage.getItem("agentforge-theme");
    if (savedTheme === "dark") setDarkMode(true);
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("agentforge-theme", next ? "dark" : "light");
      return next;
    });
  };

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/80 shadow-black/10";
  const muted = darkMode ? "text-white/60" : "text-black/60";
  const softCard = darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70";

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />

      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10">
        

        <section className="mx-auto max-w-7xl px-5 py-14 text-center md:py-20">
          <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-600">
            Support & Tutorials
          </div>

          <h2 className="mx-auto max-w-5xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Everything You Need
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Step by Step
            </span>
          </h2>

          <p className={`mx-auto mt-6 max-w-3xl text-lg leading-8 ${muted}`}>
            Learn how to use AgentForge, watch tutorials, understand credits, and improve output quality without confusion.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {quickHelp.map(([title, desc], index) => (
              <div key={title} className={`rounded-[1.5rem] border p-5 text-center shadow-xl backdrop-blur-xl ${card}`}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/20 text-xl font-black text-cyan-600">
                  {index + 1}
                </div>
                <h4 className="text-sm font-black leading-5">{title}</h4>
                <p className={`mt-2 text-xs leading-5 ${muted}`}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-12">
          <div className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-8 ${card}`}>
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <h3 className="text-3xl font-black">Tutorials — Watch & Learn</h3>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>
                Replace these YouTube embed URLs with your final tutorial video links.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {tutorials.map((item, index) => (
                <div key={item.title} className={`overflow-hidden rounded-3xl border ${softCard}`}>
                  <div className="aspect-video w-full overflow-hidden bg-black">
                    <iframe
                      src={item.youtubeUrl}
                      title={item.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">Video {index + 1}</p>
                    <h4 className="mt-2 text-lg font-black">{item.title}</h4>
                    <p className={`mt-2 text-sm leading-6 ${muted}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-12">
          <div className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-8 ${card}`}>
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <h3 className="text-3xl font-black">Best Practices</h3>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>Better input gives better AI output.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {bestPractices.map((item) => (
                <div key={item} className={`rounded-2xl border p-4 text-sm font-semibold ${softCard}`}>
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-16">
          <div className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-8 ${card}`}>
            <div className="mb-6 text-center">
              <h3 className="text-3xl font-black">Frequently Asked Questions</h3>
            </div>

            <div className="space-y-3">
              {faqs.map(([q, a], index) => (
                <div key={q} className={`rounded-2xl border ${softCard}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left font-black"
                  >
                    <span>{q}</span>
                    <span className="text-xl text-cyan-500">{openFaq === index ? "−" : "+"}</span>
                  </button>

                  {openFaq === index && <p className={`px-5 pb-5 text-sm leading-7 ${muted}`}>{a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className="rounded-[2rem] bg-gradient-to-r from-cyan-400 to-blue-600 p-8 text-center text-white shadow-2xl shadow-cyan-500/30 md:p-10">
            <h3 className="text-3xl font-black md:text-4xl">Still need help?</h3>
            <p className="mx-auto mt-3 max-w-2xl text-white/85">
              Contact support or login to continue creating premium AI visuals.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="rounded-full bg-white px-8 py-4 font-black text-black">
                Contact Support
              </Link>
              <Link href="/login" className="rounded-full bg-black/20 px-8 py-4 font-black text-white">
                Login
              </Link>
            </div>
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
    </main>
  );
}
