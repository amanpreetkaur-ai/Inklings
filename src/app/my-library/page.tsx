"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { stories } from "@/data/stories";
import "./page.css";

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
  const [search, setSearch] = useState("");

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

  const filteredStories = savedStories.filter(({ story }) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      story.title.toLowerCase().includes(query) ||
      story.author.toLowerCase().includes(query) ||
      story.genre.toLowerCase().includes(query) ||
      story.description.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <main className="library-page">
        <p className="library-loading">Loading your library...</p>
      </main>
    );
  }

  return (
    <main className="library-page">
      {/* Sticky Frosted Topbar */}
      <header className="topbar">
        <Link href="/" className="brand">
          Inklings!
        </Link>

        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search saved stories..."
            aria-label="Search saved stories"
          />
        </label>

        <div className="account-links">
          <Link href="/dashboard" className="nav-link nav-primary">
            Account
          </Link>
        </div>
      </header>

      {/* Full-width Horizontal Header Banner */}
      <section className="library-welcome-banner">
        <div className="library-banner-content">
          <p className="library-eyebrow">YOUR PERSONAL COLLECTION</p>
          <h1>My Library</h1>
          <p className="library-subtitle">
            All the stories you&apos;ve saved, together in one place.
          </p>
        </div>
      </section>

      {/* Content Container (Stories Grid starts strictly below the banner) */}
      <div className="library-container">
        {error && <p className="library-error" role="alert">{error}</p>}

        {!error && savedStories.length === 0 && (
          <section className="empty-shelf">
            <span>🔖</span>
            <h2>Your library is waiting for a story.</h2>
            <p>
              Explore Inklings, find a story you love, and bookmark it
              to keep it here.
            </p>
            <Link href="/stories" className="empty-action-btn">
              Explore Stories
            </Link>
          </section>
        )}

        {savedStories.length > 0 && filteredStories.length === 0 && (
          <section className="empty-shelf">
            <p>No saved stories match your search.</p>
          </section>
        )}

        {filteredStories.length > 0 && (
          <section className="book-shelf-grid">
            {filteredStories.map(({ bookmark, story }) => (
              <article className="book-card" key={bookmark.id}>
                <div className="book-cover-art">
                  <span className="cover-ornament">❧</span>
                  <span className="cover-title">{story.title}</span>
                  <span className="cover-rule">✦ ─ ✦</span>
                  <span className="cover-subtitle">SAVED STORY</span>
                </div>

                <div className="book-details">
                  <span className="book-genre">{story.genre}</span>
                  <h3>{story.title}</h3>
                  <p className="book-author">By {story.author}</p>
                  <p className="book-description">{story.description}</p>

                  <Link className="read-hint" href={`/stories/${story.slug}`}>
                    Read story →
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}

        <div className="library-footer-nav">
          <Link href="/stories" className="nav-link">
            ← Explore more stories
          </Link>
        </div>
      </div>
    </main>
  );
}