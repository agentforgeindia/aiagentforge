"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  generationId?: string;
  agent?: string;
  onClose: () => void;
  onCreditsAwarded: (credits: number) => void;
}

export default function RatingFeedbackModal({
  generationId,
  agent,
  onClose,
  onCreditsAwarded,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hasFeedback = feedback.trim().length > 0;
  const previewCredits = (rating > 0 ? 1 : 0) + (hasFeedback ? 2 : 0);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not logged in");

      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || undefined,
          generation_id: generationId,
          agent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");

      setSubmitted(true);
      onCreditsAwarded(data.creditsAwarded);
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      alert(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-1 text-center text-2xl">⭐</div>
        <h2 className="mb-1 text-center text-lg font-bold text-gray-900 dark:text-white">
          Aapka result kaisa laga?
        </h2>
        <p className="mb-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Rating do aur{" "}
          <span className="font-semibold text-cyan-600">credits kamao</span>!
        </p>

        {/* Stars */}
        <div className="mb-4 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="text-4xl transition-transform hover:scale-110 active:scale-95"
            >
              <span
                className={
                  star <= (hovered || rating)
                    ? "text-yellow-400"
                    : "text-gray-300"
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>

        {/* Star label */}
        {rating > 0 && (
          <p className="mb-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {rating === 5
              ? "Excellent! 🔥"
              : rating === 4
                ? "Bahut accha! 👍"
                : rating === 3
                  ? "Theek hai 😊"
                  : rating === 2
                    ? "Thoda improve karo 🤔"
                    : "Bahut bura 😞"}
          </p>
        )}

        {/* Feedback textarea */}
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Kuch improve karna chahte ho? (optional) — +2 credits"
          rows={3}
          className="mb-3 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />

        {/* Credit preview */}
        {rating > 0 && (
          <div className="mb-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-3 text-center dark:from-cyan-900/20 dark:to-blue-900/20">
            <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
              🎁 Aapko milenge:{" "}
              <span className="text-lg font-black">{previewCredits} credits</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Rating: +1 {hasFeedback ? "· Feedback: +2" : ""}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Baad mein
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Submit & Kamao 🎉"}
          </button>
        </div>
      </div>
    </div>
  );
}
