import { requireAdmin } from "@/lib/permissions";

export default async function AdminDashboard() {
  const admin = await requireAdmin();

  return (
    <main>
      <h1>Inklings Admin Dashboard</h1>

      <p>Welcome, {admin.displayName}!</p>

      <p>
        Manage your writers, books, genres and languages.
      </p>
    </main>
  );
}