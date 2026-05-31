"use client";

import { useEffect, useState } from "react";

type SlideVideo = {
  id: string;
  title: string;
  url: string;
  agent: string;
  emoji: string;
};

function ytThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export default function HeroSlider({ videos }: { videos: SlideVideo[] }) {
  const [active, setActive] = useState(0);

  // Auto-advance every 3.5s
  useEffect(() => {
    if (videos.length <= 1) return;
    const t = setInterval(() => {
      setActive((prev) => (prev + 1) % videos.length);
    }, 3500);
    return () => clearInterval(t);
  }, [videos.length]);

  if (!videos.length) return null;

  const current = videos[active];

  return (
    <div className="flex flex-col gap-2">
      {/* Main featured thumbnail */}
      <a
        href={current.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-2xl shadow-lg"
        style={{ aspectRatio: "16/9" }}
      >
        {videos.map((v, i) => (
          <img
            key={v.id}
            src={ytThumb(v.id)}
            alt={v.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/40" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-xl transition group-hover:scale-110">
            <svg className="h-5 w-5 translate-x-0.5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Category badge */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-black/80 shadow">
          {current.emoji} {current.agent}
        </span>

        {/* Title bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
          <p className="line-clamp-1 text-xs font-bold text-white">{current.title}</p>
        </div>
      </a>

      {/* Thumbnail strip */}
      <div className="flex gap-2">
        {videos.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setActive(i)}
            className={`group relative flex-1 overflow-hidden rounded-lg transition-all duration-200 ${
              i === active ? "ring-2 ring-cyan-400 ring-offset-1" : "opacity-60 hover:opacity-90"
            }`}
            style={{ aspectRatio: "16/9" }}
            aria-label={v.title}
          >
            <img
              src={ytThumb(v.id)}
              alt={v.title}
              className="h-full w-full object-cover"
            />
            <div className={`absolute inset-0 transition ${i === active ? "bg-black/10" : "bg-black/30"}`} />
            {i === active && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90">
                  <svg className="h-2.5 w-2.5 translate-x-px text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Dot progress */}
      <div className="flex justify-center gap-1.5">
        {videos.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-5 bg-cyan-500" : "w-1.5 bg-black/20 dark:bg-white/25"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
