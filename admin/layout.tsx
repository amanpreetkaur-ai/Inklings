
import Link from "next/link";
import { requireAdmin } from "@/lib/permissions";
import { connection } from "next/server";


const navigation = [
  { label: "Overview", href: "/admin", icon: "⌂" },
  { label: "Authors", href: "/admin/authors", icon: "✎" },
  { label: "Books", href: "/admin/books", icon: "▤" },
  { label: "Genres", href: "/admin/genres", icon: "◇" },
  { label: "Languages", href: "/admin/languages", icon: "文" },
  { label: "Users", href: "/admin/users", icon: "♙" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  await connection();
  
  const admin = await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          Inklings<span>.</span>
          <small>ADMIN STUDIO</small>
        </Link>

        <p className="admin-nav-heading">WORKSPACE</p>

        <nav className="admin-navigation">
          {navigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className="admin-nav-link"
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="admin-nav-heading admin-bottom-heading">
          CONTENT
        </p>

        <nav className="admin-navigation">
          <Link href="/admin/featured" className="admin-nav-link">
            <span className="admin-nav-icon">✧</span>
            Featured Content
          </Link>

          <Link href="/admin/moderation" className="admin-nav-link">
            <span className="admin-nav-icon">♡</span>
            Moderation
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-avatar">A</span>
          <div>
            <strong>{admin.displayName}</strong>
            <small>Administrator</small>
          </div>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-label">INKLINGS / ADMIN</span>
          </div>
          <Link href="/" className="admin-view-site">
            View Website ↗
          </Link>
        </header>

        <div className="admin-content">{children}</div>
      </section>
    </div>
  );
}
