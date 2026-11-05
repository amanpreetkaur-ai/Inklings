
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  "Other",
];

type Story = {
  id: string;
  title: string;
  slug: string;
  genre: string;
  description: string;
  content: string;
  status: "draft" | "published";
  published_at: string | null;
};

export default function EditStoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [story, setStory] = useState<Story | null>(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Fantasy");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStory() {
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

        const { data, error: fetchError } = await supabase
          .from("stories")
          .select(
            "id, title, slug, genre, description, content, status, published_at"
          )
          .eq("id", params.id)
          .eq("author_id", user.id)
          .single();

        if (fetchError) throw fetchError;

        if (cancelled) return;

        const loadedStory = data as Story;

        setStory(loadedStory);
        setTitle(loadedStory.title);
        setGenre(loadedStory.genre);
        setDescription(loadedStory.description || "");
        setContent(loadedStory.content || "");
        setStatus(loadedStory.status);
      } catch (err) {
        console.error("EDIT STORY LOAD ERROR:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't load your story."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStory();

    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  async function saveStory(nextStatus: "draft" | "published") {
    setError("");
    setSuccess("");

    if (!story) return;

    if (!title.trim()) {
      setError("Please enter a story title.");
      return;
    }

    if (!content.trim()) {
      setError("Please write some story content first.");
      return;
    }

    setSaving(true);

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

      const updates = {
        title: title.trim(),
        genre,
        description: description.trim(),
        content: content.trim(),
        status: nextStatus,
        updated_at: now,
        published_at:
          nextStatus === "published"
            ? story.published_at || now
            : null,
      };

      const { data, error: updateError } = await supabase
        .from("stories")
        .update(updates)
        .eq("id", story.id)
        .eq("author_id", user.id)
        .select("id");

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error(
          "No story was updated. Check that you own this story."
        );
      }

      setStatus(nextStatus);
      setStory({ ...story, ...updates });

      setSuccess(
        nextStatus === "draft"
          ? "Your draft has been saved!"
          : "Your story has been published!"
      );
    } catch (err) {
      console.error("EDIT STORY SAVE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save your story."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="writer-dashboard">
        <p>Loading your story...</p>
      </main>
    );
  }

  if (!story) {
    return (
      <main className="writer-dashboard">
        <h1>Couldn't open this story</h1>
        <p className="auth-error">
          {error || "Story not found."}
        </p>
        <Link href="/writer/stories">Back to My Stories</Link>
      </main>
    );
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
        <h1>Edit Your Story</h1>
        <p className="editor-subtitle">
          Keep writing, revising, and bringing your ideas to life.
        </p>

        <form
          className="story-editor-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor="story-title">Story title *</label>
          <input
            id="story-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={150}
            required
          />

          <label htmlFor="story-genre">Genre *</label>
          <select
            id="story-genre"
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
          >
            {genres.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label htmlFor="story-description">
            Short description
          </label>
          <textarea
            id="story-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={500}
          />

          <label htmlFor="story-content">Your story *</label>
          <textarea
            id="story-content"
            className="story-content-input"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={16}
            required
          />

          <p className="editor-word-count">
            {content.trim()
              ? content.trim().split(/\s+/).length
              : 0}{" "}
            words
          </p>

          <p>
            Status: <strong>{status}</strong>
          </p>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p role="status" aria-live="polite">
              {success}
            </p>
          )}

          <div className="editor-actions">
            <button
              type="button"
              className="editor-secondary-button"
              onClick={() => saveStory("draft")}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>

            <button
              type="button"
              className="auth-submit"
              onClick={() => saveStory("published")}
              disabled={saving}
            >
              {saving ? "Saving..." : "Publish Story"}
            </button>

            <button
              type="button"
              className="editor-secondary-button"
              onClick={() => router.push("/writer/stories")}
              disabled={saving}
            >
              Back to My Stories
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
