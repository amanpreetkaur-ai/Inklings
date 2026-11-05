"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { stories as sampleStories } from "@/data/stories";
import BookmarkButton from "@/components/stories/BookmarkButton";

type Story = {
  slug: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  content: string[];
  publishedId?: string;
};

type PublishedStory = {
  id: string;
  slug: string;
  title: string;
  genre: string;
  description: string | null;
  content: string | null;
  author_id: string;
  status: string;
};

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export default function StoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [readerId, setReaderId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [engagementError, setEngagementError] = useState("");
  const [notice, setNotice] = useState("");

  // Memoize client so its reference stays stable across renders
  const supabase = useMemo(() => createClient(), []);

  const loadEngagement = useCallback(
    async (publishedId: string, isCancelled?: () => boolean) => {
      const [
        {
          data: { user },
        },
        { data: likes, error: likesError },
        { data: commentRows, error: commentsError },
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("story_likes")
          .select("user_id")
          .eq("story_id", publishedId),
        supabase
          .from("story_comments")
          .select("id, user_id, content, created_at")
          .eq("story_id", publishedId)
          .order("created_at", { ascending: false }),
      ]);

      if (isCancelled?.()) return;

      setReaderId(user?.id ?? null);

      if (likesError || commentsError) {
        setEngagementError(
          "We couldn't load likes or comments. Please refresh the page."
        );
        return;
      }

      setLikeCount(likes?.length ?? 0);
      setLiked(
        !!user && (likes ?? []).some((like) => like.user_id === user.id)
      );
      setComments((commentRows ?? []) as Comment[]);
    },
    [supabase]
  );

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadStory() {
      setIsLoading(true);
      setLoadError("");
      setStory(null);
      setLiked(false);
      setLikeCount(0);
      setComments([]);
      setEngagementError("");
      setNotice("");

      try {
        const { data, error } = await supabase
          .from("published_stories")
          .select(
            "id, slug, title, genre, description, content, author_id, status"
          )
          .eq("slug", slug)
          .eq("status", "published")
          .maybeSingle();

        if (error) {
          console.error("Reader story lookup failed:", {
            slug,
            message: error.message,
            code: error.code,
            details: error.details,
          });
          throw error;
        }

        if (cancelled) return;

        console.log("Reader story lookup result:", {
          requestedSlug: slug,
          found: !!data,
          storyId: data?.id,
          storedSlug: data?.slug,
          status: data?.status,
        });

        if (data) {
          const publishedStory = data as PublishedStory;

          setStory({
            slug: publishedStory.slug,
            title: publishedStory.title,
            author: "Inklings Writer",
            genre: publishedStory.genre,
            description: publishedStory.description ?? "",
            content: publishedStory.content
              ? publishedStory.content.split(/\r?\n/).filter(Boolean)
              : [],
            publishedId: publishedStory.id,
          });

          await loadEngagement(publishedStory.id, () => cancelled);
        } else {
          const sampleStory = sampleStories.find((item) => item.slug === slug);

          if (sampleStory) {
            if (!cancelled) setStory(sampleStory);

            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!cancelled) setReaderId(user?.id ?? null);
          }
        }
      } catch (error) {
        console.error("Could not load story:", error);

        if (!cancelled) {
          setLoadError("We couldn't load this story. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadStory();

    return () => {
      cancelled = true;
    };
  }, [slug, supabase, loadEngagement]);

  async function handleLike() {
    if (!story?.publishedId) return;

    setEngagementError("");
    setNotice("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setReaderId(user?.id ?? null);

    if (!user) {
      setNotice("Please log in to your Reader account to like this story.");
      return;
    }

    setEngagementLoading(true);

    try {
      if (liked) {
        const { error } = await supabase
          .from("story_likes")
          .delete()
          .eq("story_id", story.publishedId)
          .eq("user_id", user.id);

        if (error) throw error;

        setLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      } else {
        const { error } = await supabase.from("story_likes").insert({
          story_id: story.publishedId,
          user_id: user.id,
        });

        if (error) {
          // Another request may already have created this like.
          if (error.code === "23505") {
            await loadEngagement(story.publishedId);
          } else {
            throw error;
          }
        } else {
          setLiked(true);
          setLikeCount((count) => count + 1);
        }
      }
    } catch (error) {
      console.error("Like update failed:", error);
      setEngagementError("Your like couldn't be updated. Please try again.");
    } finally {
      setEngagementLoading(false);
    }
  }

  async function handleComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!story?.publishedId) return;

    const text = commentText.trim();

    if (!text) return;

    if (text.length > 2000) {
      setEngagementError("Comments must be 2000 characters or fewer.");
      return;
    }

    setEngagementError("");
    setNotice("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setReaderId(user?.id ?? null);

    if (!user) {
      setNotice("Please log in to your Reader account to leave a comment.");
      return;
    }

    setCommentLoading(true);

    try {
      const { error } = await supabase.from("story_comments").insert({
        story_id: story.publishedId,
        user_id: user.id,
        content: text,
      });

      if (error) throw error;

      setCommentText("");
      await loadEngagement(story.publishedId);
      setNotice("Your comment has been posted!");
    } catch (error) {
      console.error("Comment submission failed:", error);
      setEngagementError("Your comment couldn't be posted. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!readerId) return;

    const confirmed = window.confirm("Delete your comment?");
    if (!confirmed) return;

    setEngagementError("");
    setNotice("");

    try {
      const { error } = await supabase
        .from("story_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", readerId);

      if (error) throw error;

      setComments((current) =>
        current.filter((comment) => comment.id !== commentId)
      );
      setNotice("Your comment has been deleted.");
    } catch (error) {
      console.error("Comment deletion failed:", error);
      setEngagementError("Couldn't delete the comment. Please try again.");
    }
  }

  async function handleShare() {
    try {
      const url = window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: story?.title ?? "Read on Inklings",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setNotice("Story link copied! Share it with your friends.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      try {
        await navigator.clipboard.writeText(window.location.href);
        setNotice("Story link copied! Share it with your friends.");
      } catch {
        setNotice("Couldn't copy the link. Please copy it from your browser.");
      }
    }
  }

  const isLikeDisabled = !story?.publishedId || engagementLoading;
  const isCommentSubmitDisabled = commentLoading || !commentText.trim();

  return (
    <main className="story-reader">
      <header className="dashboard-header">
        <Link href="/dashboard" className="dashboard-brand">
          Inklings
        </Link>

        <Link href="/stories">Explore Stories</Link>
      </header>

      <article className="story-content">
        <Link href="/stories" className="story-back-link">
          ← Back to stories
        </Link>

        {isLoading ? (
          <p role="status">Opening your story...</p>
        ) : loadError ? (
          <section className="stories-empty" role="alert">
            <h2>Unable to open story</h2>
            <p>{loadError}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </section>
        ) : !story ? (
          <section className="stories-empty">
            <h2>Story not found</h2>
            <p>This story may not exist or may no longer be published.</p>
            <Link href="/stories" className="story-read-link">
              Explore other stories →
            </Link>
          </section>
        ) : (
          <>
            <p className="story-genre">{story.genre}</p>
            <h1>{story.title}</h1>
            <p className="story-author">Written by {story.author}</p>
            <p className="story-description">{story.description}</p>

            <BookmarkButton storySlug={story.slug} />

            <hr />

            <div className="story-body">
              {story.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <hr />

            <section
              aria-label="Story reactions"
              style={{
                margin: "30px 0",
                padding: "22px",
                borderRadius: "16px",
                background: "#faf5f7",
                border: "1px solid #eadce2",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Enjoyed this piece? ♡</h2>
              <p>Show the writer some love or share their words.</p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                }}
              >
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={isLikeDisabled}
                  aria-pressed={liked}
                  style={actionButtonStyle(liked, isLikeDisabled)}
                >
                  {liked ? "♥ Liked" : "♡ Like"} · {likeCount}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  style={actionButtonStyle(false)}
                >
                  ↗ Share story
                </button>
              </div>

              {!story.publishedId && (
                <p style={{ fontSize: "13px", color: "#826a77" }}>
                  Likes and comments will be available for published stories
                  connected to Inklings.
                </p>
              )}

              {notice && (
                <p role="status" style={{ color: "#37664d" }}>
                  {notice}
                </p>
              )}

              {engagementError && (
                <p role="alert" style={{ color: "#a33148" }}>
                  {engagementError}
                </p>
              )}

              {!readerId && story.publishedId && (
                <p style={{ fontSize: "13px", color: "#826a77" }}>
                  Sign in to your Reader account to like or comment.
                </p>
              )}
            </section>

            {story.publishedId && (
              <section
                aria-label="Story comments"
                style={{ margin: "36px 0" }}
              >
                <h2>Words from readers 💬</h2>
                <p>{comments.length} comments</p>

                <form onSubmit={handleComment} style={{ margin: "20px 0" }}>
                  <label
                    htmlFor="story-comment"
                    style={{ display: "block", marginBottom: "8px" }}
                  >
                    Leave a thoughtful comment
                  </label>

                  <textarea
                    id="story-comment"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="What did this story make you feel or think?"
                    rows={4}
                    maxLength={2000}
                    required
                    style={{
                      display: "block",
                      boxSizing: "border-box",
                      width: "100%",
                      padding: "14px",
                      border: "1px solid #dfd0d8",
                      borderRadius: "12px",
                      font: "inherit",
                      resize: "vertical",
                    }}
                  />

                  <p style={{ fontSize: "12px", color: "#826a77" }}>
                    {commentText.length}/2000 characters
                  </p>

                  <button
                    type="submit"
                    disabled={isCommentSubmitDisabled}
                    style={actionButtonStyle(false, isCommentSubmitDisabled)}
                  >
                    {commentLoading ? "Posting..." : "Post comment"}
                  </button>
                </form>

                <div style={{ display: "grid", gap: "14px" }}>
                  {comments.length === 0 ? (
                    <p>
                      No comments yet. Be the first to share what you thought.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          padding: "16px",
                          border: "1px solid #eee3e7",
                          borderRadius: "12px",
                          background: "#fffdfd",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <strong>
                            {comment.user_id === readerId
                              ? "You"
                              : "Inklings Reader"}
                          </strong>

                          <span
                            style={{ fontSize: "12px", color: "#826a77" }}
                          >
                            {new Date(comment.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>

                        <p
                          style={{
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {comment.content}
                        </p>

                        {readerId === comment.user_id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#a33148",
                              padding: 0,
                              cursor: "pointer",
                            }}
                          >
                            Delete my comment
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            <hr />

            <Link href="/stories" className="story-read-link">
              Discover another story →
            </Link>
          </>
        )}
      </article>
    </main>
  );
}

function actionButtonStyle(
  active: boolean,
  disabled = false
): React.CSSProperties {
  return {
    border: "1px solid #d9c0cc",
    borderRadius: "10px",
    padding: "11px 16px",
    background: active ? "#754d60" : "#fff",
    color: active ? "#fff" : "#754d60",
    font: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}