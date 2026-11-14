
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { stories as sampleStories } from "@/data/stories";
import { createClient } from "@/lib/supabase/client";

type ReaderStory = {
  id: string;
  title: string;
  slug: string;
  genre: string;
  description: string | null;
  content: string | null;
  author_id: string;
  published_at: string;
};

type Story = {
  slug: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  content: string[];
};

export default function StoriesPage() {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [publishedStories, setPublishedStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadPublishedStories() {
      setIsLoading(true);
      setLoadError("");

      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("published_stories")
          .select(
            "id, title, slug, genre, description, content, author_id, published_at"
          )
          .eq("status", "published")
          .order("published_at", { ascending: false });

        if (error) {
          throw error;
        }

        const databaseStories: Story[] = (data as ReaderStory[]).map(
          (story) => ({
            slug: story.slug,
            title: story.title,
            author: "Inklings Writer",
            genre: story.genre,
            description: story.description ?? "",
            content: story.content
              ? story.content.split(/\r?\n/).filter(Boolean)
              : [],
          })
        );

        setPublishedStories(databaseStories);
      } catch (error) {
        console.error("Could not load published stories:", error);
        setLoadError(
          "We couldn't load published stories. Please try refreshing the page."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadPublishedStories();
  }, []);

  const allStories = useMemo(() => {
    const publishedSlugs = new Set(
      publishedStories.map((story) => story.slug)
    );

    return [
      ...publishedStories,
      ...sampleStories.filter((story) => !publishedSlugs.has(story.slug)),
    ];
  }, [publishedStories]);

  const genres = useMemo(
    () => [
      "All",
      ...Array.from(new Set(allStories.map((story) => story.genre))).sort(),
    ],
    [allStories]
  );

  const filteredStories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allStories.filter((story) => {
      const matchesGenre =
        selectedGenre === "All" || story.genre === selectedGenre;

      const matchesSearch =
        !query ||
        story.title.toLowerCase().includes(query) ||
        story.author.toLowerCase().includes(query) ||
        story.genre.toLowerCase().includes(query) ||
        story.description.toLowerCase().includes(query);

      return matchesGenre && matchesSearch;
    });
  }, [allStories, search, selectedGenre]);

  return (
    <main className="stories-page">
      <header className="dashboard-header">
        <Link href="/dashboard" className="dashboard-brand">
          Inklings
        </Link>

        <Link href="/dashboard">My Dashboard</Link>
      </header>

      <section className="stories-intro">
        <p>YOUR NEXT CHAPTER STARTS HERE</p>
        <h1>Explore Stories</h1>
        <p>
          Find new worlds, unforgettable characters, and stories
          worth staying up for.
        </p>
      </section>

      <section className="stories-controls">
        <label htmlFor="story-search">Search stories</label>
        <input
          id="story-search"
          type="search"
          placeholder="Search by title, author, genre..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <label htmlFor="genre-filter">Filter by genre</label>
        <select
          id="genre-filter"
          value={selectedGenre}
          onChange={(event) => setSelectedGenre(event.target.value)}
        >
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </section>

      {isLoading && (
        <p role="status">Discovering stories for you...</p>
      )}

      {loadError && (
        <section className="stories-empty" role="alert">
          <h2>Stories couldn&apos;t load</h2>
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </section>
      )}

      {!isLoading && !loadError && (
        <>
          <p aria-live="polite">
            {filteredStories.length}{" "}
            {filteredStories.length === 1 ? "story" : "stories"} found
          </p>

          {filteredStories.length > 0 ? (
            <section className="stories-grid">
              {filteredStories.map((story) => (
                <article className="story-card" key={story.slug}>
                  <p className="story-genre">{story.genre}</p>
                  <h2>{story.title}</h2>
                  <p className="story-author">By {story.author}</p>
                  <p>{story.description}</p>

                  <Link
                    className="story-read-link"
                    href={`/stories/${story.slug}`}
                  >
                    Read story →
                  </Link>
                </article>
              ))}
            </section>
          ) : (
            <section className="stories-empty">
              <h2>No stories found</h2>
              <p>Try another title, author, or genre.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedGenre("All");
                }}
              >
                Clear filters
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );
}
