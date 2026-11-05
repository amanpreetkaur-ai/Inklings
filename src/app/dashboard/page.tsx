
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";

  const displayName = fullName || user.email || "Reader";

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link href="/" className="dashboard-brand">
          Inklings
        </Link>

        <div className="dashboard-header-actions">
          <span className="dashboard-label">MY DASHBOARD</span>
          <LogoutButton />
        </div>
      </header>

      <section className="dashboard-welcome">
        <p className="dashboard-eyebrow">
          YOUR LITTLE CORNER OF STORIES
        </p>

        <h1>Welcome back, {displayName}!</h1>

        <p className="dashboard-description">
          Every reader has a story. Every writer has a beginning.
          What will yours be today?
        </p>

        <div className="dashboard-profile">
          <div className="dashboard-avatar">
            {(fullName || user.email || "U").charAt(0).toUpperCase()}
          </div>

          <div>
            <h2>Your account</h2>
            <p>{user.email}</p>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <Link href="/stories" className="dashboard-card">
          <span>📚</span>
          <h2>Explore Stories</h2>
          <p>Find your next favourite read.</p>
        </Link>

        <Link href="/my-library" className="dashboard-card">
          <span>🔖</span>
          <h2>My Library</h2>
          <p>Keep your favourite stories close.</p>
        </Link>

        <Link href="/writer" className="dashboard-card">
          <span>✍️</span>
          <h2>My Writing</h2>
          <p>Start creating your own stories.</p>
        </Link>
      </section>
    </main>
  );
}
