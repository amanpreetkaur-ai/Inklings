
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createWriterClient } from "@/lib/supabase/writer-client";

type Story = {
  id: string;
  title: string;
  slug: string;
  genre: string;
  description: string;
  content: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export default function MyStoriesPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStories() {
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
            "id, title, slug, genre, description, content, status, created_at, updated_at, published_at"
          )
          .eq("author_id", user.id)
          .order("updated_at", { ascending: false });

        if (fetchError) throw fetchError;

        if (!cancelled) {
          setStories((data ?? []) as Story[]);
        }
      } catch (err) {
        console.error("MY STORIES LOAD ERROR:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't load your stories."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStories();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function deleteStory(story: Story) {
    const confirmed = window.confirm(
      `Delete "${story.title}" permanently?`
    );

    if (!confirmed) return;

    setError("");

    const supabase = createWriterClient();

    const { data: userData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !userData.user) {
      router.replace("/writer/login");
      return;
    }

    const { data, error: deleteError } = await supabase
      .from("stories")
      .delete()
      .eq("id", story.id)
      .eq("author_id", userData.user.id)
      .select("id");

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (!data || data.length === 0) {
      setError("The story wasn't deleted. Please try again.");
      return;
    }

    if (story.status === "published") {
      try {
        await fetch("/api/writer/sync-story", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ storyId: story.id }),
        });
      } catch (syncErr) {
        console.warn("Could not remove from reader library:", syncErr);
      }
    }

    setStories((current) =>
      current.filter((item) => item.id !== story.id)
    );
  }

  return (
    <main className="writer-dashboard">
      <header className="writer-header">
        <Link href="/writer/dashboard" className="auth-brand">
          Inklings
        </Link>
        <Link href="/writer/dashboard">Writer&apos;s Studio</Link>
      </header>

      <section className="writer-welcome">
        <p className="dashboard-eyebrow">YOUR CREATIVE SPACE</p>
        <h1>My Stories 📚</h1>
        <p>All your drafts and published stories, in one place.</p>
        <Link href="/writer/stories/new" className="auth-submit">
          + Write a Story
        </Link>
      </section>

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <section className="writer-cards">
        {loading && <p>Loading your stories...</p>}

        {!loading && !error && stories.length === 0 && (
          <article className="dashboard-card">
            <h2>Your story journey starts here.</h2>
            <p>You haven&apos;t written any stories yet.</p>
            <Link href="/writer/stories/new">
              Write your first story
            </Link>
          </article>
        )}

        {!loading &&
          stories.map((story) => (
            <article className="dashboard-card" key={story.id}>
              <p className="dashboard-eyebrow">
                {story.genre} · {story.status.toUpperCase()}
              </p>

              <h2>{story.title}</h2>

              <p>
                {story.description ||
                  story.content.slice(0, 150) ||
                  "No description yet."}
              </p>

              <p>
                Updated{" "}
                {new Date(story.updated_at).toLocaleDateString()}
              </p>

              <div className="editor-actions">
                <Link href={`/writer/stories/${story.id}/edit`}>
                  Edit
                </Link>

                {story.status === "published" && (
                  <Link href={`/stories/${story.slug}`}>
                    View story
                  </Link>
                )}

                <button
                  type="button"
                  className="editor-secondary-button"
                  onClick={() => deleteStory(story)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}
