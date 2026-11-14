"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import './page.css'

type Story = {
  id: string;
  title: string;
  slug: string;
  genre: string | null;
  description: string | null;
  author_id: string;
  published_at: string | null;
  cover_image_url: string | null;
};

const genres = [
  "Fiction",
  "Romance",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Horror",
  "Science Fiction",
  "Poetry",
  "Young Adult",
  "Historical Fiction",
];

const languages = ["English", "Hindi", "Punjabi", "Urdu"];

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [genresOpen, setGenresOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);

  useEffect(() => {
    async function loadStories() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("published_stories")
        .select(
          "id, title, slug, genre, description, author_id, published_at, cover_image_url"
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(40);

      if (!error && data) {
        setStories(data as Story[]);
      }

      setLoading(false);
    }

    loadStories();
  }, []);

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      `${story.title} ${story.genre || ""} ${story.description || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesGenre =
      selectedGenre === "All" ||
      story.genre?.toLowerCase() === selectedGenre.toLowerCase();

    return matchesSearch && matchesGenre;
  });

  const recentStories = [...stories].sort(
    (a, b) =>
      new Date(b.published_at || 0).getTime() -
      new Date(a.published_at || 0).getTime()
  );

  function shelf(title: string, items: Story[]) {
    return (
      <section className="library-section" key={title}>
        <div className="section-heading">
          <div>
            <p className="section-kicker">A LITTLE SOMETHING TO READ</p>
            <h2>{title}</h2>
          </div>
          <span className="section-count">
            {items.length} {items.length === 1 ? "story" : "stories"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="empty-shelf">
            <span>❧</span>
            <p>No stories here just yet. Your next favourite may arrive soon.</p>
          </div>
        ) : (
          <div className="book-shelf">
            {items.map((story) => {
              return (
                <Link
                  key={story.id}
                  href={`/stories/${encodeURIComponent(story.slug)}`}
                  className="book-card"
                  aria-label={`Open ${story.title}`}
                >
                  <div
                    className="book-cover-art"
                    style={story.cover_image_url ? { backgroundImage: `url("${story.cover_image_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {!story.cover_image_url && (
                      <>
                        <span className="cover-ornament">❧</span>
                        <span className="cover-title">{story.title}</span>
                        <span className="cover-rule">✦ ─ ✦</span>
                        <span className="cover-subtitle">AN INKLINGS STORY</span>
                      </>
                    )}
                  </div>

                  <div className="book-details">
                    <span className="book-genre">
                      {story.genre || "Creative writing"}
                    </span>
                    <h3>{story.title}</h3>
                    <p className="book-author">An Inklings writer</p>
                    <p className="book-description">
                      {story.description?.trim() ||
                        "A story waiting to be discovered."}
                    </p>
                    <span className="read-hint">Discover story →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <main className="library">
      
      <header className="topbar">
        <Link href="/" className="brand">
          <span>Inklings!</span>
        </Link>

        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search stories, genres..."
            aria-label="Search published stories"
          />
        </label>

        <div className="account-links">
          <Link href="/signup" className="nav-link">
            <span>Reader sign in</span>
          </Link>
          <Link href="/writer/login" className="nav-link nav-primary">
            Writer sign in
          </Link>
        </div>
      </header>

      <div className="library-layout full-width-layout">
        

        <div className="main-content">
          
          {search || selectedGenre !== "All" ? (
            <section className="library-section">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">YOUR DISCOVERY SHELF</p>
                  <h2>Search results</h2>
                </div>
                <button
                  className="side-button"
                  onClick={() => {
                    setSearch("");
                    setSelectedGenre("All");
                  }}
                >
                  Clear filters ×
                </button>
              </div>
              {loading ? (
                <p>Gathering stories for you…</p>
              ) : (
                <div className="book-shelf">
                  {filteredStories.map((story) => {
                    return (
                      <Link
                        key={story.id}
                        href={`/stories/${encodeURIComponent(story.slug)}`}
                        className="book-card"
                      >
                        <div
                          className="book-cover-art"
                          style={story.cover_image_url ? { backgroundImage: `url("${story.cover_image_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                        >
                          {!story.cover_image_url && (
                            <>
                              <span className="cover-ornament">❧</span>
                              <span className="cover-title">{story.title}</span>
                              <span className="cover-rule">✦ ─ ✦</span>
                              <span className="cover-subtitle">AN INKLINGS STORY</span>
                            </>
                          )}
                        </div>
                        <div className="book-details">
                          <span className="book-genre">{story.genre || "Creative writing"}</span>
                          <h3>{story.title}</h3>
                          <p className="book-author">An Inklings writer</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
              {!loading && filteredStories.length === 0 && (
                <div className="empty-shelf">No matching stories found. Try another search.</div>
              )}
            </section>
          ) : (
            <>
              <section className="library-section">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">FRESH FROM OUR WRITERS</p>
                    <h2>Inklings Exclusive</h2>
                  </div>
                </div>

                {loading ? (
                  <div className="empty-shelf">Gathering the latest stories…</div>
                ) : shelf("Recently added", recentStories)}
              </section>

              
            </>
          )}

          {/* Side-by-Side Browse Boxes */}
          <div className="browse-boxes-grid">
            {/* Explore Genres Box */}
            <section className="browse-options">
              <button
                type="button"
                className="browse-toggle"
                onClick={() => setGenresOpen(!genresOpen)}
                aria-expanded={genresOpen}
              >
                <span>Explore genres</span>
                <span>{genresOpen ? "−" : "+"}</span>
              </button>

              {genresOpen && (
                <div className="browse-items">
                  <button
                    className={`side-button ${selectedGenre === "All" ? "active" : ""}`}
                    onClick={() => setSelectedGenre("All")}
                  >
                    All stories
                  </button>

                  {genres.map((genre) => (
                    <button
                      key={genre}
                      className={`side-button ${selectedGenre === genre ? "active" : ""}`}
                      onClick={() => setSelectedGenre(genre)}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Read in Your Language Box */}
            <section className="browse-options">
              <button
                type="button"
                className="browse-toggle"
                onClick={() => setLanguagesOpen(!languagesOpen)}
                aria-expanded={languagesOpen}
              >
                <span>Read in your language</span>
                <span>{languagesOpen ? "−" : "+"}</span>
              </button>

              {languagesOpen && (
                <div className="browse-items">
                  {languages.map((language) => (
                    <span className="language-chip" key={language}>
                      {language}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="browse-banner">
            <div>
              <h2><span>Have a story of your own?</span></h2>
              <p>Give your imagination a home. Your next chapter begins here.</p>
            </div>
            <Link href="/writer/signup">Become a writer →</Link>
          </section>


          <footer className="site-footer">
            Made of stories, little thoughts, and endless possibilities. · Inklings
          </footer>
        </div>
      </div>
    </main>
  );
}