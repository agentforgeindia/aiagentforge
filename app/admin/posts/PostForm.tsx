"use client";

// ============================================================
// Shared post editor — used by /admin/posts/new and
// /admin/posts/[id]/edit. Handles header fields, hero image
// upload, repeatable body sections (h2/h3/p/ul/quote/image)
// and Save-draft / Publish actions.
// ============================================================

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ALL_CATEGORIES,
  ALL_TYPES,
  POST_CATEGORY_LABEL,
  POST_TYPE_LABEL,
  slugify,
  upsertPost,
  uploadPostImage,
  type DbPost,
  type PostCategory,
  type PostSection,
  type PostStatus,
  type PostType,
  type UpsertPostInput,
} from "@/lib/posts";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Save,
  Send,
  Trash2,
  Type as TypeIcon,
  Quote as QuoteIcon,
  ListOrdered,
  Heading2,
  Heading3,
  Image as ImageIcon,
  X as XIcon,
} from "lucide-react";

type FormState = {
  id?: string;
  slug: string;
  type: PostType;
  category: PostCategory;
  title: string;
  description: string;
  excerpt: string;
  author: string;
  hero_image_url: string | null;
  hero_emoji: string;
  read_minutes: number;
  cta_label: string;
  cta_href: string;
  keywordsCsv: string;
  body: PostSection[];
  status: PostStatus;
  published_at: string | null;
};

const SECTION_KINDS: { key: PostSection["type"]; label: string; Icon: typeof TypeIcon }[] = [
  { key: "h2", label: "Heading", Icon: Heading2 },
  { key: "h3", label: "Subheading", Icon: Heading3 },
  { key: "p", label: "Paragraph", Icon: TypeIcon },
  { key: "ul", label: "Bullets", Icon: ListOrdered },
  { key: "quote", label: "Quote", Icon: QuoteIcon },
  { key: "image", label: "Image", Icon: ImageIcon },
];

function makeSection(kind: PostSection["type"]): PostSection {
  switch (kind) {
    case "h2":
    case "h3":
      return { type: kind, text: "" };
    case "p":
    case "quote":
      return { type: kind, text: "" };
    case "ul":
      return { type: "ul", items: [""] };
    case "image":
      return { type: "image", src: "", alt: "", caption: "" };
  }
}

function dbToForm(p: DbPost): FormState {
  return {
    id: p.id,
    slug: p.slug,
    type: p.type,
    category: p.category,
    title: p.title,
    description: p.description ?? "",
    excerpt: p.excerpt ?? "",
    author: p.author,
    hero_image_url: p.hero_image_url,
    hero_emoji: p.hero_emoji ?? "📝",
    read_minutes: p.read_minutes,
    cta_label: p.cta_label ?? "",
    cta_href: p.cta_href ?? "",
    keywordsCsv: (p.keywords ?? []).join(", "),
    body: Array.isArray(p.body) ? p.body : [],
    status: p.status,
    published_at: p.published_at,
  };
}

function emptyForm(): FormState {
  return {
    slug: "",
    type: "blog",
    category: "guide",
    title: "",
    description: "",
    excerpt: "",
    author: "AgentForge Team",
    hero_image_url: null,
    hero_emoji: "📝",
    read_minutes: 5,
    cta_label: "",
    cta_href: "",
    keywordsCsv: "",
    body: [],
    status: "draft",
    published_at: null,
  };
}

