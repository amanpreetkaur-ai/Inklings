
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { stories } from "@/data/stories";

type Bookmark = {
  id: string;
  story_slug: string;
  created_at: string;
};

export default function MyLibraryPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLibrary() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error: bookmarkError } = await supabase
          .from("bookmarks")
          .select("id, story_slug, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (bookmarkError) throw bookmarkError;

        setBookmarks(data ?? []);
      } catch {
        setError(
          "We couldn't load your library. Please refresh and try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadLibrary();
  }, [router]);

  const savedStories = bookmarks
    .map((bookmark) => ({
      bookmark,
      story: stories.find(
        (story) => story.slug === bookmark.story_slug
      ),
    }))
    .filter(
      (
        item
      ): item is {
        bookmark: Bookmark;
        story: (typeof stories)[number];
      } => Boolean(item.story)
    );

  if (loading) {
    return <main className="library-page">Loading your library...</main>;
  }

  return (
    <main className="library-page">
      <header className="library-header">
        <p>YOUR PERSONAL COLLECTION</p>
        <h1>My Library</h1>
        <p>All the stories you&apos;ve saved, together in one place.</p>
      </header>

      {error && <p role="alert">{error}</p>}

      {!error && savedStories.length === 0 && (
        <section className="library-empty">
          <h2>Your library is waiting for a story.</h2>
          <p>
            Explore Inklings, find a story you love, and bookmark it
            to keep it here.
          </p>
          <Link href="/stories">Explore Stories</Link>
        </section>
      )}

      {savedStories.length > 0 && (
        <section className="library-grid">
          {savedStories.map(({ bookmark, story }) => (
            <article className="library-card" key={bookmark.id}>
              <p className="library-genre">{story.genre}</p>
              <h2>{story.title}</h2>
              <p className="library-author">By {story.author}</p>
              <p>{story.description}</p>

              <Link href={`/stories/${story.slug}`}>
                Read Story →
              </Link>
            </article>
          ))}
        </section>
      )}

      <p className="library-back">
        <Link href="/stories">← Explore more stories</Link>
      </p>
    </main>
  );
}
