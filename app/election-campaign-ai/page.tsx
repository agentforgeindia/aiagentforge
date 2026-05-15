"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/app/components/ThemeProvider";

type CandidateProfile = {
  candidateName: string;
  relationName: string;
  partyName: string;
  wardNumber: string;
  cityVillage: string;
  phoneNumber: string;
  language: string;
  slogan: string;
  promises: string;
  customPrimaryColor: string;
  customSecondaryColor: string;
};

const emptyProfile: CandidateProfile = {
  candidateName: "",
  relationName: "",
  partyName: "BJP",
  wardNumber: "",
  cityVillage: "",
  phoneNumber: "",
  language: "Punjabi",
  slogan: "",
  promises: "",
  customPrimaryColor: "#ff7a00",
  customSecondaryColor: "#16a34a",
};

const poses = [
  { id: "preserve-original", label: "Preserve Original", icon: "🛡️", desc: "Candidate image bilkul same rahegi" },
  { id: "folded-hands", label: "Folded Hands", icon: "🙏", desc: "Namaste vote appeal layout" },
  { id: "public-rally", label: "Public Rally", icon: "👥", desc: "Crowd + campaign vibe" },
  { id: "on-stage", label: "On Stage", icon: "🎤", desc: "Speech / rally stage style" },
  { id: "door-to-door", label: "Door To Door", icon: "🚪", desc: "Public connection poster" },
  { id: "news-style", label: "News Style", icon: "📰", desc: "Breaking news election creative" },
];

const parties = [
  {
    id: "bjp",
    label: "BJP",
    symbol: "🪷",
    symbolName: "Lotus",
    color: "from-orange-500 to-green-600",
    primaryColor: "#f97316",
    secondaryColor: "#16a34a",
    themeNote: "Orange + green political campaign tone",
  },
  {
    id: "congress",
    label: "Congress",
    symbol: "✋",
    symbolName: "Hand",
    color: "from-blue-700 to-orange-500",
    primaryColor: "#1d4ed8",
    secondaryColor: "#f97316",
    themeNote: "Blue + white + orange campaign tone",
  },
  {
    id: "aap",
    label: "AAP",
    symbol: "🧹",
    symbolName: "Broom",
    color: "from-sky-600 to-white",
    primaryColor: "#0284c7",
    secondaryColor: "#ffffff",
    themeNote: "Clean white + sky blue public service tone",
  },
  {
    id: "akali",
    label: "Akali Dal",
    symbol: "⚖️",
    symbolName: "Scale",
    color: "from-blue-800 to-yellow-400",
    primaryColor: "#1e3a8a",
    secondaryColor: "#facc15",
    themeNote: "Royal blue + yellow Punjab campaign tone",
  },
  {
    id: "independent",
    label: "Independent",
    symbol: "⭐",
    symbolName: "Custom",
    color: "from-purple-600 to-cyan-500",
    primaryColor: "#9333ea",
    secondaryColor: "#06b6d4",
    themeNote: "Premium independent candidate theme",
  },
  {
    id: "other",
    label: "Other",
    symbol: "➕",
    symbolName: "Upload",
    color: "from-slate-600 to-cyan-500",
    primaryColor: "#475569",
    secondaryColor: "#06b6d4",
    themeNote: "Apni party, symbol aur colors add karo",
  },
];

const backgrounds = [
  { id: "evm-vote", label: "EVM + Vote Symbol", icon: "🗳️", desc: "Voting machine, ballot texture, vote mark" },
  { id: "ink-finger", label: "Inked Finger", icon: "☝️", desc: "Voter ink finger + democracy theme" },
  { id: "street", label: "Street Campaign", icon: "🛣️", desc: "Local road, banners, public area" },
  { id: "park", label: "Park / Public Place", icon: "🌳", desc: "Clean civic background" },
  { id: "stage", label: "Stage Rally", icon: "🎪", desc: "Lights, mic, public meeting" },
  { id: "village", label: "Village Punjab", icon: "🚜", desc: "Rural Punjab campaign feel" },
  { id: "city", label: "City Development", icon: "🏙️", desc: "Road, street lights, urban growth" },
  { id: "crowd", label: "Public Crowd", icon: "👥", desc: "Rally crowd silhouettes" },
  { id: "news", label: "News Poster", icon: "📺", desc: "Headline / announcement format" },
];

