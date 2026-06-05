"use client";

import { useEffect, useState } from "react";

interface Props {
  credits: number;
  onClose: () => void;
}

export default function CongratulationsPopup({ credits, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 50);
    // Auto-close after 5s
    const close = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 5000);
    return () => {
      clearTimeout(t);
      clearTimeout(close);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center p-6 pointer-events-none sm:items-center">
      <div
        className={`pointer-events-auto w-full max-w-xs transform rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-6 text-white shadow-2xl transition-all duration-500 ${
          visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"
        }`}
      >
        {/* Confetti emoji row */}
        <div className="mb-2 text-center text-3xl">🎉 🏆 🎉</div>

        <h2 className="mb-1 text-center text-xl font-black tracking-tight">
          Congratulations!
        </h2>
        <p className="mb-3 text-center text-4xl font-black">
          +{credits} Credits
        </p>
        <p className="text-center text-sm font-medium text-white/80">
          Aapne {credits} credit{credits !== 1 ? "s" : ""} jeet liye! 🎁
          <br />
          Ye aapke account mein add ho gaye hain.
        </p>

        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 400);
          }}
          className="mt-4 w-full rounded-xl bg-white/20 py-2.5 text-sm font-semibold hover:bg-white/30 transition"
        >
          Shukriya! 🙏
        </button>
      </div>
    </div>
  );
}
