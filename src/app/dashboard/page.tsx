import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listLeads } from "@/lib/leadService";

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-sage/20 text-ink",
  CONTACTED: "bg-amber-100 text-amber-800",
  QUALIFIED: "bg-emerald-100 text-emerald-800",
  WON: "bg-forest text-cream",
  LOST: "bg-red-100 text-red-700"
};

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const status = params.status as any;

  const { items, total, limit } = await listLeads(user, { status, page, limit: 20 });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="display-headline text-3xl">Leads</h1>
          <p className="mt-1 text-sm text-ink/60">
            {user.role === "ADMIN" ? "All leads across the team." : "Leads assigned to you."}
          </p>
        </div>
        <div className="flex gap-2">
          {["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"].map((s) => (
            <Link
              key={s}
              href={`/dashboard?status=${s}`}
              className="pill-nav-item border border-line text-xs"
              data-active={status === s}
            >
              {s}
            </Link>
          ))}
          <Link href="/dashboard" className="pill-nav-item border border-line text-xs">
            All
          </Link>
        </div>
      </div>

      <div className="card-surface overflow-hidden rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-cream/50 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Assigned to</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((lead) => (
              <tr key={lead.id} className="border-b border-line last:border-0 hover:bg-cream/40">
                <td className="px-5 py-3">
                  <Link href={`/dashboard/leads/${lead.id}`} className="font-semibold hover:underline">
                    {lead.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink/70">{lead.email}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[lead.status]}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-ink/70">{lead.assignedTo?.name ?? "Unassigned"}</td>
                <td className="px-5 py-3 text-ink/50">{new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/50">
                  No leads here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={`/dashboard?page=${i + 1}${status ? `&status=${status}` : ""}`}
              className="pill-nav-item border border-line"
              data-active={page === i + 1}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
