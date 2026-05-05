"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          About AgentForge
        </h1>
        <p className="mt-4 text-lg text-black/60">
          Not just tools. A system built for creators who want to scale without chaos.
        </p>
      </div>

      {/* Section 1 */}
      <section className="mt-14 space-y-6 text-base leading-7 text-black/75">
        <p>
          AgentForge is not just another AI platform. It’s a strategic engine
          designed for creators, brands, and business owners who want premium
          visual output — fast, consistent, and scalable.
        </p>

        <p>
          We saw a gap: businesses struggle to create high-quality visuals
          regularly. Either they depend on expensive shoots or waste time on
          inconsistent content.
        </p>

        <p>
          AgentForge removes that friction.
        </p>
      </section>

      {/* Section 2 */}
      <section className="mt-14">
        <h2 className="text-2xl font-black mb-4">What We Do</h2>
        <div className="space-y-4 text-black/75">
          <p>
            We build AI agents that convert your raw ideas into premium,
            ready-to-use visuals.
          </p>

          <ul className="list-disc pl-5 space-y-2">
            <li>Textile designs → Model-ready fashion mockups</li>
            <li>Jewellery → Studio-grade product visuals</li>
            <li>Products → High-conversion commercial shots</li>
          </ul>

          <p>
            No photographers. No delays. No complexity.
          </p>
        </div>
      </section>

      {/* Section 3 */}
      <section className="mt-14">
        <h2 className="text-2xl font-black mb-4">Our Vision</h2>
        <p className="text-black/75 leading-7">
          We are building a system where businesses don’t chase content —
          content flows automatically.
        </p>

        <p className="mt-4 text-black/75 leading-7">
          AgentForge is just the beginning. The goal is to create a silent
          infrastructure that powers brands behind the scenes.
        </p>
      </section>

      {/* Section 4 */}
      <section className="mt-14">
        <h2 className="text-2xl font-black mb-4">The Mind Behind</h2>

        <div className="space-y-4 text-black/75">
          <p>
            Built by a creator who understands both sides — creativity and
            execution.
          </p>

          <p>
            From branding to marketing to systems, the goal has always been
            clear: build things that don’t just look good, but work at scale.
          </p>

          <p>
            No noise. No unnecessary exposure. Just results.
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="mt-16 text-center">
        <Link
          href="/textileprints-to-mockup"
          className="inline-block rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 text-sm font-black text-white shadow-lg transition hover:scale-105"
        >
          Start Creating →
        </Link>
      </div>
    </main>
  );
}