"use client";

// ============================================================
// SceneEditPanel — "Customize this scene with AI" entry point under
// the uploaded scene in the mockup flow.
//
// NOT LIVE YET. This shows a "Coming Shortly" card only — it makes no
// API calls (so no errors) and never modifies the parent scene, so the
// main mockup generation is completely unaffected.
//
// The full interactive editor (auto-detect décor + swap elements +
// "upload your own product", powered by /api/scene/detect & /edit) lives
// in git history (commit 264d669). Restore it here when going live.
// ============================================================

export default function SceneEditPanel({ sceneUrl }: { sceneUrl: string; onSceneUpdated?: (url: string) => void }) {
  if (!sceneUrl) return null;

  return (
    <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-3 text-center">
      <p className="text-sm font-black text-violet-700">✨ Customize this scene with AI</p>
      <p className="mt-1 text-xs font-bold text-slate-500">
        Change the lamp, curtains, plants &amp; more —{" "}
        <span className="text-violet-600">Coming Shortly</span>
      </p>
    </div>
  );
}
