"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CompleteProfilePage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const savePhone = async () => {
    if (!phone) {
      alert("Please enter mobile number");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        phone,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      alert("Failed to save mobile number");
      console.error(error);
      return;
    }

    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b14] px-4 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-cyan-400/20 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        
        <div className="mb-6 text-center">
          <img
            src="/af-logo.png"
            alt="AgentForge"
            className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover"
          />

          <h1 className="text-3xl font-black">
            Complete Your Profile
          </h1>

          <p className="mt-2 text-sm text-white/60">
            Add your mobile number to continue using AgentForge AI
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="tel"
            placeholder="Enter Mobile Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-2xl border border-cyan-400/20 bg-white/10 px-5 py-4 text-white outline-none transition focus:border-cyan-400"
          />

          <button
            onClick={savePhone}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-4 font-bold text-black transition hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}