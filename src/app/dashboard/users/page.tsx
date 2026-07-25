import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  await requireRole("ADMIN");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <h1 className="display-headline text-3xl">Team</h1>
      <p className="mt-1 text-sm text-ink/60">Admin-only. Roles are stored server-side and enforced on every request.</p>
      <div className="card-surface mt-6 overflow-hidden rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-cream/50 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 font-semibold">{u.name ?? "—"}</td>
                <td className="px-5 py-3 text-ink/70">{u.email}</td>
                <td className="px-5 py-3">
                  <span className="rounded-pill bg-forest px-2.5 py-1 text-xs font-semibold text-cream">
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
