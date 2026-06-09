"use client";

// /careers/details/[id] — passed candidate submits address + landmark,
// detects location, sees distance from AgentForge office on a map, submits.

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Navigation, CheckCircle2, Building2 } from "lucide-react";
import PageDoodles from "@/app/components/PageDoodles";

// ── AgentForge office location (UPDATE these to the real coords) ──
const OFFICE = { lat: 19.26621226817183, lng: 72.96567637084333, label: "AgentForge HQ" };

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [address, setAddress]   = useState("");
  const [locality, setLocality] = useState("");
  const [landmark, setLandmark] = useState("");
  // Personal details
  const [dob, setDob]           = useState("");
  const [gender, setGender]     = useState("");
  const [marital, setMarital]   = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [languages, setLanguages] = useState("");
  const [company, setCompany]   = useState("");
  const [coords, setCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [dist, setDist]         = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr]     = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  // ── Detect location ──
  function detect() {
    if (!navigator.geolocation) { setGeoErr("Location not supported on this device."); return; }
    setLocating(true); setGeoErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setDist(distanceKm(lat, lng, OFFICE.lat, OFFICE.lng));
        setLocating(false);
      },
      () => { setGeoErr("Location permission denied. Please allow location access."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // ── Render Leaflet map when coords available ──
  useEffect(() => {
    if (!coords || !mapRef.current) return;

    function init() {
      const L = (window as any).L;
      if (!L) return;
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
      const map = L.map(mapRef.current).setView([coords!.lat, coords!.lng], 12);
      leafletMap.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 18,
      }).addTo(map);
      const me = L.marker([coords!.lat, coords!.lng]).addTo(map).bindPopup("📍 You");
      const off = L.marker([OFFICE.lat, OFFICE.lng]).addTo(map).bindPopup("🏢 " + OFFICE.label);
      L.polyline([[coords!.lat, coords!.lng], [OFFICE.lat, OFFICE.lng]], { color: "#0891b2", weight: 3, dashArray: "6 6" }).addTo(map);
      const group = L.featureGroup([me, off]);
      map.fitBounds(group.getBounds().pad(0.3));
    }

    // Load Leaflet from CDN if not present
    if ((window as any).L) { init(); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.onload = init;
    document.body.appendChild(js);
  }, [coords]);

  async function submit() {
    if (!address || !landmark) { setError("Full address and nearest landmark are required."); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/careers/details", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_id: id, address, locality, landmark,
        latitude: coords?.lat ?? null, longitude: coords?.lng ?? null,
        distance_km: dist != null ? Math.round(dist * 100) / 100 : null,
        dob, gender, marital_status: marital, qualification,
        experience_years: experience, languages, current_company: company,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) setDone(true); else setError(json.error ?? "Failed.");
  }

  const input = "w-full rounded-xl border border-cyan-200/50 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 dark:border-white/10 dark:bg-white/5 dark:text-white";

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_35%)]" />
      <PageDoodles variant="careers" glow={false} grid />

      <div className="relative z-10 mx-auto max-w-lg px-5 py-14">
        {done ? (
          <div className="rounded-3xl border border-cyan-200/40 bg-white/85 p-8 text-center shadow-xl backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
            <p className="text-5xl">🎉</p>
            <h1 className="mt-3 text-2xl font-black">Details <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Submitted!</span></h1>
            <p className="mt-2 text-sm font-medium text-black/60 dark:text-white/60">
              Thank you! Our team will review your details and contact you shortly to schedule an interview.
            </p>
            {dist != null && <p className="mt-3 text-xs font-bold text-cyan-700 dark:text-cyan-300">📍 Distance from office: {dist.toFixed(1)} km</p>}
          </div>
        ) : (
          <>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">You Passed · Final Step</p>
            <h1 className="mt-2 text-3xl font-black">Complete your <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">details</span></h1>
            <p className="mt-1 text-sm font-medium text-black/55 dark:text-white/55">Share your address and location — this helps us schedule your interview.</p>

            <div className="mt-6 space-y-3">
              <textarea className={input} rows={2} placeholder="Full address (house/flat, street, area) *" value={address} onChange={(e) => setAddress(e.target.value)} />
              <input className={input} placeholder="Locality / Area name" value={locality} onChange={(e) => setLocality(e.target.value)} />
              <input className={input} placeholder="Nearest famous landmark (e.g. XYZ Mall, ABC Temple) *" value={landmark} onChange={(e) => setLandmark(e.target.value)} />

              {/* Personal details */}
              <p className="pt-2 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-600">Personal Details</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Date of Birth</label>
                  <input className={`${input} mt-1`} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Gender</label>
                  <select className={`${input} mt-1`} value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select className={input} value={marital} onChange={(e) => setMarital(e.target.value)}>
                  <option value="">Marital status</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                </select>
                <input className={input} placeholder="Qualification (e.g. B.Com)" value={qualification} onChange={(e) => setQualification(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={input} type="number" step="0.5" placeholder="Experience (years)" value={experience} onChange={(e) => setExperience(e.target.value)} />
                <input className={input} placeholder="Languages (Hindi, English…)" value={languages} onChange={(e) => setLanguages(e.target.value)} />
              </div>
              <input className={input} placeholder="Current company (if any)" value={company} onChange={(e) => setCompany(e.target.value)} />

              {/* Location detect */}
              <button type="button" onClick={detect} disabled={locating}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/60 bg-cyan-50/60 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100/60 disabled:opacity-50 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-300">
                <Navigation className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
                {locating ? "Detecting location…" : coords ? "Re-detect my location" : "Detect my location"}
              </button>
              {geoErr && <p className="text-xs font-bold text-rose-600">{geoErr}</p>}

              {/* Distance + map */}
              {coords && (
                <div className="rounded-2xl border border-cyan-200/40 bg-white/85 p-4 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-black text-black/70 dark:text-white/70"><Building2 className="h-4 w-4 text-cyan-600" />{OFFICE.label}</span>
                    {dist != null && (
                      <span className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1 text-xs font-black text-white shadow">
                        {dist.toFixed(1)} km away
                      </span>
                    )}
                  </div>
                  <div ref={mapRef} className="h-56 w-full overflow-hidden rounded-xl" style={{ background: "#e5f3f6" }} />
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-black/45 dark:text-white/45">
                    <MapPin className="h-3 w-3" />Distance between your location and our office.
                  </p>
                </div>
              )}

              {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

              <button type="button" onClick={submit} disabled={saving}
                className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-500/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                <span className="inline-flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4" />{saving ? "Submitting…" : "Submit Details"}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