export default function PostForm({ initial }: { initial?: DbPost }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initial ? dbToForm(initial) : emptyForm(),
  );
  const [slugLocked, setSlugLocked] = useState(Boolean(initial));
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initial);
  const formId = useMemo(() => initial?.id, [initial]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTitleChange(v: string) {
    setForm((f) => ({
      ...f,
      title: v,
      // Auto-fill slug from title only while user hasn't locked it
      // (lock happens on first manual slug edit OR when editing an existing post).
      slug: slugLocked ? f.slug : slugify(v),
    }));
  }

  // ───────── Hero image ─────────
  async function onHeroPick(file: File | null) {
    if (!file) return;
    setHeroUploading(true);
    setError(null);
    const { url, error: upErr } = await uploadPostImage(file);
    setHeroUploading(false);
    if (upErr || !url) {
      setError(upErr ?? "Upload failed.");
      return;
    }
    patch("hero_image_url", url);
  }

  // ───────── Body sections ─────────
  function addSection(kind: PostSection["type"]) {
    setForm((f) => ({ ...f, body: [...f.body, makeSection(kind)] }));
  }
  function removeSection(i: number) {
    setForm((f) => ({ ...f, body: f.body.filter((_, idx) => idx !== i) }));
  }
  function moveSection(i: number, dir: -1 | 1) {
    setForm((f) => {
      const next = [...f.body];
      const target = i + dir;
      if (target < 0 || target >= next.length) return f;
      [next[i], next[target]] = [next[target], next[i]];
      return { ...f, body: next };
    });
  }
  function updateSection<K extends PostSection>(i: number, patch: Partial<K>) {
    setForm((f) => ({
      ...f,
      body: f.body.map((s, idx) => (idx === i ? ({ ...s, ...patch } as PostSection) : s)),
    }));
  }

  async function onBodyImageUpload(i: number, file: File) {
    setError(null);
    const { url, error: upErr } = await uploadPostImage(file);
    if (upErr || !url) {
      setError(upErr ?? "Upload failed.");
      return;
    }
    updateSection(i, { src: url });
  }

  // ───────── Save ─────────
  function validate(): string | null {
    if (!form.title.trim()) return "Title is required.";
    if (!form.slug.trim()) return "Slug is required.";
    if (!/^[a-z0-9-]+$/.test(form.slug))
      return "Slug must be lowercase letters, numbers and hyphens only.";
    if (!form.author.trim()) return "Author is required.";
    if (form.read_minutes < 1) return "Read minutes must be at least 1.";
    if (form.body.length === 0) return "Add at least one body section.";
    return null;
  }

  async function save(targetStatus: PostStatus) {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSaving(targetStatus === "published" ? "publish" : "draft");

    const keywords = form.keywordsCsv
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload: UpsertPostInput = {
      id: formId,
      slug: form.slug.trim(),
      type: form.type,
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim() || null,
      excerpt: form.excerpt.trim() || null,
      author: form.author.trim(),
      hero_image_url: form.hero_image_url,
      hero_emoji: form.hero_emoji.trim() || "📝",
      read_minutes: form.read_minutes,
      cta_label: form.cta_label.trim() || null,
      cta_href: form.cta_href.trim() || null,
      keywords,
      body: form.body,
      status: targetStatus,
      published_at: form.published_at,
    };

    const { data, error: upErr } = await upsertPost(payload);
    setSaving(null);
    if (upErr || !data) {
      setError(upErr ?? "Save failed.");
      return;
    }

    if (targetStatus === "published") {
      router.push(`/blog/${data.slug}`);
    } else {
      router.push("/admin/posts");
      router.refresh();
    }
  }

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save("published");
      }}
      className="space-y-6"
    >
      {/* Header card */}
      <section className="rounded-2xl border border-black/10 bg-white/85 p-5 dark:border-white/10 dark:bg-white/[0.06] sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
          Header
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Title" required full>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. AI Catalogue Generator for Surat Saree Wholesalers"
              className={inputCls}
            />
          </Field>

          <Field label="Slug" required hint="lowercase letters, numbers, hyphens">
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugLocked(true);
                patch("slug", slugify(e.target.value));
              }}
              placeholder="ai-catalogue-surat-saree"
              className={inputCls}
            />
          </Field>

          <Field label="Author" required>
            <input
              type="text"
              value={form.author}
              onChange={(e) => patch("author", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Type" required>
            <select
              value={form.type}
              onChange={(e) => patch("type", e.target.value as PostType)}
              className={inputCls}
            >
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {POST_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Category" required>
            <select
              value={form.category}
              onChange={(e) => patch("category", e.target.value as PostCategory)}
              className={inputCls}
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {POST_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Read minutes">
            <input
              type="number"
              min={1}
              max={60}
              value={form.read_minutes}
              onChange={(e) =>
                patch("read_minutes", Math.max(1, Number(e.target.value) || 1))
              }
              className={inputCls}
            />
          </Field>

          <Field label="Hero emoji" hint="shown when no hero image is uploaded">
            <input
              type="text"
              value={form.hero_emoji}
              onChange={(e) => patch("hero_emoji", e.target.value)}
              maxLength={4}
              className={inputCls}
            />
          </Field>

          <Field label="Description (SEO)" full hint="shown in Google search results">
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => patch("description", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Excerpt (card preview)" full hint="shown on /news cards">
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => patch("excerpt", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Keywords" full hint="comma-separated · used for SEO + hashtag chips">
            <input
              type="text"
              value={form.keywordsCsv}
              onChange={(e) => patch("keywordsCsv", e.target.value)}
              placeholder="AI catalogue India, Meesho seller AI, saree photography AI"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Hero image */}
      <section className="rounded-2xl border border-black/10 bg-white/85 p-5 dark:border-white/10 dark:bg-white/[0.06] sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
          Hero image
        </h2>
        <p className="mt-1 text-xs text-black/55 dark:text-white/55">
          Max 5 MB · JPG, PNG, WebP, AVIF. If empty, the hero emoji is used.
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-dashed border-black/15 bg-white/60 dark:border-white/10 dark:bg-white/[0.04] sm:w-72">
            {form.hero_image_url ? (
              <Image
                src={form.hero_image_url}
                alt="Hero preview"
                fill
                sizes="288px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl">
                {form.hero_emoji}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-sm font-black text-white shadow-md transition hover:scale-105 ${
                heroUploading ? "pointer-events-none opacity-70" : ""
              }`}
            >
              {heroUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {form.hero_image_url ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => onHeroPick(e.target.files?.[0] ?? null)}
              />
            </label>
            {form.hero_image_url && (
              <button
                type="button"
                onClick={() => patch("hero_image_url", null)}
                className="self-start text-xs font-bold text-rose-500 hover:underline"
              >
                Remove image
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Body sections */}
      <section className="rounded-2xl border border-black/10 bg-white/85 p-5 dark:border-white/10 dark:bg-white/[0.06] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
              Body
            </h2>
            <p className="mt-1 text-xs text-black/55 dark:text-white/55">
              Sections render in order. Drag-free reorder via the arrows.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SECTION_KINDS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => addSection(s.key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs font-bold transition hover:border-cyan-400 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.06]"
              >
                <s.Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {form.body.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-black/55 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
            No sections yet. Use the buttons above to add headings, paragraphs, bullets, quotes or images.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {form.body.map((section, i) => (
              <li
                key={i}
                className="rounded-xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                    {SECTION_KINDS.find((k) => k.key === section.type)?.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <IconBtn
                      title="Move up"
                      disabled={i === 0}
                      onClick={() => moveSection(i, -1)}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      title="Move down"
                      disabled={i === form.body.length - 1}
                      onClick={() => moveSection(i, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn title="Delete" danger onClick={() => removeSection(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>

                {/* Per-type editor */}
                {(section.type === "h2" || section.type === "h3" || section.type === "p" || section.type === "quote") && (
                  <textarea
                    rows={section.type === "p" || section.type === "quote" ? 4 : 2}
                    value={section.text}
                    onChange={(e) =>
                      updateSection(i, { text: e.target.value } as Partial<typeof section>)
                    }
                    placeholder={
                      section.type === "h2"
                        ? "Main heading"
                        : section.type === "h3"
                          ? "Subheading"
                          : section.type === "quote"
                            ? "Memorable quote from a customer or insight…"
                            : "Paragraph text…"
                    }
                    className={inputCls}
                  />
                )}

                {section.type === "ul" && (
                  <BulletEditor
                    items={section.items}
                    onChange={(items) => updateSection(i, { items } as Partial<typeof section>)}
                  />
                )}

                {section.type === "image" && (
                  <ImageEditor
                    section={section}
                    onSrcChange={(file) => onBodyImageUpload(i, file)}
                    onPatch={(patchObj) =>
                      updateSection(i, patchObj as Partial<typeof section>)
                    }
                  />
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-black/10 bg-white/85 p-5 dark:border-white/10 dark:bg-white/[0.06] sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
          End-of-post CTA <span className="text-black/40 dark:text-white/40">(optional)</span>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="CTA label">
            <input
              type="text"
              value={form.cta_label}
              onChange={(e) => patch("cta_label", e.target.value)}
              placeholder="Generate your first mockup"
              className={inputCls}
            />
          </Field>
          <Field label="CTA href">
            <input
              type="text"
              value={form.cta_href}
              onChange={(e) => patch("cta_href", e.target.value)}
              placeholder="/textileprints-to-mockup"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Status + actions */}
      <section className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/90 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <p className="font-black">
            {isEdit ? "Editing existing post" : "Creating new post"}
          </p>
          {form.published_at && (
            <p className="text-xs text-black/55 dark:text-white/55">
              Originally published {new Date(form.published_at).toLocaleString("en-IN")}
            </p>
          )}
          {error && (
            <p className="mt-2 rounded-md bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-bold dark:border-white/10"
          >
            <XIcon className="h-4 w-4" /> Cancel
          </Link>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => save("draft")}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-700 transition hover:bg-cyan-400/20 disabled:opacity-60 dark:text-cyan-200"
          >
            {saving === "draft" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save draft
          </button>
          <button
            type="submit"
            disabled={saving !== null}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-cyan-500/30 disabled:opacity-60"
          >
            {saving === "publish" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {form.status === "published" ? "Update & publish" : "Publish"}
          </button>
        </div>
      </section>
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Small primitives
// ────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-white";

function Field({
  label,
  hint,
  required,
  full,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 flex items-center gap-1 text-xs font-bold text-black/65 dark:text-white/65">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && (
          <span className="font-normal text-black/40 dark:text-white/40"> · {hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition disabled:opacity-30 ${
        danger
          ? "border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
          : "border-black/10 bg-white/80 text-black/65 hover:border-cyan-400 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/65"
      }`}
    >
      {children}
    </button>
  );
}

function BulletEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((it, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-black/40 dark:text-white/40">•</span>
          <input
            type="text"
            value={it}
            onChange={(e) => {
              const next = [...items];
              next[idx] = e.target.value;
              onChange(next);
            }}
            placeholder="Bullet item"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            disabled={items.length <= 1}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 disabled:opacity-30"
            title="Remove bullet"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-700 dark:text-cyan-200"
      >
        + Add bullet
      </button>
    </div>
  );
}

function ImageEditor({
  section,
  onSrcChange,
  onPatch,
}: {
  section: Extract<PostSection, { type: "image" }>;
  onSrcChange: (file: File) => Promise<void> | void;
  onPatch: (patch: Partial<Extract<PostSection, { type: "image" }>>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  return (
    <div className="space-y-3">
      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-dashed border-black/15 bg-white/60 dark:border-white/10 dark:bg-white/[0.04]">
        {section.src ? (
          <Image
            src={section.src}
            alt={section.alt ?? ""}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-black/40 dark:text-white/40">
            No image yet
          </div>
        )}
      </div>

      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1.5 text-xs font-black text-white shadow-md ${
          uploading ? "pointer-events-none opacity-70" : ""
        }`}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImagePlus className="h-3.5 w-3.5" />
        )}
        {section.src ? "Replace" : "Upload"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            await onSrcChange(file);
            setUploading(false);
          }}
        />
      </label>

      <input
        type="text"
        value={section.alt ?? ""}
        onChange={(e) => onPatch({ alt: e.target.value })}
        placeholder="Alt text (for screen readers + SEO)"
        className={inputCls}
      />
      <input
        type="text"
        value={section.caption ?? ""}
        onChange={(e) => onPatch({ caption: e.target.value })}
        placeholder="Caption (optional, shown under the image)"
        className={inputCls}
      />
    </div>
  );
}
