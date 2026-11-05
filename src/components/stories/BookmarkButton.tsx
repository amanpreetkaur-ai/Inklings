
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type BookmarkButtonProps = {
  storySlug: string;
};

export default function BookmarkButton({
  storySlug,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBookmark() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          if (active) {
            setMessage("Log in to save stories to your library.");
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", user.id)
          .eq("story_slug", storySlug)
          .maybeSingle();

        if (error) throw error;

        if (active) {
          setIsBookmarked(Boolean(data));
        }
      } catch {
        if (active) {
          setMessage("Couldn't check your bookmark. Please refresh the page.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBookmark();

    return () => {
      active = false;
    };
  }, [storySlug]);

  async function toggleBookmark() {
    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setMessage("Please log in to bookmark this story.");
        return;
      }

      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("story_slug", storySlug);

        if (error) throw error;

        setIsBookmarked(false);
        setMessage("Removed from My Library.");
      } else {
        const { error } = await supabase.from("bookmarks").insert({
          user_id: user.id,
          story_slug: storySlug,
        });

        if (error) throw error;

        setIsBookmarked(true);
        setMessage("Saved to My Library!");
      }
    } catch {
      setMessage("Couldn't update your bookmark. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bookmark-control">
      <button
        type="button"
        className="bookmark-button"
        onClick={toggleBookmark}
        disabled={loading || saving}
        aria-pressed={isBookmarked}
      >
        {loading
          ? "Checking library..."
          : saving
            ? "Saving..."
            : isBookmarked
              ? "🔖 Remove bookmark"
              : "＋ Bookmark story"}
      </button>

      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