const occasions = [
  { id: "election", label: "Election Vote Appeal", icon: "🗳️" },
  { id: "festival", label: "Festival Wishes", icon: "🪔" },
  { id: "national-day", label: "National Day", icon: "🇮🇳" },
  { id: "international-day", label: "International Day", icon: "🌍" },
  { id: "rally-invite", label: "Rally Invite", icon: "📣" },
  { id: "development", label: "Development Promise", icon: "🏗️" },
  { id: "birthday", label: "Birthday Wishes", icon: "🎂" },
  { id: "victory", label: "Victory Poster", icon: "🏆" },
];

const latestDays = [
  "Republic Day",
  "Independence Day",
  "Labour Day",
  "Women’s Day",
  "Environment Day",
  "Constitution Day",
  "Gurpurab",
  "Diwali",
  "Holi",
  "Baisakhi",
  "New Year",
  "Shaheedi Diwas",
];

export default function ElectionCampaignAIPage() {
  const { darkMode } = useTheme();

  const [selectedPose, setSelectedPose] = useState("preserve-original");
  const [selectedParty, setSelectedParty] = useState("bjp");
  const [selectedBackground, setSelectedBackground] = useState("evm-vote");
  const [selectedOccasion, setSelectedOccasion] = useState("election");
  const [selectedDay, setSelectedDay] = useState("Republic Day");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [customSymbol, setCustomSymbol] = useState<string | null>(null);
  const [profile, setProfile] = useState<CandidateProfile>(emptyProfile);
  const [autoSaveStatus, setAutoSaveStatus] = useState("Saved locally");

  const selectedPartyData = useMemo(
    () => parties.find((party) => party.id === selectedParty) ?? parties[0],
    [selectedParty]
  );

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#f8fbff] text-[#07111f]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.05] shadow-black/30"
    : "border-black/10 bg-white shadow-cyan-100";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const inputClass = darkMode
    ? "border-white/10 bg-white/10 text-white placeholder:text-white/35"
    : "border-black/10 bg-slate-50 text-[#07111f] placeholder:text-black/35";

  useEffect(() => {
    const savedProfile = localStorage.getItem("agentforgeElectionCandidateProfile");
    const savedParty = localStorage.getItem("agentforgeElectionSelectedParty");
    const savedBackground = localStorage.getItem("agentforgeElectionSelectedBackground");
    const savedOccasion = localStorage.getItem("agentforgeElectionSelectedOccasion");
    const savedDay = localStorage.getItem("agentforgeElectionSelectedDay");

    if (savedProfile) {
      try {
        setProfile({ ...emptyProfile, ...JSON.parse(savedProfile) });
      } catch {
        setProfile(emptyProfile);
      }
    }

    if (savedParty) setSelectedParty(savedParty);
    if (savedBackground) setSelectedBackground(savedBackground);
    if (savedOccasion) setSelectedOccasion(savedOccasion);
    if (savedDay) setSelectedDay(savedDay);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("agentforgeElectionCandidateProfile", JSON.stringify(profile));
      localStorage.setItem("agentforgeElectionSelectedParty", selectedParty);
      localStorage.setItem("agentforgeElectionSelectedBackground", selectedBackground);
      localStorage.setItem("agentforgeElectionSelectedOccasion", selectedOccasion);
      localStorage.setItem("agentforgeElectionSelectedDay", selectedDay);
      setAutoSaveStatus("Auto saved");
    }, 400);

    return () => clearTimeout(timer);
  }, [profile, selectedParty, selectedBackground, selectedOccasion, selectedDay]);

  const handleProfileChange = (field: keyof CandidateProfile, value: string) => {
    setAutoSaveStatus("Saving...");
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePartyChange = (partyId: string) => {
    const party = parties.find((item) => item.id === partyId);
    if (!party) return;

    setSelectedParty(partyId);
    setAutoSaveStatus("Saving...");

    setProfile((prev) => ({
      ...prev,
      partyName: partyId === "other" ? prev.partyName : party.label,
      customPrimaryColor: party.primaryColor,
      customSecondaryColor: party.secondaryColor,
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleCustomSymbolUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomSymbol(URL.createObjectURL(file));
  };

  const clearSavedProfile = () => {
    localStorage.removeItem("agentforgeElectionCandidateProfile");
    localStorage.removeItem("agentforgeElectionSelectedParty");
    localStorage.removeItem("agentforgeElectionSelectedBackground");
    localStorage.removeItem("agentforgeElectionSelectedOccasion");
    localStorage.removeItem("agentforgeElectionSelectedDay");
    setProfile(emptyProfile);
    setSelectedParty("bjp");
    setSelectedBackground("evm-vote");
    setSelectedOccasion("election");
    setSelectedDay("Republic Day");
    setCustomSymbol(null);
    setAutoSaveStatus("Reset done");
  };

  return (
    <main className={`min-h-screen overflow-hidden ${bg}`}>
      <section className="relative px-4 py-10 md:px-8 lg:px-12">
        {/* Premium political background overlays */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-90px] top-0 h-80 w-80 rounded-full bg-orange-500/20 blur-[110px]" />
          <div className="absolute right-[-80px] top-20 h-80 w-80 rounded-full bg-cyan-500/20 blur-[110px]" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-green-500/10 blur-[110px]" />

          <div className="absolute left-6 top-28 rotate-[-12deg] text-[9rem] opacity-[0.045]">🗳️</div>
          <div className="absolute right-10 top-16 rotate-[10deg] text-[7rem] opacity-[0.055]">☝️</div>
          <div className="absolute bottom-16 left-8 rotate-[8deg] text-[8rem] opacity-[0.035]">✅</div>
          <div className="absolute bottom-10 right-20 rotate-[-8deg] text-[9rem] opacity-[0.04]">📣</div>
          <div className="absolute bottom-0 left-0 h-28 w-full bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-400">
                AgentForge AI Agent
              </p>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                Election Campaign AI
              </h1>
              <p className={`mt-4 max-w-3xl text-lg ${muted}`}>
                Candidate details ek baar save karo, party select karo, symbol/theme auto-fill hoga —
                Punjabi, Hindi, English posters, festival wishes aur campaign creatives instantly ready.
              </p>
            </div>

            <Link
              href="/pricing"
              className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 font-black text-white shadow-xl shadow-cyan-500/25"
            >
              Upgrade Credits
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className={`rounded-[2rem] border p-5 shadow-2xl md:p-7 ${card}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">Create Political Poster</h2>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Upload → Candidate Profile → Party → Occasion → Background → Generate
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-black text-green-400">
                    {autoSaveStatus}
                  </span>
                  <button
                    type="button"
                    onClick={clearSavedProfile}
                    className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-black text-red-400"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="font-black text-cyan-300">Candidate Image Safety Rule</p>
                <p className={`mt-1 text-sm ${muted}`}>
                  Default mode candidate ki original image/cutout preserve karega. Face, identity,
                  skin tone, turban, beard, body shape aur expression change nahi karna.
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label
                  className={`flex min-h-72 cursor-pointer items-center justify-center rounded-[1.5rem] border border-dashed p-5 text-center ${
                    darkMode ? "border-white/15 bg-white/[0.03]" : "border-black/10 bg-slate-50"
                  }`}
                >
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  {previewImage ? (
                    <div>
                      <img
                        src={previewImage}
                        alt="Candidate preview"
                        className="mx-auto h-60 w-48 rounded-3xl object-cover shadow-xl"
                      />
                      <p className={`mt-3 text-xs font-bold ${muted}`}>Original candidate image selected</p>
                    </div>
                  ) : (
                    <div>
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-green-600 text-4xl">
                        📸
                      </div>
                      <p className="font-black">Upload Candidate Photo</p>
                      <p className={`mt-1 text-sm ${muted}`}>Clear front photo best rahegi</p>
                    </div>
                  )}
                </label>

                <div>
                  <h3 className="mb-3 text-lg font-black">Pose / Layout Mode</h3>
                  <div className="grid max-h-72 gap-3 overflow-y-auto pr-1">
                    {poses.map((pose) => (
                      <button
                        key={pose.id}
                        type="button"
                        onClick={() => setSelectedPose(pose.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selectedPose === pose.id
                            ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/15"
                            : darkMode
                              ? "border-white/10 bg-white/[0.03]"
                              : "border-black/10 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{pose.icon}</span>
                          <div>
                            <p className="font-black">{pose.label}</p>
                            <p className={`text-xs ${muted}`}>{pose.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <h3 className="mt-7 text-lg font-black">Candidate Profile</h3>
              <p className={`mt-1 text-sm ${muted}`}>Ye details auto-save rahengi jab tak user khud change na kare.</p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  value={profile.candidateName}
                  onChange={(e) => handleProfileChange("candidateName", e.target.value)}
                  className={`rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  placeholder="Candidate Name"
                />
                <input
                  value={profile.relationName}
                  onChange={(e) => handleProfileChange("relationName", e.target.value)}
                  className={`rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  placeholder="Father / Husband Name"
                />
                <input
                  value={profile.wardNumber}
                  onChange={(e) => handleProfileChange("wardNumber", e.target.value)}
                  className={`rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  placeholder="Ward Number"
                />
                <input
                  value={profile.cityVillage}
                  onChange={(e) => handleProfileChange("cityVillage", e.target.value)}
                  className={`rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  placeholder="City / Village"
                />
                <input
                  value={profile.phoneNumber}
                  onChange={(e) => handleProfileChange("phoneNumber", e.target.value)}
                  className={`rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  placeholder="Phone Number"
                />
                <select
                  value={profile.language}
                  onChange={(e) => handleProfileChange("language", e.target.value)}
                  className={`rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                >
                  <option>Punjabi</option>
                  <option>Hindi</option>
                  <option>English</option>
                  <option>Punjabi + Hindi</option>
                  <option>Punjabi + English</option>
                  <option>Hindi + English</option>
                </select>
              </div>

              <textarea
                value={profile.slogan}
                onChange={(e) => handleProfileChange("slogan", e.target.value)}
                className={`mt-4 min-h-24 w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                placeholder="Campaign slogan / festival wish line..."
              />

              <textarea
                value={profile.promises}
                onChange={(e) => handleProfileChange("promises", e.target.value)}
                className={`mt-4 min-h-24 w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                placeholder="Local promises / work points: roads, water, street lights, cleanliness..."
              />

              <h3 className="mt-7 text-lg font-black">Select Party Theme</h3>
              <p className={`mt-1 text-sm ${muted}`}>
                Party select karte hi symbol, theme color aur party name auto-fill ho jayega.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {parties.map((party) => (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => handlePartyChange(party.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedParty === party.id
                        ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/15"
                        : darkMode
                          ? "border-white/10 bg-white/5"
                          : "border-black/10 bg-white"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className={`h-10 flex-1 rounded-xl bg-gradient-to-r ${party.color}`} />
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-md">
                        {party.symbol}
                      </div>
                    </div>
                    <p className="font-black">{party.label}</p>
                    <p className={`mt-1 text-xs ${muted}`}>{party.symbolName} • {party.themeNote}</p>
                  </button>
                ))}
              </div>

              {selectedParty === "other" && (
                <div className="mt-4 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <h4 className="font-black">Custom Party / Other Candidate</h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <input
                      value={profile.partyName}
                      onChange={(e) => handleProfileChange("partyName", e.target.value)}
                      className={`rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                      placeholder="Party / Group Name"
                    />
                    <label className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm font-bold ${inputClass}`}>
                      Upload Party Symbol
                      <input type="file" accept="image/*" className="hidden" onChange={handleCustomSymbolUpload} />
                    </label>
                    <input
                      type="color"
                      value={profile.customPrimaryColor}
                      onChange={(e) => handleProfileChange("customPrimaryColor", e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-transparent"
                      title="Primary color"
                    />
                    <input
                      type="color"
                      value={profile.customSecondaryColor}
                      onChange={(e) => handleProfileChange("customSecondaryColor", e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-transparent"
                      title="Secondary color"
                    />
                  </div>
                </div>
              )}

              <h3 className="mt-7 text-lg font-black">Poster Type / Occasion</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {occasions.map((occasion) => (
                  <button
                    key={occasion.id}
                    type="button"
                    onClick={() => setSelectedOccasion(occasion.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedOccasion === occasion.id
                        ? "border-cyan-400 bg-cyan-400/10"
                        : darkMode
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-black/10 bg-white"
                    }`}
                  >
                    <span className="text-2xl">{occasion.icon}</span>
                    <p className="mt-2 text-sm font-black">{occasion.label}</p>
                  </button>
                ))}
              </div>

              <h3 className="mt-7 text-lg font-black">Latest Festival / National / International Days</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {latestDays.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                      selectedDay === day
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                        : darkMode
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-black/10 bg-white"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <h3 className="mt-7 text-lg font-black">Background Style</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {backgrounds.map((background) => (
                  <button
                    key={background.id}
                    type="button"
                    onClick={() => setSelectedBackground(background.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedBackground === background.id
                        ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/15"
                        : darkMode
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-black/10 bg-white"
                    }`}
                  >
                    <span className="text-3xl">{background.icon}</span>
                    <p className="mt-2 font-black">{background.label}</p>
                    <p className={`mt-1 text-xs ${muted}`}>{background.desc}</p>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="mt-7 w-full rounded-2xl bg-gradient-to-r from-orange-500 via-cyan-500 to-blue-600 px-6 py-4 text-lg font-black text-white shadow-2xl shadow-cyan-500/20"
              >
                Generate Election Poster
              </button>

              <p className={`mt-3 text-center text-xs ${muted}`}>
                Backend attach karte time prompt mein candidate identity preserve rule hard-coded rahega.
              </p>
            </div>

            <div className={`sticky top-6 h-fit rounded-[2rem] border p-5 shadow-2xl md:p-7 ${card}`}>
              <h2 className="text-2xl font-black">Live Poster Preview</h2>
              <p className={`mt-1 text-sm ${muted}`}>Final output yahin show hoga after generation.</p>

              <div className="mt-6 overflow-hidden rounded-[1.7rem] border border-cyan-400/20 bg-gradient-to-br from-orange-500/10 via-cyan-500/10 to-blue-700/20 p-4">
                <div className="relative mx-auto flex min-h-[560px] max-w-md flex-col justify-between overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#07111f] p-5 text-white shadow-2xl">
                  <div className="absolute inset-0 opacity-20">
                    <div className={`absolute inset-x-0 top-0 h-44 bg-gradient-to-r ${selectedPartyData.color}`} />
                    <div className="absolute bottom-10 left-4 text-7xl opacity-20">🗳️</div>
                    <div className="absolute right-5 top-32 text-6xl opacity-20">✅</div>
                    <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-black to-transparent" />
                  </div>

                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
                        {selectedDay}
                      </p>
                      <h3 className="mt-3 text-2xl font-black leading-tight">
                        {profile.slogan || "ਤੁਹਾਡੀ ਅਵਾਜ਼, ਤੁਹਾਡਾ ਵਿਕਾਸ"}
                      </h3>
                    </div>

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-3xl shadow-xl">
                      {selectedParty === "other" && customSymbol ? (
                        <img src={customSymbol} alt="Custom party symbol" className="h-full w-full object-cover" />
                      ) : (
                        selectedPartyData.symbol
                      )}
                    </div>
                  </div>

                  <div className="relative mt-8 flex flex-1 items-center justify-center">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Candidate preserved preview"
                        className="h-72 w-56 rounded-[2rem] object-cover shadow-2xl ring-4 ring-white/15"
                      />
                    ) : (
                      <div className="flex h-72 w-56 items-center justify-center rounded-[2rem] border border-dashed border-white/20 bg-white/10 text-center">
                        <div>
                          <div className="text-5xl">👤</div>
                          <p className="mt-3 text-sm font-bold text-white/60">Candidate Photo</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative rounded-[1.2rem] bg-white p-4 text-[#07111f]">
                    <p className="text-xs font-black uppercase tracking-wider text-cyan-600">
                      {profile.partyName || selectedPartyData.label} • Ward {profile.wardNumber || "00"}
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      {profile.candidateName || "Candidate Name"}
                    </h3>
                    <p className="text-sm font-bold text-black/55">
                      {profile.cityVillage || "City / Village"} {profile.phoneNumber ? `• ${profile.phoneNumber}` : ""}
                    </p>
                    <p className="mt-3 rounded-xl bg-[#07111f] px-3 py-2 text-center text-sm font-black text-white">
                      Vote & Support
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm font-bold">
                <div className="rounded-2xl bg-white/10 p-4">Instagram</div>
                <div className="rounded-2xl bg-white/10 p-4">WhatsApp</div>
                <div className="rounded-2xl bg-white/10 p-4">Flex</div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="font-black">AI Prompt Safety</p>
                <p className={`mt-2 text-xs ${muted}`}>
                  Do not alter candidate face, identity, facial structure, skin tone, hairstyle,
                  beard, turban, clothes, expression or body shape. Use uploaded image as fixed
                  cutout layer. Only change background, poster layout, typography and campaign elements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
