"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  CalendarClock,
  Send,
  Trash2,
  CheckCircle2,
  Clock3,
} from "lucide-react";

type Platform = "instagram" | "facebook" | "linkedin" | "twitter";
type Status = "uploaded" | "scheduled";

type UploadItem = {
  id: string;
  file: File;
  preview: string;
  platforms: Platform[];
  caption: string;
  hashtags: string;
  schedule: string;
  status: Status;
};

const allPlatforms: Platform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "twitter",
];

const platformLabels: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
};

export default function SocialSchedulerPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] =
    useState<Platform[]>(["instagram"]);
  const [schedule, setSchedule] = useState("");

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(allPlatforms);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newItems: UploadItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      platforms: selectedPlatforms.length ? selectedPlatforms : ["instagram"],
      caption: "Premium creative ready for your audience 🚀",
      hashtags: "#AgentForge #Marketing #SocialMedia #AIAutomation",
      schedule,
      status: "uploaded",
    }));

    setItems((prev) => [...newItems, ...prev]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (
    id: string,
    field: keyof UploadItem,
    value: string | Platform[]
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const schedulePosts = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        schedule: item.schedule || schedule,
        status: "scheduled",
      }))
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 transition dark:bg-slate-950 dark:text-white">
      <section className="border-b border-slate-200 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-violet-500/10 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-white/70 px-4 py-2 text-sm font-bold text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
            <Send className="h-4 w-4" />
            AgentForge Social Scheduler
          </div>

          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight">
            Upload Once.
            <br />
            Schedule Everywhere.
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Upload creatives, select multiple platforms, schedule time, and let
            n8n auto-post them.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[390px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Bulk Upload</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload multiple creatives
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-3 text-white">
              <UploadCloud className="h-5 w-5" />
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cyan-400/30 bg-cyan-50 px-5 py-10 text-center transition hover:bg-cyan-100 dark:bg-cyan-400/5 dark:hover:bg-cyan-400/10">
            <UploadCloud className="mb-3 h-10 w-10 text-cyan-500" />
            <span className="text-lg font-black">Upload Designs</span>
            <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              PNG, JPG, WEBP supported
            </span>

            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Select Platforms
              </h3>

              <button
                type="button"
                onClick={selectAllPlatforms}
                className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
              >
                Select All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allPlatforms.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    selectedPlatforms.includes(platform)
                      ? "border-cyan-400 bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                      : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <span className="block text-sm font-black">
                    {platformLabels[platform]}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedPlatforms.includes(platform)
                      ? "Selected"
                      : "Tap to select"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
              <CalendarClock className="h-4 w-4" />
              Schedule Time
            </label>

            <input
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5"
            />
          </div>

          <button
            type="button"
            onClick={schedulePosts}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01]"
          >
            <Send className="h-4 w-4" />
            Schedule Posts
          </button>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Upload Queue</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Uploaded and scheduled creatives
              </p>
            </div>

            <div className="rounded-full border border-cyan-400/30 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
              {items.length} Designs
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white dark:border-white/10 dark:bg-white/5">
              <div className="text-center">
                <UploadCloud className="mx-auto h-14 w-14 text-slate-400" />
                <h3 className="mt-4 text-xl font-black">
                  No Designs Uploaded
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Upload creatives from the left panel
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-white/10 dark:bg-white/5 dark:shadow-none"
                >
                  <div className="relative aspect-square">
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white transition hover:bg-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900">
                      {item.status === "scheduled" ? "Scheduled" : "Uploaded"}
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <p className="truncate text-sm font-black">
                      {item.file.name}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Uploaded successfully
                    </div>

                    <textarea
                      value={item.caption}
                      onChange={(e) =>
                        updateItem(item.id, "caption", e.target.value)
                      }
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5"
                    />

                    <input
                      value={item.hashtags}
                      onChange={(e) =>
                        updateItem(item.id, "hashtags", e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5"
                    />

                    <div className="flex flex-wrap gap-2">
                      {item.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                        >
                          {platformLabels[platform]}
                        </span>
                      ))}
                    </div>

                    <input
                      type="datetime-local"
                      value={item.schedule}
                      onChange={(e) =>
                        updateItem(item.id, "schedule", e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5"
                    />

                    {item.status === "scheduled" && (
                      <div className="flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                        <Clock3 className="h-4 w-4" />
                        Scheduled for:{" "}
                        {item.schedule
                          ? new Date(item.schedule).toLocaleString()
                          : "Time not selected"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}