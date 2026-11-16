
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import UserManagement from "./UserManagement";

type UsersPageProps = {
  searchParams: Promise<{ search?: string; role?: string }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || "";
  const role = params.role || "ALL";
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { username: { contains: search, mode: "insensitive" } },
                { displayName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        role !== "ALL" ? { role: role as "READER" | "WRITER" | "ADMIN" } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const [totalUsers, readers, writers, admins, activeUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "READER" } }),
      prisma.user.count({ where: { role: "WRITER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

  const stats = [
    { label: "Total Users", value: totalUsers },
    { label: "Readers", value: readers },
    { label: "Writers", value: writers },
    { label: "Administrators", value: admins },
    { label: "Active Accounts", value: activeUsers },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-welcome">
        <div>
          <span className="admin-eyebrow">PLATFORM MANAGEMENT</span>
          <h1>User Management</h1>
          <p>Manage every reader, writer and administrator on Inklings.</p>
        </div>
      </div>

      <section className="admin-stats">
        {stats.map((stat) => (
          <article className="admin-stat-card" key={stat.label}>
            <p>{stat.label}</p>
            <h2>{stat.value}</h2>
          </article>
        ))}
      </section>

      <section className="admin-management">
        <div className="admin-section-heading">
          <div>
            <span className="admin-eyebrow">ALL ACCOUNTS</span>
            <h2>Platform Users</h2>
          </div>
        </div>

        <form className="admin-user-filters" action="/admin/users">
          <input
            type="search"
            name="search"
            placeholder="Search by name or username..."
            defaultValue={search}
          />

          <select name="role" defaultValue={role}>
            <option value="ALL">All Roles</option>
            <option value="READER">Readers</option>
            <option value="WRITER">Writers</option>
            <option value="ADMIN">Administrators</option>
          </select>

          <button type="submit">Search</button>
        </form>

        <div className="admin-user-table-wrapper">
          <table className="admin-user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.displayName}</td>
                  <td>@{user.username}</td>
                  <td>{user.role}</td>
                  <td>
                    <span
                      className={
                        user.isActive
                          ? "admin-status-active"
                          : "admin-status-inactive"
                      }
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td>
  <UserManagement
    user={user}
    canAssignAdmin={admin.isPrimaryAdmin}
    currentAdminId={admin.id}
  />
</td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
