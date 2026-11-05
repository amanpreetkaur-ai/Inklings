
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createWriterClient } from "@/lib/supabase/writer-client";

const genres = [
  "Fantasy",
  "Romance",
  "Mystery",
  "Drama",
  "Thriller",
  "Science Fiction",
  "Horror",
  "Poetry",
  "Adventure",
  "Historical Fiction",
  "Literary Fiction",
  "Other",
];

const languages = [
  "English",
  "Punjabi",
  "Hindi",
  "Urdu",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Other",
];

const workTypes = [
  { value: "story", label: "Story" },
  { value: "short_story", label: "Short Story" },
  { value: "poem", label: "Poem" },
  { value: "serial", label: "Serial / Chapter Series" },
  { value: "essay", label: "Essay" },
  { value: "book", label: "Book" },
  { value: "quote", label: "Quote" },
  { value: "other", label: "Other" },
];

export default function NewStoryPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Fantasy");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [language, setLanguage] = useState("English");
  const [workType, setWorkType] = useState("story");
  const [isFeatured, setIsFeatured] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function createSlug(value: string) {
    const base =
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "untitled";

    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
  }

  async function saveStory(status: "draft" | "published") {
    setError("");
    setMessage("");

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!content.trim()) {
      setError("Please write some content first.");
      return;
    }

    const cleanedCoverUrl = coverImageUrl.trim();

    if (cleanedCoverUrl) {
      try {
        const parsedUrl = new URL(cleanedCoverUrl);

        if (
          parsedUrl.protocol !== "https:" &&
          parsedUrl.protocol !== "http:"
        ) {
          setError("The cover image must use an HTTP or HTTPS URL.");
          return;
        }
      } catch {
        setError("Please enter a valid cover image URL.");
        return;
      }
    }

    setLoading(true);

    try {
      const supabase = createWriterClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        router.replace("/writer/login");
        return;
      }

      const now = new Date().toISOString();

      // Save the story and its library metadata in Writer Supabase.
      const { data: story, error: saveError } = await supabase
        .from("stories")
        .insert({
          author_id: user.id,
          title: title.trim(),
          slug: createSlug(title),
          genre,
          description: description.trim(),
          content: content.trim(),
          cover_image_url: cleanedCoverUrl || null,
          language,
          work_type: workType,
          is_featured: isFeatured,
          status,
          updated_at: now,
          published_at: status === "published" ? now : null,
        })
        .select("id")
        .single();

      if (saveError) throw saveError;

      // Drafts remain in Writer Supabase.
      if (status === "draft") {
        setMessage("Draft saved successfully!");
        router.push("/writer/stories");
        router.refresh();
        return;
      }

      // Publish by syncing the story to Reader Supabase.
      const syncResponse = await fetch("/api/writer/sync-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storyId: story.id }),
      });

      const syncResult = await syncResponse.json();

      if (!syncResponse.ok) {
        setError(
          syncResult.error ||
            "Your story was saved, but syncing to Reader failed. Please try again."
        );
        return;
      }

      setMessage("Story published and synced to Reader successfully!");
      router.push("/writer/stories");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save your work. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="story-editor-page">
      <header className="editor-header">
        <Link href="/writer/dashboard" className="auth-brand">
          Inklings
        </Link>

        <Link href="/writer/stories">My Stories</Link>
      </header>

      <section className="editor-container">
        <p className="dashboard-eyebrow">WRITER'S STUDIO</p>
        <h1>Create a New Work</h1>
        <p className="editor-subtitle">
          A story, a poem, a thought at midnight — give your words a home.
        </p>

        <form
          className="story-editor-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="story-title">Title *</label>
          <input
            id="story-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your work a title"
            maxLength={150}
            required
          />

          <label htmlFor="story-genre">Genre *</label>
          <select
            id="story-genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            {genres.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label htmlFor="work-type">Type of work *</label>
          <select
            id="work-type"
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
          >
            {workTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <label htmlFor="work-language">Language *</label>
          <select
            id="work-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label htmlFor="cover-image">Cover image URL</label>
          <input
            id="cover-image"
            type="url"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://example.com/your-cover.jpg"
          />
          <p className="editor-subtitle">
            Paste a direct image URL. You can leave this empty and add a cover
            later.
          </p>

          {coverImageUrl.trim() && (
            <div style={{ margin: "12px 0 20px" }}>
              <p style={{ fontSize: 13, marginBottom: 8 }}>Cover preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl.trim()}
                alt="Preview of your work's cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                onLoad={(e) => {
                  e.currentTarget.style.display = "block";
                }}
                style={{
                  width: 180,
                  aspectRatio: "2 / 3",
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid #eadce2",
                  background: "#f5eaf0",
                }}
              />
            </div>
          )}

          <label htmlFor="story-description">Short description</label>
          <textarea
            id="story-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Give readers a little glimpse of your work..."
            rows={3}
            maxLength={500}
          />

          <label htmlFor="story-content">Your writing *</label>
          <textarea
            id="story-content"
            className="story-content-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Let your words begin..."
            rows={16}
            required
          />

          <p className="editor-word-count">
            {content.trim() ? content.trim().split(/\s+/).length : 0} words
          </p>

          <label
            htmlFor="featured-work"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "20px 0",
              cursor: "pointer",
            }}
          >
            <input
              id="featured-work"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Feature this work in the library
          </label>

          <p className="editor-subtitle">
            Featured works may be highlighted in discovery sections. Selecting
            this option does not guarantee promotion.
          </p>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p role="status" aria-live="polite">
              {message}
            </p>
          )}

          <div className="editor-actions">
            <button
              type="button"
              className="editor-secondary-button"
              onClick={() => saveStory("draft")}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Draft"}
            </button>

            <button
              type="button"
              className="auth-submit"
              onClick={() => saveStory("published")}
              disabled={loading}
            >
              {loading ? "Please wait..." : "Publish Work"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
