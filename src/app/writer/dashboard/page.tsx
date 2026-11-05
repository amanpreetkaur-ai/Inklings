
import Link from "next/link";
import { redirect } from "next/navigation";
import { createWriterServerClient } from "@/lib/supabase/writer-server";
import { createClient } from "@supabase/supabase-js";

type WriterStory = {
  id: string;
  title: string;
  slug: string;
  genre: string | null;
  description: string | null;
  status: string;
  updated_at: string | null;
};

export default async function WriterDashboardPage() {
  const supabase = await createWriterServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/writer/login");
  }

  
  const [
    { data: profile, error: profileError },
    { data: stories, error: storiesError },
    { count: totalWorks },
    { count: totalPublished },
    { count: totalDrafts },
  ] = await Promise.all([
    supabase
      .from("writer_profiles")
      .select("display_name, bio, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("stories")
      .select("id, title, slug, genre, description, status, updated_at")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(6),

    supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id),

    supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .eq("status", "published"),

    supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .eq("status", "draft"),
  ]);

  const readerUrl = process.env.READER_SUPABASE_URL;
  const readerServiceKey =
    process.env.READER_SUPABASE_SERVICE_ROLE_KEY;

  const readerSupabase =
    readerUrl && readerServiceKey
      ? createClient(readerUrl, readerServiceKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : null;

  const {
    data: readerStories,
    error: readerStoriesError,
  } = readerSupabase
    ? await readerSupabase
        .from("published_stories")
        .select("id, title, slug")
        .eq("author_id", user.id)
        .eq("status", "published")
    : { data: null, error: new Error("Reader Supabase is not configured") };

  const readerStoryIds = (readerStories || []).map(
    (story) => story.id
  );

  const [
    { data: likes, error: likesError },
    { data: comments, error: commentsError },
  ] =
    readerSupabase && readerStoryIds.length > 0
      ? await Promise.all([
          readerSupabase
            .from("story_likes")
            .select("story_id")
            .in("story_id", readerStoryIds),

          readerSupabase
            .from("story_comments")
            .select("story_id")
            .in("story_id", readerStoryIds),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
        ];

  const engagementByStory: Record<
    string,
    { likes: number; comments: number }
  > = {};

  for (const id of readerStoryIds) {
    engagementByStory[id] = { likes: 0, comments: 0 };
  }

  for (const like of likes || []) {
    if (engagementByStory[like.story_id]) {
      engagementByStory[like.story_id].likes += 1;
    }
  }

  for (const comment of comments || []) {
    if (engagementByStory[comment.story_id]) {
      engagementByStory[comment.story_id].comments += 1;
    }
  }

  const totalLikes = (likes || []).length;
  const totalComments = (comments || []).length;


  const penName =
    profile?.display_name?.trim() ||
    user.user_metadata?.full_name ||
    "Inklings Writer";

  const writerBio = profile?.bio?.trim() || "";
  const avatarUrl = profile?.avatar_url || "";
  const allStories = (stories || []) as WriterStory[];

  const publishedStories = allStories.filter(
    (story) => story.status === "published"
  );

  const draftStories = allStories.filter(
    (story) => story.status === "draft"
  );

  function formatDate(date: string | null) {
    if (!date) return "Recently";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="studio-page">
      

      <header className="studio-nav">
        <Link href="/" className="studio-brand">
          Inklings
        </Link>
        <span className="studio-nav-label">YOUR WRITER'S STUDIO</span>
      </header>

      <div className="studio-container">
        <p className="studio-eyebrow">A home for your imagination</p>

        <section className="studio-hero">
          <div className="studio-profile">
            <div className="studio-avatar">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={`${penName}'s profile`} />
              ) : (
                <span aria-label="Default profile picture">✍️</span>
              )}
            </div>

            <div>
              <p className="studio-eyebrow">THE PERSON BEHIND THE WORDS</p>
              <h1 className="studio-name">{penName}</h1>

              <p className="studio-bio">
                {writerBio ||
                  "Every writer has a world within them. This is where yours begins. Add a bio to share your thoughts, your inspirations, and the stories you hope to tell."}
              </p>
            </div>
          </div>

          <div className="studio-actions">
            <Link
              href="/writer/stories/new"
              className="studio-button studio-button-primary"
            >
              ✒ Write something
            </Link>

            <Link href="/writer/profile" className="studio-button">
              ♡ Edit profile
            </Link>

            <Link href="/writer/stories" className="studio-button">
              ◫ Manage my works
            </Link>
          </div>
        </section>

        <section className="studio-stats" aria-label="Your writing overview">
          
  <div className="studio-stat">
    <span>YOUR WORKS</span>
    <strong>{storiesError ? "—" : totalWorks ?? 0}</strong>
    <span>All your stories and drafts</span>
  </div>

  <div className="studio-stat">
    <span>PUBLISHED</span>
    <strong>{storiesError ? "—" : totalPublished ?? 0}</strong>
    <span>Stories shared with readers</span>
  </div>

  <div className="studio-stat">
    <span>IN PROGRESS</span>
    <strong>{storiesError ? "—" : totalDrafts ?? 0}</strong>
    <span>Drafts waiting for their moment</span>
  </div>

        </section>

        
  <section className="studio-stats" aria-label="Reader engagement">
    <div className="studio-stat">
      <span>♡ TOTAL LIKES</span>
      <strong>
        {readerStoriesError || likesError ? "—" : totalLikes}
      </strong>
      <span>Likes on your published stories</span>
    </div>

    <div className="studio-stat">
      <span>✉ TOTAL COMMENTS</span>
      <strong>
        {readerStoriesError || commentsError ? "—" : totalComments}
      </strong>
      <span>Comments from your readers</span>
    </div>

    <div className="studio-stat">
      <span>📚 READER CONNECTIONS</span>
      <strong>
        {readerStoriesError ? "—" : readerStoryIds.length}
      </strong>
      <span>Stories available to readers</span>
    </div>
  </section>


        <section>
          <div className="studio-section-heading">
            <div>
              <p className="studio-eyebrow">FROM YOUR DESK</p>
              <h2>My recent works</h2>
            </div>

            <Link href="/writer/stories" className="studio-button">
              View all works →
            </Link>
          </div>

          <div className="studio-work-grid">
            {storiesError ? (
              <div className="studio-empty">
                <div className="studio-empty-icon">📖</div>
                <h3>Your works couldn't be loaded</h3>
                <p className="studio-muted">
                  Please refresh the page. If this continues, check the
                  stories table permissions in your Writer Supabase project.
                </p>
              </div>
            ) : allStories.length === 0 ? (
              <div className="studio-empty">
                <div className="studio-empty-icon">🪶</div>
                <h3>Your next favourite work starts here</h3>
                <p className="studio-muted">
                  A poem, a story, a thought at midnight — every piece
                  belongs somewhere. Let this be the beginning.
                </p>
                <div className="studio-actions" style={{ justifyContent: "center" }}>
                  <Link
                    href="/writer/stories/new"
                    className="studio-button studio-button-primary"
                  >
                    Write your first story
                  </Link>
                </div>
              </div>
            ) : (
              allStories.map((story) => (
                <Link
                  key={story.id}
                  href="/writer/stories"
                  className="studio-work-card"
                >
                  <span className="studio-tag">
                    {story.genre || "Creative writing"}
                  </span>

                  <h3>{story.title}</h3>

                  <p>
                    {story.description?.trim() ||
                      "A new piece of your imagination, taking shape one word at a time."}
                  </p>

                  <div className="studio-status">
                    <span>
                      {story.status === "published"
                        ? "● Published"
                        : "○ Draft"}
                    </span>
                    {" · "}
                    Updated {formatDate(story.updated_at)}
                  </div>
                  {story.status === "published" &&(
                    <div className="studio-status">
                      ♡{" "}
      {engagementByStory[story.id]?.likes ?? 0} likes
      {" · "}
      ✉{" "}
      {engagementByStory[story.id]?.comments ?? 0} comments
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="studio-section-heading">
            <div>
              <p className="studio-eyebrow">KEEP THE WORDS FLOWING</p>
              <h2>Your creative corner</h2>
            </div>
          </div>

          <div className="studio-work-grid">
            <Link href="/writer/stories/new" className="studio-work-card">
              <span className="studio-tag">Start fresh</span>
              <h3>✍️ A blank page</h3>
              <p>
                Begin a story, write a poem, or capture a thought before
                it slips away.
              </p>
              <span className="studio-status">Create a new work →</span>
            </Link>

            <Link href="/writer/profile" className="studio-work-card">
              <span className="studio-tag">Your identity</span>
              <h3>🌷 Your writer's note</h3>
              <p>
                Tell readers who you are, what you believe in, and what
                inspires the words you write.
              </p>
              <span className="studio-status">Update your bio →</span>
            </Link>
          </div>
        </section>

        {profileError && (
          <p className="studio-muted" role="status">
            Your profile details could not be loaded. You can still edit
            your profile and try again.
          </p>
        )}

        <footer className="studio-footer">
          Made of stories, little thoughts, and endless possibilities. · Inklings
        </footer>
      </div>
    </main>
  );
}
