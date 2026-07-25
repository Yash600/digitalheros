import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-card/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-lg font-extrabold tracking-tight">
              lead<span className="text-forest">flow</span>
            </Link>
            <nav className="hidden gap-1 sm:flex">
              <Link href="/dashboard" className="pill-nav-item">Leads</Link>
              {user?.role === "ADMIN" && (
                <Link href="/dashboard/users" className="pill-nav-item">Team</Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="rounded-pill border border-line bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-wide text-forest">
                {user.role}
              </span>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
