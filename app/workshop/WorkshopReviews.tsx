"use client";

// ============================================================
// WorkshopReviews — shows APPROVED attendee reviews on /workshop.
// Self-contained: fetches /api/workshop/review and renders cards.
// Hidden until at least one review is approved.
// ============================================================

import { useEffect, useState } from "react";

type Review = {
  id: string;
  name: string;
  rating: number;
  feedback_points: string[];
  suggestions: string | null;
  logo_url: string | null;
  photo_url: string | null;
  consent: boolean;
};

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-lg">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? "text-amber-400" : "text-slate-200"}>★</span>
      ))}
    </div>
  );
}

export default function WorkshopReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/workshop/review")
      .then((r) => r.json())
      .then((j) => setReviews(j.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-500">Reviews</p>
        <h2 className="mx-auto mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-5xl">
          What Attendees Say
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => {
          const showImg = r.consent && (r.photo_url || r.logo_url);
          return (
            <div key={r.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                {showImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(r.photo_url || r.logo_url) as string}
                    alt={r.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-700">
                    {r.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-800">{r.name}</p>
                  <Stars n={r.rating} />
                </div>
              </div>

              {r.suggestions && (
                <p className="mb-3 text-sm leading-6 text-slate-600">“{r.suggestions}”</p>
              )}

              {r.feedback_points?.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {r.feedback_points.map((p) => (
                    <span key={p} className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
