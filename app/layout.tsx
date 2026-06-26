import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./components/AuthProvider";
import Script from "next/script";
import LayoutClient from "./components/LayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aiagentforge.in"),
  title: {
    default: "India's First AI Mockup, Photoshoot & Productography Workflow | AgentForge AI",
    template: "%s | AgentForge AI",
  },

  description:
    "AgentForge AI — India's first professional AI workflow for textile mockup, jewellery photoshoot and product photography. Turn any fabric photo or product image into catalogue-ready visuals in 60 seconds. Trusted by 5,000+ Indian brands.",

  keywords: [
    // Primary positioning
    "India first AI mockup workflow",
    "professional AI photoshoot workflow India",
    "AI catalogue workflow India",
    // Textile / fashion
    "AI textile mockup generator India",
    "textile prints to mockup AI",
    "AI saree mockup",
    "AI kurti catalogue maker",
    "AI kurta mockup",
    "AI fashion mockup generator",
    "textile design to mockup AI",
    "fabric mockup AI India",
    // Jewellery
    "AI jewellery photoshoot",
    "AI jewellery model photoshoot",
    "AI bridal jewellery catalogue",
    "AI necklace photoshoot",
    "AI diamond ring catalogue",
    // Product photography
    "AI product photography India",
    "AI productography India",
    "AI product photoshoot generator",
    "Amazon product photo AI",
    "Flipkart catalogue image AI",
    "AI ecommerce product shoot",
    // Social & UGC
    "AI social media ad maker India",
    "AI UGC generator India",
    "AI brand shoot India",
    // Generic
    "AI catalogue generator",
    "AI catalog maker India",
    "virtual photoshoot AI",
    "AI model generator India",
    "AgentForge AI",
  ],

  icons: {
    icon: "/logo-new.jpg",
    },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://www.aiagentforge.in",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // ============================================================
  // Search engine ownership verification
  // ============================================================
  // Google Search Console is already verified via the existing
  // Google Tag (AW-18170895451) loaded in <body> below — so no
  // <meta name="google-site-verification"> tag is needed here.
  // (GSC → Settings → Ownership verification → "Google tag" method)
  //
  // Facebook domain verification: rendered as a raw <meta> tag in <head>
  // because the metadata API doesn't have a typed slot for that name.
  verification: {
    other: {
      "p:domain_verify": "71b4ae903a22aedcf510fdf811f2df07", // Pinterest
    },
  },

  openGraph: {
    title: "India's First AI Mockup, Photoshoot & Productography Workflow | AgentForge AI",
    description:
      "India's first professional AI workflow — textile mockup, jewellery photoshoot and product photography. Catalogue-ready visuals in 60 seconds. 5,000+ Indian brands trust AgentForge.",
    url: "https://www.aiagentforge.in",
    siteName: "AgentForge AI",
    images: [
      {
        url: "/banner1.png",
        width: 1200,
        height: 630,
        alt: "AgentForge AI — AI Textile Mockup Generator & Jewellery AI Studio",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "India's First AI Mockup, Photoshoot & Productography Workflow | AgentForge AI",
    description:
      "Upload a photo. Get catalogue-ready AI visuals in 60 seconds. India's first professional AI workflow for mockup, photoshoot & productography.",
    images: ["/banner1.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        
      <link rel="manifest" href="/manifest.json"></link>
        {/* Facebook ownership — kept here because the metadata API
            doesn't have a typed slot for this specific FB verification */}
        <meta
          name="facebook-domain-verification"
          content="rulnxopysk6g6u6lp9ct0dp2pp8iom"
        />

        {/* JSON-LD: Organization schema for Google Knowledge Graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "AgentForge AI",
              alternateName: "AgentForge",
              url: "https://www.aiagentforge.in",
              logo: "https://www.aiagentforge.in/logo-new.jpg",
              description:
                "India's first professional AI workflow for textile mockup, jewellery photoshoot and product photography. Generate catalogue-ready visuals in 60 seconds.",
              email: "info@aiagentforge.in",
              address: {
                "@type": "PostalAddress",
                addressCountry: "IN",
              },
              sameAs: [
                "https://www.instagram.com/agentforgeindia/",
                "https://www.youtube.com/@agentforgeindia",
                "https://www.linkedin.com/in/agentforgeindia/",
                "https://www.facebook.com/Agentforgeindia",
                "https://x.com/Agentforgeindia",
                "https://in.pinterest.com/agentforgeindia/",
              ],
            }),
          }}
        />

        {/* JSON-LD: WebSite + Sitelinks Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "AgentForge AI",
              url: "https://www.aiagentforge.in",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://www.aiagentforge.in/gallery?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/* JSON-LD: SoftwareApplication (SaaS) — tells Google this is a software product */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "AgentForge AI",
              applicationCategory: "BusinessApplication",
              applicationSubCategory: "AI Visual Generation Platform",
              operatingSystem: "Web, iOS, Android",
              url: "https://www.aiagentforge.in",
              description:
                "India's first professional AI workflow for textile mockup, jewellery photoshoot and product photography. Purpose-built for Indian manufacturers, wholesalers and D2C brands — 60 seconds per catalogue visual.",
              image: "https://www.aiagentforge.in/logo-new.jpg",
              softwareVersion: "2026.1",
              inLanguage: ["en", "en-IN"],
              featureList: [
                "TextilePrints to Mockup — flat fabric photo to model-worn AI mockup in 60s (saree, kurti, kurta, lehenga, kidswear, home textile)",
                "Jewellery AI Studio — bridal, diamond, kundan, pearls and daily-wear photoshoots without a studio",
                "Productography AI — Amazon-ready hero shots and D2C lifestyle images from a mobile photo",
                "Social Ads Designer — AI ad creatives for 17 categories, 7 platforms and 12 Indian languages",
                "UGC Forge — same-face brand shoot: your face, your product, editorial-quality brand content",
                "TrendForge — pick a trend, upload a photo, generate viral ready-to-post visuals",
                "Scene Editor — AI room staging and home textile visualiser for bedsheets, curtains and quilts",
                "Article code + brand overlay on every output",
                "Bulk catalogue generation — Empire plan covers ~2,400 images/month for factories",
                "HD 1080 output for Amazon, Flipkart, Meesho, Instagram and WhatsApp catalogues",
              ],
              offers: [
                {
                  "@type": "Offer",
                  name: "Starter",
                  price: "1999",
                  priceCurrency: "INR",
                  description: "1,800 credits · ~120 standard generations · Best to Start",
                  url: "https://www.aiagentforge.in/pricing",
                },
                {
                  "@type": "Offer",
                  name: "Pro Creator",
                  price: "9999",
                  priceCurrency: "INR",
                  description: "9,000 credits · ~600 standard generations · Most Popular",
                  url: "https://www.aiagentforge.in/pricing",
                },
                {
                  "@type": "Offer",
                  name: "Empire",
                  price: "39999",
                  priceCurrency: "INR",
                  description: "36,000 credits · ~2,400 generations · Bulk Studio for factories",
                  url: "https://www.aiagentforge.in/pricing",
                },
              ],
              // NOTE: aggregateRating was removed because the previous
              // hardcoded values (4.9 / 412 reviews) weren't backed by
              // a public review source. Google can penalise sites that
              // emit unverifiable AggregateRating in rich-result schema
              // (see https://developers.google.com/search/docs/appearance/structured-data/review-snippet).
              //
              // Re-add this block only when reviews are publicly viewable
              // on the site AND the count is queried from real data, e.g:
              //   aggregateRating: {
              //     "@type": "AggregateRating",
              //     ratingValue: <real_avg_rounded_1dp>,
              //     ratingCount: <real_published_count>,
              //     bestRating: "5",
              //     worstRating: "1",
              //   },
              publisher: {
                "@type": "Organization",
                name: "AgentForge AI",
                url: "https://www.aiagentforge.in",
              },
            }),
          }}
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} relative min-h-full overflow-x-hidden flex flex-col`}>
        {/* ============================================================
            ANALYTICS & ADS TRACKING (site-wide)
            ============================================================
            • Google Ads (gtag)            → AW-18170895451       (always on)
            • Google Analytics 4 (gtag)    → NEXT_PUBLIC_GA4_ID   (env-gated)
            • Microsoft Clarity            → NEXT_PUBLIC_CLARITY_ID (env-gated)
            • Meta (Facebook) Pixel        → 1136318385188354     (always on)
            • Meta domain verification     → in <head> above
            • Pinterest verification       → in metadata.verification above
            • Google Search Console        → auto-verified via the Google Tag
            • Custom funnel events         → lib/analytics.ts → track()
            • Auto page_view on route change → AnalyticsRouteTracker
              inside LayoutClient
            ============================================================
            To activate GA4 + Clarity, add these to .env.local:
              NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
              NEXT_PUBLIC_CLARITY_ID=xxxxxxxxxx
            (No env vars → scripts skip silently. Safe in dev.)
            ============================================================ */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18170895451"
          strategy="afterInteractive"
        />

        <Script id="google-tags-bootstrap" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            window.gtag = function(){ window.dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', 'AW-18170895451');
            ${
              process.env.NEXT_PUBLIC_GA4_ID
                ? `window.gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}', { send_page_view: false });`
                : ""
            }
          `}
        </Script>

        {/* Microsoft Clarity — free heatmaps + session recording.
            lazyOnload: Clarity is pure observability — it should never
            compete with the user's first interaction. Loading after
            the page is idle protects INP (Interaction to Next Paint). */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="microsoft-clarity" strategy="lazyOnload">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}

        {/* Meta (Facebook) Pixel — base code. Fires automatic PageView on
            every route (via AnalyticsRouteTracker). Conversion events such
            as "Lead" / "Purchase" are fired from page code (e.g. the
            workshop thank-you page). Set NEXT_PUBLIC_META_PIXEL_ID in
            .env.local to override the default pixel ID. */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || "1136318385188354"}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID || "1136318385188354"}&ev=PageView&noscript=1`}
          />
        </noscript>

        <div className="fixed inset-0 -z-50 bg-[#fff8e8] dark:bg-[#070b14]" />

        <div className="fixed inset-0 -z-30 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%),radial-gradient(circle_at_bottom,#0ea5e944,transparent_30%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />

        <ThemeProvider>
  <AuthProvider>
    <LayoutClient>{children}</LayoutClient>
  </AuthProvider>
</ThemeProvider>

        {/* Meta (Facebook) Pixel — lazyOnload for the same reason.
            PageView still fires after the page is idle, which is
            fine for attribution. Custom events from track() queue
            via dataLayer / window.fbq and replay once loaded. */}
        <Script id="facebook-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            fbq('init', '1136318385188354');
            fbq('track', 'PageView');
          `}
        </Script>
      </body>
    </html>
  );
}