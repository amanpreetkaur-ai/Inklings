
"use client";

import { useEffect, useState } from "react";
import { createWriterClient } from "@/lib/supabase/writer-client";

export default function WriterProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteGenre, setFavoriteGenre] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createWriterClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setMessage("Please log in to your Writer account first.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("writer_profiles")
        .select("display_name, bio, favorite_genre, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setMessage("Could not load your profile: " + error.message);
      } else if (data) {
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setFavoriteGenre(data.favorite_genre ?? "");
        setAvatarUrl(data.avatar_url ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!userId) {
      setMessage("Please log in to your Writer account first.");
      return;
    }

    if (!displayName.trim()) {
      setMessage("Please enter your display name.");
      return;
    }

    setSaving(true);

    const supabase = createWriterClient();

    const { error } = await supabase
      .from("writer_profiles")
      .upsert(
        {
          id: userId,
          display_name: displayName.trim(),
          bio: bio.trim(),
          favorite_genre: favoriteGenre || null,
          avatar_url: avatarUrl.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      setMessage("Could not save your profile: " + error.message);
    } else {
      setMessage("Your profile has been saved successfully!");
    }

    setSaving(false);
  }

  if (loading) {
    return <main style={{ padding: "40px" }}>Loading your profile...</main>;
  }

  return (
    <main
      style={{
        maxWidth: "720px",
        margin: "40px auto",
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
        Your Writer Profile
      </h1>

      <p style={{ marginBottom: "28px", color: "#666" }}>
        Tell readers a little about the person behind your stories.
      </p>

      {avatarUrl.trim() && (
        <div style={{ marginBottom: "20px" }}>
          <img
            src={avatarUrl}
            alt="Profile preview"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #ddd",
            }}
          />
        </div>
      )}

      <form onSubmit={saveProfile}>
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="displayName"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Display Name *
          </label>

          <input
            id="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="What should readers call you?"
            required
            maxLength={80}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="bio"
            style={{ display: "block", marginBottom: "8px" }}
          >
            About You
          </label>

          <textarea
            id="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Write a little introduction about yourself..."
            rows={5}
            maxLength={1000}
            style={inputStyle}
          />

          <small>{bio.length}/1000 characters</small>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="favoriteGenre"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Favorite Genre
          </label>

          <select
            id="favoriteGenre"
            value={favoriteGenre}
            onChange={(event) => setFavoriteGenre(event.target.value)}
            style={inputStyle}
          >
            <option value="">Choose a genre</option>
            <option value="Romance">Romance</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Mystery">Mystery</option>
            <option value="Thriller">Thriller</option>
            <option value="Horror">Horror</option>
            <option value="Science Fiction">Science Fiction</option>
            <option value="Poetry">Poetry</option>
            <option value="Drama">Drama</option>
            <option value="Historical Fiction">Historical Fiction</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            htmlFor="avatarUrl"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Profile Picture URL
          </label>

          <input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://example.com/your-picture.jpg"
            style={inputStyle}
          />

          <small>Paste a direct link to an image.</small>
        </div>

        {message && (
          <p role="status" style={{ marginBottom: "18px" }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: "8px",
            background: "#244b63",
            color: "white",
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  font: "inherit",
  boxSizing: "border-box",
  background: "transparent",
};
