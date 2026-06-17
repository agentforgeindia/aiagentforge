"use client";

// Shows the first `initial` tutorial cards, with a "Show more" button
// that reveals the rest. The cards are server-rendered and passed in as
// children, so this only handles the slice + toggle.

import { Children, useState, type ReactNode } from "react";

export default function ExpandableGrid({
  children,
  initial = 9,
}: {
  children: ReactNode;
  initial?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const items = Children.toArray(children);
  const visible = showAll ? items : items.slice(0, initial);
  const remaining = items.length - initial;

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visible}</div>
      {remaining > 0 && !showAll && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 px-6 py-3 text-sm font-black text-cyan-700 shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20 dark:text-cyan-300"
          >
            Show more
            <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs">
              +{remaining}
            </span>
          </button>
        </div>
      )}
    </>
  );
}
